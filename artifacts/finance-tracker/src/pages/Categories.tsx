import { Layout } from "@/components/Layout";
import { TransactionList } from "@/components/TransactionList";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { useState } from "react";
import { PieChart, Edit2, Trash2, X, Check, Image } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryIconPicker } from "@/components/CategoryIconPicker";

export default function Categories() {
  const { transactions, categories, deleteCategory, updateCategory } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIcon, setEditingIcon] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const filteredTransactions = selectedCategory === "all"
    ? transactions
    : transactions.filter(t => t.categoryId === selectedCategory);

  const sortedFiltered = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = sortedFiltered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = sortedFiltered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleStartEdit = (id: string, name: string, icon?: string) => {
    setEditingCatId(id);
    setEditingName(name);
    setEditingIcon(icon || "");
    setShowIconPicker(false);
  };

  const handleSaveEdit = () => {
    if (editingCatId && editingName.trim()) {
      updateCategory(editingCatId, {
        name: editingName.trim(),
        icon: editingIcon || undefined,
      });
      setEditingCatId(null);
      setEditingName("");
      setEditingIcon("");
      setShowIconPicker(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setEditingName("");
    setEditingIcon("");
    setShowIconPicker(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Excluir a categoria "${name}"? As transações associadas não serão apagadas.`)) {
      if (selectedCategory === id) setSelectedCategory("all");
      deleteCategory(id);
    }
  };

  return (
    <Layout title="Categorias">
      <div className="space-y-8">

        {/* Category Filter + Management */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Filtrar por categoria</p>
            <span className="text-xs text-muted-foreground">{categories.length} categoria{categories.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* "All" tab */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition-colors",
                selectedCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white border border-white/5"
              )}
            >
              Todas
            </button>

            {categories.map((cat) => (
              <div key={cat.id}>
                {editingCatId === cat.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-2xl px-3 py-2">
                      {/* Icon preview + change button */}
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(v => !v)}
                        title="Alterar ícone"
                        className="flex-shrink-0"
                      >
                        <CategoryIcon
                          category={{ ...cat, icon: editingIcon || cat.icon }}
                          size="sm"
                        />
                      </button>
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                        className="bg-transparent outline-none text-sm font-medium w-28 text-white"
                      />
                      <button
                        onClick={() => setShowIconPicker(v => !v)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        title="Alterar ícone"
                      >
                        <Image className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button onClick={handleSaveEdit} className="text-success hover:text-success/80 transition-colors p-0.5">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={handleCancelEdit} className="text-muted-foreground hover:text-white transition-colors p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {showIconPicker && (
                      <div className="absolute z-50 mt-1">
                        <CategoryIconPicker
                          value={editingIcon || cat.icon}
                          onChange={setEditingIcon}
                          onClose={() => setShowIconPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={cn(
                    "group flex items-center gap-1 rounded-full transition-colors",
                    selectedCategory === cat.id
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-white/5 border border-white/5 hover:bg-white/8"
                  )}>
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 font-medium text-sm whitespace-nowrap rounded-l-full",
                        selectedCategory === cat.id ? "text-primary" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      <CategoryIcon category={cat} size="sm" />
                      {cat.name}
                    </button>
                    <div className="flex items-center pr-2 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(cat.id, cat.name, cat.icon)}
                        className="p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground py-2">Nenhuma categoria criada. Adicione uma ao registrar uma transação.</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transações</p>
              <p className="text-2xl font-bold font-display">{sortedFiltered.length}</p>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-4 border-l-success">
            <div>
              <p className="text-sm text-muted-foreground">Total de Entradas</p>
              <p className="text-2xl font-bold font-display text-success">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
          <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-4 border-l-destructive">
            <div>
              <p className="text-sm text-muted-foreground">Total de Saídas</p>
              <p className="text-2xl font-bold font-display text-destructive">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl">
          <h3 className="text-xl font-display font-bold mb-6">
            {selectedCategory === 'all'
              ? 'Todas as Transações'
              : `Histórico: ${categories.find(c => c.id === selectedCategory)?.name}`}
          </h3>
          <TransactionList transactions={sortedFiltered} emptyMessage="Nenhuma transação nesta categoria." />
        </div>

      </div>
    </Layout>
  );
}
