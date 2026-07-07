import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/lib/finance";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState, useMemo } from "react";
import { TransactionForm } from "./TransactionForm";
import { CategoryIcon } from "./CategoryIcon";

export function TransactionList({ transactions, emptyMessage = "Nenhuma transação encontrada." }: { transactions: Transaction[], emptyMessage?: string }) {
  const { categories, deleteTransaction, transactions: allTransactions } = useFinance();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Saldo acumulado até cada data
  const balanceByDate = useMemo(() => {
    const sorted = [...allTransactions].sort((a, b) => a.date.localeCompare(b.date));
    const map: Record<string, number> = {};
    let running = 0;
    for (const tx of sorted) {
      running += tx.type === "income" ? tx.amount : -tx.amount;
      map[tx.date.slice(0, 10)] = running;
    }
    const dates = Object.keys(map).sort();
    let last = 0;
    for (const d of dates) { last = map[d]; map[d] = last; }
    return { map, dates };
  }, [allTransactions]);

  const balanceUpTo = (dateStr: string) => {
    if (balanceByDate.map[dateStr] !== undefined) return balanceByDate.map[dateStr];
    const prev = [...balanceByDate.dates].reverse().find(d => d <= dateStr);
    return prev ? balanceByDate.map[prev] : 0;
  };

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground rounded-2xl border border-white/5">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const grouped = transactions.reduce((acc, tx) => {
    const dateStr = format(parseISO(tx.date), "d 'de' MMMM - EEEE", { locale: ptBR });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {date}
            </h4>
            <span className="text-xs font-medium tabular-nums text-white/35">
              Saldo do dia {formatCurrency(balanceUpTo(txs[0].date.slice(0, 10)))}
            </span>
          </div>
          <div className="space-y-2">
            {txs.map((tx) => {
              const category = categories.find(c => c.id === tx.categoryId);
              const isIncome = tx.type === "income";

              if (editingId === tx.id) {
                return (
                  <div key={tx.id} className="mb-4">
                    <TransactionForm initialData={tx} onClose={() => setEditingId(null)} />
                  </div>
                );
              }

              return (
                <div
                  key={tx.id}
                  className="group rounded-xl p-4 flex items-center justify-between bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14] transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                >
                  {/* Left: icon + info — shrinks when space is tight */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <div className="flex-shrink-0">
                      <CategoryIcon category={category} size="xl" typeOverride={tx.type} />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="font-semibold text-white text-sm truncate">{tx.title}</p>
                      <div className="flex items-center gap-1 mt-0.5 min-w-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium flex-shrink-0 ${isIncome ? 'text-success' : 'text-destructive'}`}>
                          {isIncome ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isIncome ? 'Entrada' : 'Saída'}
                        </span>
                        {(category?.name || tx.categoryName) && (
                          <>
                            <span className="text-white/20 flex-shrink-0">·</span>
                            <span className="text-xs text-muted-foreground truncate">{category?.name || tx.categoryName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: amount + actions — never shrinks */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className={`font-bold font-display tracking-tight whitespace-nowrap ${isIncome ? 'text-success' : 'text-destructive'}`}>
                      {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setEditingId(tx.id)}
                        className="p-2 rounded-lg text-primary hover:bg-primary/20 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Excluir esta transação?')) deleteTransaction(tx.id);
                        }}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/20 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
