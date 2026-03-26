import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/lib/finance";
import { format, parseISO } from "date-fns";
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TransactionForm } from "./TransactionForm";

export function TransactionList({ transactions, emptyMessage = "No transactions found." }: { transactions: Transaction[], emptyMessage?: string }) {
  const { categories, deleteTransaction } = useFinance();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground glass-panel rounded-2xl">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Group by date
  const grouped = transactions.reduce((acc, tx) => {
    const dateStr = format(parseISO(tx.date), "MMM d, yyyy");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground sticky top-0 bg-background/90 backdrop-blur-sm py-2 z-10">
            {date}
          </h4>
          <div className="space-y-2">
            <AnimatePresence>
              {txs.map((tx) => {
                const category = categories.find(c => c.id === tx.categoryId);
                const isIncome = tx.type === "income";

                if (editingId === tx.id) {
                  return (
                    <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <TransactionForm initialData={tx} onClose={() => setEditingId(null)} />
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group glass-panel rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-l-4 border-l-transparent hover:border-l-primary"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{tx.title}</p>
                        <p className="text-xs text-muted-foreground">{category?.name || "Uncategorized"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className={`font-bold font-display tracking-tight ${isIncome ? 'text-success' : 'text-white'}`}>
                        {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingId(tx.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm('Delete this transaction?')) deleteTransaction(tx.id);
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
