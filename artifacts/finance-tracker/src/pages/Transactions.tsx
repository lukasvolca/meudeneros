import { Layout } from "@/components/Layout";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { useFinance } from "@/context/FinanceContext";
import { Plus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Transactions() {
  const { transactions } = useFinance();
  const [showForm, setShowForm] = useState(false);

  // Sort all transactions newest first
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Layout title="Transactions">
      <div className="space-y-8">
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              className="overflow-hidden"
            >
              <div className="pb-8">
                <TransactionForm onClose={() => setShowForm(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          <TransactionList transactions={sortedTransactions} emptyMessage="No transactions exist. Add one above!" />
        </div>
      </div>
    </Layout>
  );
}
