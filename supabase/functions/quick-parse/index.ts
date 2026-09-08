// Edge Function: quick-parse (Google Gemini, camada gratuita)
// Recebe uma frase em pt-BR + as categorias do usuário e devolve os lançamentos
// estruturados. A chave do Gemini fica só aqui, no servidor. Só usuários
// autenticados no Supabase (role "authenticated") conseguem chamar.

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.1-flash-lite";

const SYSTEM = `Você converte frases em português do Brasil sobre gastos e receitas em lançamentos financeiros estruturados.

Responda SOMENTE com um objeto JSON válido no formato:
{"transactions":[{"type":"expense|income","amount":number,"title":string,"categoryId":string,"date":"YYYY-MM-DD","breakdown":[{"title":string,"amount":number}]}]}

Regras:
- Por padrão, crie UM lançamento por item mencionado.
- amount: valor em reais como número com ponto decimal. "23 com 75" e "23 e 75" = 23.75. "6 e 95" = 6.95. "150" = 150. "1.200,50" = 1200.50.
- Entenda correções na fala ("na verdade", "perdão"): use o valor corrigido, não o errado.
- Entenda quantidades: "2 molho pronto ... 6,95 cada" = DOIS lançamentos de 6,95. Se o preço for do conjunto, divida.
- Ignore enfeites e ruído de fala ("certo?", "ó", "vamos lá", "beleza", "é isso", "faça aí pra mim", palavras sem sentido).
- OBEDEÇA instruções faladas sobre o formato:
  • Se pedir para juntar numa só saída/entrada ("uma saída só", "tudo junto", "junta tudo", "numa saída só com vírgula"), retorne UM ÚNICO lançamento: amount = soma de TODOS os valores; title = os nomes dos itens separados por vírgula; e preencha "breakdown" com cada item {title, amount}.
  • Se indicar uma categoria para os itens ("vão na categoria X", "tudo em X"), aplique o id dessa categoria a todos.
- breakdown: só quando juntar vários itens num único lançamento (a soma dos amounts do breakdown deve ser igual ao amount). Para lançamento de item único, use [] ou omita.
- type: "income" quando for receber/ganhar/salário/vendi/entrada; caso contrário "expense".
- categoryId: escolha o id da categoria da lista fornecida que melhor combina com o item; se nenhuma combinar, use "".
- title: nome curto e limpo, começando com letra maiúscula (ex.: "Carne moída", "Vinho"). Nunca inclua o valor ou enfeites no título.
- date: use a data de hoje informada; interprete "hoje", "ontem", "anteontem", "dia N", "DD/MM".
- Se não houver valor, use 0. Nunca invente categorias fora da lista.`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}

// Só usuários logados (role "authenticated") podem chamar — a chave anônima
// pública (role "anon") é rejeitada, evitando abuso/custo por terceiros.
function callerRole(auth: string | null): string | null {
  const m = (auth || "").match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const parts = m[1].split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function extractJson(text: string): any {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* continua */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* nada */ }
  }
  return {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "método não permitido" }, 405);

  try {
    if (callerRole(req.headers.get("Authorization")) !== "authenticated") {
      return json({ error: "não autorizado" }, 401);
    }
    if (!GEMINI_API_KEY) return json({ error: "IA não configurada" }, 503);

    const body = await req.json().catch(() => ({}));
    const text: string = typeof body.text === "string" ? body.text : "";
    const today: string = typeof body.today === "string" ? body.today : new Date().toISOString().slice(0, 10);
    const categories: any[] = Array.isArray(body.categories) ? body.categories.slice(0, 80) : [];

    if (!text.trim()) return json({ error: "texto vazio" }, 400);
    if (text.length > 2000) return json({ error: "texto muito longo" }, 400);

    const catList = categories.map((c) => `${c.id}\t${c.name}\t${c.type ?? "expense"}`).join("\n");
    const userMsg =
      `Data de hoje: ${today}\n\n` +
      `Categorias disponíveis (id, nome, tipo):\n${catList || "(nenhuma)"}\n\n` +
      `Frase: "${text.trim()}"`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": GEMINI_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userMsg }] }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 2048, // suficiente para listas longas (lista de compras inteira)
          responseMimeType: "application/json",
        },
      }),
    });

    if (!resp.ok) {
      const detail = (await resp.text()).slice(0, 300);
      return json({ error: "falha na IA", detail }, 502);
    }

    const data = await resp.json();
    const out = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
    const parsed = extractJson(out);
    const transactions = Array.isArray(parsed.transactions) ? parsed.transactions : [];

    return json({ transactions }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
