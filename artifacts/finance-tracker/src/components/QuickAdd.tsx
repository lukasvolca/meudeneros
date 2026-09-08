import { useEffect, useRef, useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { parseQuickEntry, QuickDraft } from "@/lib/quickParse";
import { supabase } from "@/lib/supabase";
import { cn, formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Sparkles, Mic, Check, X, ArrowUpRight, ArrowDownRight, Loader2, Wand2 } from "lucide-react";

function todayYmd(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function QuickAdd() {
  const { categories, addTransaction } = useFinance();
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<QuickDraft[]>([]);
  const [listening, setListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const keepRef = useRef(false);   // usuário quer continuar ouvindo até apertar de novo
  const baseRef = useRef("");       // texto já finalizado em sessões anteriores
  const sessionRef = useRef("");    // texto da sessão de reconhecimento atual

  const micSupported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => () => { keepRef.current = false; try { recRef.current?.stop(); } catch { /* ignore */ } }, []);

  // Fallback quando a IA está indisponível/offline: usa o parser local no aparelho
  const localFallback = (t: string, note: string) => {
    const ds = parseQuickEntry(t, categories);
    setDrafts(ds);
    setError(ds.length ? note : "Não consegui interpretar essa frase.");
  };

  const analyzeAI = async (t: string) => {
    if (!t.trim() || aiLoading) return;
    setJustAdded(null);
    setError(null);
    setAiLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("quick-parse", {
        body: {
          text: t.trim(),
          today: todayYmd(),
          categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        },
      });
      if (fnErr) { localFallback(t, "IA indisponível agora — usei a análise local. Confira os nomes."); return; }
      const list = Array.isArray(data?.transactions) ? data.transactions : [];
      const mapped: QuickDraft[] = list.map((r: any) => {
        const cat = categories.find((c) => c.id === r.categoryId);
        const type = r.type === "income" ? "income" : "expense";
        const breakdown = Array.isArray(r.breakdown)
          ? r.breakdown
              .filter((b: any) => b && typeof b.title === "string")
              .map((b: any) => ({ title: b.title, amount: Number(b.amount) || 0 }))
          : undefined;
        return {
          type,
          amount: typeof r.amount === "number" && r.amount > 0 ? r.amount : Number(r.amount) || 0,
          title: typeof r.title === "string" ? r.title : "",
          categoryId: cat ? cat.id : "",
          categoryName: cat ? cat.name : "",
          date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : todayYmd(),
          breakdown: breakdown && breakdown.length > 1 ? breakdown : undefined,
        };
      });
      if (mapped.length === 0) { localFallback(t, "A IA não achou lançamentos — usei a análise local."); return; }
      setDrafts(mapped);
    } catch {
      localFallback(t, "Sem conexão com a IA — usei a análise local. Confira os nomes.");
    } finally {
      setAiLoading(false);
    }
  };

  const startRec = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = true;      // não encerra sozinho nas pausas
    rec.interimResults = true;
    sessionRef.current = "";
    rec.onresult = (e: any) => {
      let s = "";
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
      sessionRef.current = s;
      setText((baseRef.current + s).replace(/\s+/g, " ").trim());
    };
    rec.onend = () => {
      if (keepRef.current) {
        // navegador encerrou sozinho (silêncio/tempo) — retoma preservando o texto
        baseRef.current = (baseRef.current + " " + sessionRef.current).replace(/\s+/g, " ").trim();
        if (baseRef.current) baseRef.current += " ";
        sessionRef.current = "";
        try { rec.start(); } catch { /* próximo ciclo */ }
      } else {
        setListening(false);
      }
    };
    rec.onerror = (ev: any) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture") {
        keepRef.current = false;
        setListening(false);
      }
    };
    recRef.current = rec;
    try { rec.start(); } catch { /* ignore */ }
  };

  const startListening = () => {
    if (!micSupported) return;
    keepRef.current = true;
    baseRef.current = text.trim() ? text.trim() + " " : "";
    setJustAdded(null);
    setError(null);
    setListening(true);
    startRec();
  };

  const stopListening = () => {
    keepRef.current = false;
    try { recRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
    const finalText = (baseRef.current + " " + sessionRef.current).replace(/\s+/g, " ").trim();
    if (finalText) analyzeAI(finalText);
  };

  const patch = (idx: number, p: Partial<QuickDraft>) =>
    setDrafts((ds) => ds.map((d, i) => (i === idx ? { ...d, ...p } : d)));

  const removeDraft = (idx: number) => setDrafts((ds) => ds.filter((_, i) => i !== idx));

  const onRegisterAll = () => {
    if (drafts.length === 0) return;
    if (drafts.some((d) => d.amount <= 0 || !d.title.trim())) {
      setError("Cada lançamento precisa de valor e nome.");
      return;
    }
    for (const d of drafts) {
      addTransaction({
        type: d.type,
        amount: d.amount,
        title: d.title.trim(),
        date: new Date(d.date + "T12:00:00").toISOString(),
        categoryId: d.categoryId,
        categoryName: d.categoryName,
      });
    }
    setJustAdded(drafts.length === 1 ? `“${drafts[0].title.trim()}” registrado.` : `${drafts.length} lançamentos registrados.`);
    setDrafts([]);
    setText("");
    setError(null);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm font-semibold text-white">Registro rápido</p>
        <span className="text-xs text-muted-foreground">— digite ou fale, ex: “gastei 32,90 no uber ontem”</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); analyzeAI(text); } }}
          placeholder="Ex: paguei 107 no mercado hoje"
          className="flex-1 min-w-0 glass-input rounded-xl py-3 px-4 text-white placeholder:text-white/25"
        />
        {micSupported && (
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            title={listening ? "Parar" : "Falar"}
            aria-label={listening ? "Parar gravação" : "Falar"}
            className={cn(
              "p-3 rounded-xl border transition-colors shrink-0",
              listening
                ? "bg-destructive/20 border-destructive/40 text-destructive animate-pulse"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
            )}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => analyzeAI(text)}
          disabled={!text.trim() || aiLoading}
          title="Interpretar a frase (entende vários itens e fala solta)"
          className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1.5"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Analisar
        </button>
      </div>

      {justAdded && drafts.length === 0 && (
        <p className="text-xs text-success flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5" /> {justAdded}
        </p>
      )}
      {error && drafts.length === 0 && <p className="text-xs text-destructive">{error}</p>}

      {drafts.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Entendi {drafts.length === 1 ? "isto" : `${drafts.length} lançamentos`} — confira e confirme:
            </p>
            {drafts.length > 1 && <span className="text-[11px] text-muted-foreground">{drafts.length} itens</span>}
          </div>

          <div className="space-y-3">
            {drafts.map((draft, idx) => {
              const selCats = categories.filter(
                (c) => c.type === draft.type || (!c.type && draft.type === "expense") || c.id === draft.categoryId
              );
              return (
                <div key={idx} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5 relative">
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDraft(idx)}
                      title="Remover este"
                      className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <label className="text-[11px] text-muted-foreground">Tipo</label>
                      <div className="flex p-0.5 bg-black/20 rounded-lg border border-white/5">
                        <button
                          type="button"
                          onClick={() => patch(idx, { type: "expense" })}
                          className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-colors", draft.type === "expense" ? "bg-destructive text-white" : "text-muted-foreground")}
                        >
                          <ArrowUpRight className="w-3 h-3" /> Saída
                        </button>
                        <button
                          type="button"
                          onClick={() => patch(idx, { type: "income" })}
                          className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-colors", draft.type === "income" ? "bg-success text-white" : "text-muted-foreground")}
                        >
                          <ArrowDownRight className="w-3 h-3" /> Entrada
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Valor (R$)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={draft.amount || ""}
                        onChange={(e) => patch(idx, { amount: parseFloat(e.target.value) || 0 })}
                        className="w-full glass-input rounded-lg py-2 px-3 text-sm text-white"
                        placeholder="0,00"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Categoria</label>
                      <div className="relative">
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                          <CategoryIcon category={categories.find((c) => c.id === draft.categoryId)} size="sm" typeOverride={draft.type} />
                        </div>
                        <select
                          value={draft.categoryId}
                          onChange={(e) => { const c = categories.find((x) => x.id === e.target.value); patch(idx, { categoryId: e.target.value, categoryName: c?.name || "" }); }}
                          className="w-full glass-input rounded-lg py-2 pl-10 pr-2 text-sm appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-background text-foreground">Sem categoria</option>
                          {selCats.map((c) => (
                            <option key={c.id} value={c.id} className="bg-background text-foreground">{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Data</label>
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(e) => patch(idx, { date: e.target.value })}
                        className="w-full glass-input rounded-lg py-2 px-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Nome</label>
                    <input
                      value={draft.title}
                      onChange={(e) => patch(idx, { title: e.target.value })}
                      className="w-full glass-input rounded-lg py-2 px-3 text-sm text-white"
                      placeholder="Ex: Uber, Mercado, Salário..."
                    />
                  </div>

                  {draft.breakdown && draft.breakdown.length > 1 && (
                    <div className="rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Como somou</p>
                      {draft.breakdown.map((b, bi) => (
                        <div key={bi} className="flex justify-between gap-2 text-[11px] text-muted-foreground">
                          <span className="truncate">{b.title}</span>
                          <span className="tabular-nums shrink-0">{formatCurrency(b.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between gap-2 text-[11px] font-semibold text-white mt-1 pt-1 border-t border-white/10">
                        <span>Total</span>
                        <span className="tabular-nums">{formatCurrency(draft.breakdown.reduce((s, b) => s + (b.amount || 0), 0))}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setDrafts([]); setError(null); }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Descartar
            </button>
            <button
              type="button"
              onClick={onRegisterAll}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> {drafts.length > 1 ? `Registrar todos (${drafts.length})` : "Registrar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
