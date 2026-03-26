import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Plus, X, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface TransactionFormProps {
  initialData?: any;
  onClose?: () => void;
}

export function TransactionForm({ initialData, onClose }: TransactionFormProps) {
  const { categories, addCategory, addTransaction, updateTransaction } = useFinance();
  
  const [type, setType] = useState<"income" | "expense">(initialData?.type || "expense");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState(initialData?.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories[0]?.id || ""));
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !title || !categoryId) return;

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const txData = {
      type,
      amount: parseFloat(amount),
      title,
      date: new Date(date).toISOString(),
      categoryId,
      categoryName: selectedCategory?.name || "",
    };

    if (initialData?.id) {
      updateTransaction(initialData.id, txData);
    } else {
      addTransaction(txData);
    }

    if (onClose) onClose();
    if (!initialData) {
      setAmount("");
      setTitle("");
    }
  };

  const handleAddCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      const id = addCategory(newCategoryName.trim());
      setCategoryId(id);
      setIsAddingCategory(false);
      setNewCategoryName("");
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display font-bold">
          {initialData ? "Edit Transaction" : "New Transaction"}
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle */}
        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              type === "expense" ? "bg-destructive text-white shadow-lg shadow-destructive/25" : "text-muted-foreground hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              type === "income" ? "bg-success text-white shadow-lg shadow-success/25" : "text-muted-foreground hover:text-white"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> Income
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full glass-input rounded-xl py-3 pl-8 pr-4 text-lg font-semibold placeholder:text-white/20"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full glass-input rounded-xl py-3 px-4 text-white placeholder:text-white/20"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full glass-input rounded-xl py-3 px-4 text-white placeholder:text-white/20"
            placeholder="What was this for?"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Category</label>
          
          <AnimatePresence mode="wait">
            {isAddingCategory ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 glass-input rounded-xl py-3 px-4"
                  placeholder="New category name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory(e as any);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-2"
              >
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 glass-input rounded-xl py-3 px-4 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-background text-foreground">
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 group text-sm font-medium"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform text-primary" />
                  New
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
        >
          {initialData ? "Save Changes" : "Save Transaction"}
        </button>
      </form>
    </div>
  );
}
