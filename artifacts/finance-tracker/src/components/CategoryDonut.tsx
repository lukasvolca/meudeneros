import { useState } from "react";
import { useLocation } from "wouter";
import * as Icons from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface DonutSlice {
  id: string;
  name: string;
  amount: number;
  color: string;
  count: number;
  limit?: number;
  icon?: string;
}

// Ícone branco no centro da fatia — SVG nativo (leve, sem foreignObject/filtros).
// Um disco escuro sutil por trás garante legibilidade nas fatias claras.
function SliceIcon({ icon, cx, cy, size = 16 }: { icon?: string; cx: number; cy: number; size?: number }) {
  const half = size / 2;
  return (
    <>
      <circle cx={cx} cy={cy} r={size * 0.8} fill="rgba(0,0,0,0.16)" />
      {icon?.startsWith("data:") ? (
        <image href={icon} x={cx - half} y={cy - half} width={size} height={size} preserveAspectRatio="xMidYMid slice" />
      ) : (
        (() => {
          const Lucide = icon ? ((Icons as any)[icon] as Icons.LucideIcon | undefined) : undefined;
          const Cmp = Lucide ?? Icons.Tag;
          return <Cmp x={cx - half} y={cy - half} width={size} height={size} color="#ffffff" strokeWidth={2.25} />;
        })()
      )}
    </>
  );
}

// Ícone redondo colorido para a legenda — mesma linguagem visual do donut
// (ícone branco sobre disco na cor da categoria), à esquerda do nome.
function LegendIcon({ icon, color, size = 24 }: { icon?: string; color: string; size?: number }) {
  const isData = icon?.startsWith("data:");
  const Lucide = !isData && icon ? ((Icons as any)[icon] as Icons.LucideIcon | undefined) : undefined;
  const Cmp = Lucide ?? Icons.Tag;
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size, backgroundColor: color }}
    >
      {isData ? (
        <img src={icon} alt="" className="w-full h-full object-cover" />
      ) : (
        <Cmp width={size * 0.55} height={size * 0.55} color="#ffffff" strokeWidth={2.25} />
      )}
    </span>
  );
}

interface CategoryDonutProps {
  slices: DonutSlice[];      // despesas por categoria, já ordenadas desc e coloridas
  total: number;             // total de despesas
  incomeItems?: { id: string; name: string; amount: number; icon?: string; count?: number }[];
}

// Detalhe unificado exibido no modal de resumo da categoria
interface CategoryDetail {
  id: string;
  name: string;
  icon?: string;
  color: string;
  amount: number;
  pct: number;
  count?: number;
  limit?: number;
  kind: "expense" | "income";
}

const CX = 100;
const CY = 100;
const R_OUTER = 90;
const R_INNER = 58;
const PAD = 1.4; // graus de gap entre fatias

function pointOnCircle(r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function annularSector(a0: number, a1: number): string {
  const [x0o, y0o] = pointOnCircle(R_OUTER, a0);
  const [x1o, y1o] = pointOnCircle(R_OUTER, a1);
  const [x1i, y1i] = pointOnCircle(R_INNER, a1);
  const [x0i, y0i] = pointOnCircle(R_INNER, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0o} ${y0o} A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${R_INNER} ${R_INNER} 0 ${large} 0 ${x0i} ${y0i} Z`;
}

export function CategoryDonut({ slices, total, incomeItems = [] }: CategoryDonutProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [, navigate] = useLocation();

  const incomeTotal = incomeItems.reduce((s, it) => s + it.amount, 0);

  if (total <= 0 || slices.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">Sem gastos neste mês.</p>;
  }

  // Constrói geometria das fatias
  let cursor = 0;
  const single = slices.length === 1;
  const arcs = slices.map((s) => {
    const frac = s.amount / total;
    const sweep = frac * 360;
    const a0 = cursor + (single ? 0 : PAD);
    const a1 = cursor + sweep - (single ? 0 : PAD);
    cursor += sweep;
    const mid = (a0 + a1) / 2;
    return { ...s, a0, a1, mid, pct: frac * 100 };
  });

  const active = arcs.find((a) => a.id === activeId) ?? null;
  const centerLabel = active ? active.name : "Total de gastos";
  const centerValue = active ? active.amount : total;
  const centerPct = active ? `${active.pct.toFixed(0)}% do mês` : `${slices.length} categoria${slices.length !== 1 ? "s" : ""}`;

  const openExpense = (a: (typeof arcs)[number]) => {
    if (a.id === "__outros__") return; // "Outros" é agregado, não é uma categoria única
    setDetail({ id: a.id, name: a.name, icon: a.icon, color: a.color, amount: a.amount, pct: a.pct, count: a.count, limit: a.limit, kind: "expense" });
  };
  const openIncome = (it: NonNullable<CategoryDonutProps["incomeItems"]>[number]) => {
    setDetail({ id: it.id, name: it.name, icon: it.icon, color: "hsl(var(--success))", amount: it.amount, pct: incomeTotal > 0 ? (it.amount / incomeTotal) * 100 : 0, count: it.count, kind: "income" });
  };

  return (
    <>
    <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: 260, height: 260 }}>
        <svg viewBox="0 0 200 200" width="260" height="260" role="img" aria-label="Gastos por categoria">
          {single ? (
            <circle
              cx={CX}
              cy={CY}
              r={(R_OUTER + R_INNER) / 2}
              fill="none"
              stroke={arcs[0].color}
              strokeWidth={R_OUTER - R_INNER}
            />
          ) : (
            arcs.map((a) => {
              const isActive = a.id === activeId;
              const dim = activeId !== null && !isActive;
              const [ox, oy] = isActive ? pointOnCircle(4, a.mid).map((v, i) => v - (i === 0 ? CX : CY)) as [number, number] : [0, 0];
              const showIcon = a.a1 - a.a0 >= 20; // só em fatias grandes o suficiente
              const [icx, icy] = pointOnCircle((R_OUTER + R_INNER) / 2, a.mid);
              return (
                <g
                  key={a.id}
                  opacity={dim ? 0.35 : 1}
                  transform={isActive ? `translate(${ox} ${oy})` : undefined}
                  style={{ transition: "opacity 0.15s ease, transform 0.15s ease", cursor: "pointer" }}
                  onMouseEnter={() => setActiveId(a.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => openExpense(a)}
                >
                  <path d={annularSector(a.a0, a.a1)} fill={a.color} />
                  {showIcon && <SliceIcon icon={a.icon} cx={icx} cy={icy} />}
                </g>
              );
            })
          )}
        </svg>
        {/* Centro */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-10">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground truncate max-w-full">{centerLabel}</span>
          <span className="text-2xl font-bold text-white tabular-nums leading-tight mt-1">{formatCurrency(centerValue)}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5">{centerPct}</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex-1 w-full space-y-1.5">
        {arcs.map((a) => {
          const isActive = a.id === activeId;
          const hasLimit = !!a.limit && a.limit > 0;
          const limitPct = hasLimit ? Math.min((a.amount / a.limit!) * 100, 100) : 0;
          const over = hasLimit && a.amount > a.limit!;
          const near = hasLimit && !over && limitPct > 80;
          const barColor = over ? "#e66767" : near ? "#eab308" : a.color;
          return (
            <div
              key={a.id}
              onMouseEnter={() => setActiveId(a.id)}
              onMouseLeave={() => setActiveId(null)}
              onClick={() => openExpense(a)}
              className={`px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${isActive ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
            >
              <div className="flex items-center gap-3">
                <LegendIcon icon={a.icon} color={a.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.count} transaç{a.count === 1 ? "ão" : "ões"}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(a.amount)}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{a.pct.toFixed(0)}%</p>
                </div>
              </div>
              {hasLimit && (
                <div className="flex items-center gap-2 mt-1.5 ml-9">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${limitPct}%`, backgroundColor: barColor }} />
                  </div>
                  <span className={`text-[10px] tabular-nums shrink-0 ${over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                    {over ? "acima de" : "limite"} {formatCurrency(a.limit!)}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {incomeItems.length > 0 && (
          <div className="pt-2 mt-1 border-t border-white/5 space-y-1.5">
            {incomeItems.map((it) => (
              <div
                key={it.id}
                onClick={() => openIncome(it)}
                className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.03]"
              >
                <LegendIcon icon={it.icon} color="hsl(var(--success))" />
                <p className="text-sm font-medium text-white truncate flex-1">{it.name}</p>
                <p className="text-sm font-bold text-success tabular-nums shrink-0">+{formatCurrency(it.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {detail && (
      <CategoryDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        onGoTo={(id) => { setDetail(null); navigate(`/categories?cat=${encodeURIComponent(id)}`); }}
      />
    )}
    </>
  );
}

function CategoryDetailModal({ detail, onClose, onGoTo }: {
  detail: CategoryDetail;
  onClose: () => void;
  onGoTo: (id: string) => void;
}) {
  const isIncome = detail.kind === "income";
  const hasLimit = !isIncome && !!detail.limit && detail.limit > 0;
  const limitPct = hasLimit ? Math.min((detail.amount / detail.limit!) * 100, 100) : 0;
  const over = hasLimit && detail.amount > detail.limit!;
  const near = hasLimit && !over && limitPct > 80;
  const barColor = over ? "#e66767" : near ? "#eab308" : detail.color;
  const canGoTo = !!detail.id; // "Sem categoria" (id vazio) não tem página própria

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel rounded-2xl p-6 max-w-sm w-full space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <LegendIcon icon={detail.icon} color={detail.color} size={44} />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-display font-bold text-white truncate">{detail.name}</h3>
            <p className="text-xs text-muted-foreground">{isIncome ? "Entrada" : "Saída"}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 -mt-2 rounded-full text-muted-foreground hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className={`text-3xl font-bold font-display tabular-nums ${isIncome ? "text-success" : "text-white"}`}>
            {isIncome ? "+" : ""}{formatCurrency(detail.amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {detail.pct.toFixed(0)}% {isIncome ? "das entradas" : "dos gastos"} do mês
            {detail.count !== undefined && <> · {detail.count} transaç{detail.count === 1 ? "ão" : "ões"}</>}
          </p>
        </div>

        {hasLimit && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Limite do mês</span>
              <span className={`tabular-nums font-medium ${over ? "text-destructive" : "text-muted-foreground"}`}>
                {formatCurrency(detail.amount)} / {formatCurrency(detail.limit!)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${limitPct}%`, backgroundColor: barColor }} />
            </div>
            {over && <p className="text-[11px] text-destructive font-medium">Você ultrapassou o limite em {formatCurrency(detail.amount - detail.limit!)}.</p>}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {canGoTo && (
            <button
              onClick={() => onGoTo(detail.id)}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              Ver transações <Icons.ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-white transition-colors ${canGoTo ? "px-4" : "flex-1"}`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
