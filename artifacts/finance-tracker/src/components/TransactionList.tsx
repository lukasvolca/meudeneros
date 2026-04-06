import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/lib/finance";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState } from "react";
import { TransactionForm } from "./TransactionForm";
import { CategoryIcon } from "./CategoryIcon";

export function TransactionList({ transactions, emptyMessage = "Nenhuma transação encontrada." }: { transactions: Transaction[], emptyMessage?: string }) {
  const { categories, deleteTransaction } = useFinance();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground rounded-2xl border border-white/5">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const grouped = transactions.reduce((acc, tx) => {
    const dateStr = format(parseISO(tx.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-1">
            {date}
          </h4>
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
                  className="group glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon category={category} size="md" />
                    <div>
                      <p className="font-semibold text-white text-sm">{tx.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${isIncome ? 'text-success' : 'text-destructive'}`}>
                          {isIncome ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isIncome ? 'Entrada' : 'Saída'}
                        </span>
                        {(category?.name || tx.categoryName) && (
                          <>
                            <span className="text-white/20">·</span>
                            <span className="text-xs text-muted-foreground">{category?.name || tx.categoryName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`font-bold font-display tracking-tight ${isIncome ? 'text-success' : 'text-destructive'}`}>
                      {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(tx.id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Excluir esta transação?')) deleteTransaction(tx.id);
                        }}
                        className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
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
