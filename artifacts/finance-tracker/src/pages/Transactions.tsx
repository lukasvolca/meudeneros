import { Layout } from "@/components/Layout";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { useFinance } from "@/context/FinanceContext";
import { filterTransactionsByMonth } from "@/lib/finance";
import { Plus, X, Search } from "lucide-react";
import { useState } from "react";

export default function Transactions() {
  const { transactions, currentDate } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");

  const monthTransactions = filterTransactionsByMonth(transactions, currentDate.getMonth(), currentDate.getFullYear());
  const sortedTransactions = [...monthTransactions].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredTransactions = sortedTransactions.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.title.toLowerCase().includes(q) ||
        (tx.categoryName ?? "").toLowerCase().includes(q) ||
        (tx.type === "income" ? "entrada" : "saída").includes(q)
      );
    }
    return true;
  });

  return (
    <Layout title="Transações">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título, categoria ou tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:bg-white/8 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shrink-0"
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

        <div className="flex items-center gap-2">
          {(["all", "expense", "income"] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                typeFilter === f
                  ? f === "all" ? "bg-white/15 text-white" : f === "expense" ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {f === "all" ? "Todos" : f === "expense" ? "Apenas Saídas" : "Apenas Entradas"}
            </button>
          ))}
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          <TransactionList
            transactions={filteredTransactions}
            emptyMessage={searchQuery.trim() ? "Nenhuma transação encontrada para essa busca." : "Nenhuma transação. Clique em Nova Transação para começar."}
          />
        </div>
      </div>
    </Layout>
  );
}
