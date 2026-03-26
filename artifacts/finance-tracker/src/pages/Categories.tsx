import { Layout } from "@/components/Layout";
import { TransactionList } from "@/components/TransactionList";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";
import { PieChart } from "lucide-react";

export default function Categories() {
  const { transactions, categories } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredTransactions = selectedCategory === "all" 
    ? transactions 
    : transactions.filter(t => t.categoryId === selectedCategory);
  
  const sortedFiltered = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stats for current view
  const totalIncome = sortedFiltered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = sortedFiltered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <Layout title="Categories & Reports">
      <div className="space-y-8">
        
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-4 gap-3 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300",
              selectedCategory === "all" 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5"
            )}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-5 py-2.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-300",
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold font-display">{sortedFiltered.length}</p>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-success">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold font-display text-success">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-destructive">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold font-display text-destructive">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          <h3 className="text-xl font-display font-bold mb-6">
            {selectedCategory === 'all' ? 'All Transactions' : `${categories.find(c=>c.id === selectedCategory)?.name} Activity`}
          </h3>
          <TransactionList transactions={sortedFiltered} />
        </div>
        
      </div>
    </Layout>
  );
}
