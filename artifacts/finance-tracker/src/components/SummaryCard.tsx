import { ReactNode, useEffect, useRef, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  amount: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
  editValue?: number;
  onSave?: (value: number) => void;
  editHint?: string;
}

export function SummaryCard({ title, amount, icon, trend, trendUp, colorClass, editValue, onSave, editHint }: SummaryCardProps) {
  const editable = onSave !== undefined && editValue !== undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const startEdit = () => {
    setDraft(editValue !== undefined ? String(editValue.toFixed(2)) : "");
    setEditing(true);
  };

  const commit = () => {
    const parsed = parseFloat(draft.replace(",", "."));
    if (!isNaN(parsed)) onSave?.(parsed);
    setEditing(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity duration-500 group-hover:scale-110 transform">
        {icon}
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-muted-foreground font-medium text-sm">{title}</p>
          {editable && !editing && (
            <button
              onClick={startEdit}
              aria-label={`Editar ${title}`}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-white"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="w-full min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xl font-bold focus:outline-none focus:border-primary/60 transition-colors"
              />
              <button onClick={commit} aria-label="Salvar" className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} aria-label="Cancelar" className="p-2 rounded-lg bg-white/5 text-muted-foreground hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {editHint && <p className="text-[11px] text-muted-foreground mt-2 leading-snug">{editHint}</p>}
          </div>
        ) : (
          <h3
            onClick={editable ? startEdit : undefined}
            className={cn(
              "text-3xl font-display font-bold tracking-tight mb-4",
              colorClass,
              editable && "cursor-pointer"
            )}
          >
            {amount}
          </h3>
        )}

        {trend && (
          <div className="flex items-center gap-2 text-sm">
            <span className={cn(
              "px-2 py-1 rounded-full bg-white/5 border border-white/10 font-medium",
              trendUp ? "text-success" : trendUp === false ? "text-destructive" : "text-white/70"
            )}>
              {trend}
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
