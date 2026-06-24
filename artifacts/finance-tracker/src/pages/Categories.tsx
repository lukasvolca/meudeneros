import { Layout } from "@/components/Layout";
import { TransactionList } from "@/components/TransactionList";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { filterTransactionsByMonth } from "@/lib/finance";
import { useState } from "react";
import { PieChart, Edit2, Trash2, X, Check, Image, Search } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryIconPicker } from "@/components/CategoryIconPicker";

export default function Categories() {
  const { transactions, categories, deleteCategory, updateCategory, currentDate } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIcon, setEditingIcon] = useState("");
  const [editingLimit, setEditingLimit] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  const monthTransactions = filterTransactionsByMonth(transactions, currentDate.getMonth(), currentDate.getFullYear());

  const filteredTransactions = monthTransactions
    .filter(t => selectedCategory === "all" || t.categoryId === selectedCategory)
    .filter(t => typeFilter === "all" || t.type === typeFilter)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.categoryName ?? "").toLowerCase().includes(q);
    });

  const sortedFiltered = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIncome = sortedFiltered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = sortedFiltered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const categoryExpenses = Object.fromEntries(
    Object.entries(
      monthTransactions
        .filter(t => t.type === "expense")
        .reduce((acc, t) => {
          acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>)
    )
  );

  const handleStartEdit = (id: string, name: string, icon?: string, limit?: number) => {
    setEditingCatId(id);
    setEditingName(name);
    setEditingIcon(icon || "");
    setEditingLimit(limit ? String(limit) : "");
    setShowIconPicker(false);
  };

  const handleSaveEdit = () => {
    if (editingCatId && editingName.trim()) {
      const parsedLimit = parseFloat(editingLimit);
      updateCategory(editingCatId, {
        name: editingName.trim(),
        icon: editingIcon || undefined,
        limit: parsedLimit > 0 ? parsedLimit : undefined,
      });
      setEditingCatId(null);
      setEditingName("");
      setEditingIcon("");
      setEditingLimit("");
      setShowIconPicker(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCatId(null);
    setEditingName("");
    setEditingIcon("");
    setEditingLimit("");
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

          {/* Dropdown selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="__cat-select w-full glass-input rounded-xl py-2.5 px-4 text-white text-sm cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all">Todas as categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Chips row */}
          <div className="__cat-pills flex flex-wrap gap-2">
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
                  /* Editing chip */
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl p-2 pr-3">
                    <button
                      type="button"
                      onClick={() => setShowIconPicker(v => !v)}
                      title="Alterar ícone"
                      className="flex-shrink-0"
                    >
                      <CategoryIcon
                        category={{ ...cat, icon: editingIcon || cat.icon }}
                        size="xl"
                      />
                    </button>
                    <div className="flex flex-col gap-1 min-w-0">
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                        className="bg-transparent outline-none text-sm font-semibold text-white w-28"
                        placeholder="Nome"
                      />
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                        <input
                          value={editingLimit}
                          onChange={e => setEditingLimit(e.target.value.replace(/[^0-9.,]/g, ""))}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                          className="bg-transparent outline-none text-xs text-muted-foreground w-24 pl-6"
                          placeholder="Limite mensal"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowIconPicker(v => !v)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
                          title="Alterar ícone"
                        >
                          <Image className="w-3 h-3" /> ícone
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 ml-1">
                      <button onClick={handleSaveEdit} className="p-1 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-1 rounded-lg bg-white/5 text-muted-foreground hover:text-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "group relative flex items-center gap-0 rounded-2xl transition-colors overflow-hidden border",
                    selectedCategory === cat.id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10"
                  )}>
                    {/* Icon — fills full height of the chip */}
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className="flex-shrink-0 p-2"
                    >
                      <CategoryIcon category={cat} size="xl" />
                    </button>

                    {/* Name + limit bar */}
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "flex-1 pr-2 text-left",
                        selectedCategory === cat.id ? "text-primary" : "text-muted-foreground group-hover:text-white"
                      )}
                    >
                      <span className="font-semibold text-sm whitespace-nowrap">{cat.name}</span>
                      {cat.limit && cat.limit > 0 && (() => {
                        const spent = categoryExpenses[cat.id] || 0;
                        const pct = Math.min((spent / cat.limit) * 100, 100);
                        const over = spent > cat.limit;
                        return (
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span className={over ? "text-destructive font-semibold" : "text-muted-foreground"}>
                                {formatCurrency(spent)}
                              </span>
                              <span className="text-muted-foreground">/ {formatCurrency(cat.limit)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : pct > 80 ? "bg-yellow-500" : "bg-primary")}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </button>

                    {/* Edit / Delete — appear on hover */}
                    <div className="flex flex-col gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(cat.id, cat.name, cat.icon, cat.limit)}
                        className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
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

          {/* Icon picker — rendered BELOW chips, never overlapping */}
          {editingCatId && showIconPicker && (
            <CategoryIconPicker
              value={editingIcon}
              onChange={setEditingIcon}
              onClose={() => setShowIconPicker(false)}
            />
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:bg-white/8 transition-colors"
          />
        </div>

        {/* Type filter */}
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
              {f === "all" ? "Todos" : f === "expense" ? "Saídas" : "Entradas"}
            </button>
          ))}
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
