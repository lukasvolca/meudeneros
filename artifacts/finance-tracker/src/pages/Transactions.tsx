import { Layout } from "@/components/Layout";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { useFinance } from "@/context/FinanceContext";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function Transactions() {
  const { transactions } = useFinance();
  const [showForm, setShowForm] = useState(false);

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout title="Transações">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Fechar" : "Nova Transação"}
          </button>
        </div>

        {showForm && (
          <div className="pb-2">
            <TransactionForm onClose={() => setShowForm(false)} />
          </div>
        )}

        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          <TransactionList transactions={sortedTransactions} emptyMessage="Nenhuma transação. Clique em Nova Transação para começar." />
        </div>
      </div>
    </Layout>
  );
}
