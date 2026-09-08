import { addDays } from "date-fns";
import { Category } from "./finance";

export interface QuickDraft {
  type: "income" | "expense";
  amount: number;
  title: string;
  categoryId: string;
  categoryName: string;
  date: string; // yyyy-mm-dd
  breakdown?: { title: string; amount: number }[]; // detalhamento quando itens foram somados
}

const INCOME_WORDS = ["recebi", "recebido", "recebida", "recebimento", "ganhei", "ganho", "salario", "entrada", "caiu", "depositaram", "deposito", "vendi", "venda", "rendimento", "reembolso", "freela"];
const EXPENSE_WORDS = ["gastei", "gasto", "paguei", "pagamento", "comprei", "compra", "saida", "torrei", "assinatura"];

// Conectivos / verbos / moeda / enfeites que não servem como título
const STOP = new Set([
  "gastei", "paguei", "comprei", "recebi", "ganhei", "torrei", "vendi", "somar", "soma", "foi", "era", "vai", "voce",
  "valor", "valores", "total", "reais", "real", "rs", "conto", "pila",
  "hoje", "ontem", "anteontem",
  "de", "do", "da", "no", "na", "em", "com", "con", "pra", "para", "por", "que",
  "um", "uma", "uns", "umas", "o", "a", "os", "as", "dia", "meu", "minha", "e",
]);

const bare = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function detectType(lower: string): "income" | "expense" {
  if (INCOME_WORDS.some((w) => new RegExp(`\\b${w}`).test(lower))) return "income";
  if (EXPENSE_WORDS.some((w) => new RegExp(`\\b${w}`).test(lower))) return "expense";
  return "expense";
}

function detectDate(lower: string): Date {
  if (/\banteontem\b/.test(lower)) return addDays(new Date(), -2);
  if (/\bontem\b/.test(lower)) return addDays(new Date(), -1);
  if (/\bhoje\b/.test(lower)) return new Date();
  const dm = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dm) {
    const d = +dm[1], mo = +dm[2] - 1;
    const y = dm[3] ? (dm[3].length === 2 ? 2000 + +dm[3] : +dm[3]) : new Date().getFullYear();
    const cand = new Date(y, mo, d);
    if (!isNaN(cand.getTime())) return cand;
  }
  const diaMatch = lower.match(/\bdia\s+(\d{1,2})\b/);
  if (diaMatch) { const cand = new Date(); cand.setDate(+diaMatch[1]); return cand; }
  return new Date();
}

function parseMoney(token: string): number {
  let num = token;
  if (num.includes(",")) num = num.replace(/\./g, "").replace(",", ".");
  else if (/\d\.\d{3}/.test(num)) num = num.replace(/\./g, "");
  return parseFloat(num) || 0;
}

function matchCategory(lower: string, categories: Category[], type: "income" | "expense"): Category | undefined {
  const pools: Category[][] = [
    categories.filter((c) => c.type === type || (!c.type && type === "expense")),
    categories,
  ];
  for (const pool of pools) {
    let best: Category | undefined;
    for (const c of pool) {
      const cn = bare(c.name);
      if (cn.length >= 3 && new RegExp(`\\b${escapeRe(cn)}`).test(lower)) {
        if (!best || c.name.length > best.name.length) best = c;
      }
    }
    if (best) return best;
  }
  return undefined;
}

function buildTitle(segment: string, categoryName: string): string {
  const tokens = segment.split(/\s+/).filter((tok) => {
    const b = bare(tok).replace(/[^a-z0-9]/gi, "");
    if (b.length < 2) return false;
    if (STOP.has(b)) return false;
    if (/^\d/.test(b)) return false;
    return true;
  });
  let title = tokens.join(" ").trim() || categoryName;
  if (title) title = title.charAt(0).toUpperCase() + title.slice(1);
  return title;
}

function buildDraft(segment: string, amountToken: string, categories: Category[], globalType: "income" | "expense", date: string): QuickDraft {
  const lower = bare(segment);
  const hasIncome = INCOME_WORDS.some((w) => new RegExp(`\\b${w}`).test(lower));
  const hasExpense = EXPENSE_WORDS.some((w) => new RegExp(`\\b${w}`).test(lower));
  const type = hasIncome ? "income" : hasExpense ? "expense" : globalType;
  const cat = matchCategory(lower, categories, type);
  return {
    type,
    amount: amountToken ? parseMoney(amountToken) : 0,
    title: buildTitle(segment, cat?.name || ""),
    categoryId: cat?.id || "",
    categoryName: cat?.name || "",
    date,
  };
}

// Ponto de corte entre dois valores: prefere a vírgula (separador de itens),
// senão um espaço perto do meio.
function cutPoint(text: string, a: number, b: number): number {
  const comma = text.slice(a, b).indexOf(",");
  if (comma >= 0) return a + comma + 1;
  const mid = Math.floor((a + b) / 2);
  for (let d = 0; d < b - a; d++) {
    if (text[mid - d] === " ") return mid - d;
    if (text[mid + d] === " ") return mid + d;
  }
  return mid;
}

export function parseQuickEntry(raw: string, categories: Category[]): QuickDraft[] {
  const globalType = detectType(bare(raw));
  const date = ymd(detectDate(bare(raw)));

  // 1. Normaliza decimais faladas: "23 com 75" / "21 e 90" -> "23,75" / "21,90"
  let work = raw.replace(/(\d+)\s*(?:com|con|e)\s*(\d{2})(?!\d)/gi, "$1,$2");

  // 2. Neutraliza trechos de data (pra não confundir com valor) preservando posições
  const dateRes = [/\banteontem\b/gi, /\bontem\b/gi, /\bhoje\b/gi, /\bdia\s+\d{1,2}\b/gi, /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g];
  for (const re of dateRes) work = work.replace(re, (m) => " ".repeat(m.length));

  // 3. Encontra todos os valores monetários e suas posições
  const moneyRe = /(\d{1,3}(?:\.\d{3})+,\d{1,2}|\d+,\d{1,2}|\d{1,3}(?:\.\d{3})+|\d+)/g;
  const tokens: { value: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = moneyRe.exec(work)) !== null) {
    tokens.push({ value: m[1], start: m.index, end: m.index + m[1].length });
  }

  // Nenhum ou um único valor -> um lançamento só
  if (tokens.length <= 1) {
    return [buildDraft(work, tokens[0]?.value || "", categories, globalType, date)];
  }

  // Vários valores -> segmenta e cria um lançamento por valor
  const cuts: number[] = [0];
  for (let i = 0; i < tokens.length - 1; i++) cuts.push(cutPoint(work, tokens[i].end, tokens[i + 1].start));
  cuts.push(work.length);

  const drafts: QuickDraft[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const segment = work.slice(cuts[i], cuts[i + 1]);
    drafts.push(buildDraft(segment, tokens[i].value, categories, globalType, date));
  }
  return drafts;
}
