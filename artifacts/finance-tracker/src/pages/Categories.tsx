import { Layout } from "@/components/Layout";
import { TransactionList } from "@/components/TransactionList";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency, cn } from "@/lib/utils";
import { filterTransactionsByMonth, Category } from "@/lib/finance";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { PieChart, Edit2, Trash2, X, Check, Image, Search, Maximize2, Minimize2, ChevronDown, Target } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryIconPicker } from "@/components/CategoryIconPicker";

export default function Categories() {
  const { transactions, categories, deleteCategory, updateCategory, currentDate } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [catTypeFilter, setCatTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingIcon, setEditingIcon] = useState("");
  const [editingLimit, setEditingLimit] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  // Sempre inicia recolhido; ao sair e voltar (remontagem) volta a ficar recolhido.
  const [expandedView, setExpandedView] = useState(false);
  const toggleExpanded = () => setExpandedView(v => !v);
  // Menu de contexto ancorado num chip (clique direito)
  const [ctxCat, setCtxCat] = useState<{ cat: Category; x: number; y: number } | null>(null);

  // Filtro vindo do dashboard (ao clicar numa categoria do gráfico): /categories?cat=<id>
  const search = useSearch();
  useEffect(() => {
    const catParam = new URLSearchParams(search).get("cat");
    if (catParam) {
      setSelectedCategory(catParam);
      setCatTypeFilter("all");
    }
  }, [search]);

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

  // Card de limite da categoria SELECIONADA (só aparece se ela tiver limite)
  const selCat = selectedCategory !== "all" ? categories.find(c => c.id === selectedCategory) : undefined;
  const showLimitCard = !!selCat && !!selCat.limit && selCat.limit > 0;
  const selLimit = selCat?.limit || 0;
  const selSpent = selCat ? (categoryExpenses[selCat.id] || 0) : 0;
  const selPct = selLimit > 0 ? Math.min((selSpent / selLimit) * 100, 100) : 0;
  const selOver = selLimit > 0 && selSpent > selLimit;

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

  const handleStartRename = (id: string, name: string, icon?: string, limit?: number) => {
    handleStartEdit(id, name, icon, limit);
    setShowIconPicker(false);
  };

  const handleStartIconEdit = (id: string, name: string, icon?: string, limit?: number) => {
    handleStartEdit(id, name, icon, limit);
    setShowIconPicker(true);
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteModal({ id, name });
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    if (selectedCategory === deleteModal.id) setSelectedCategory("all");
    deleteCategory(deleteModal.id);
    setDeleteModal(null);
  };

  return (
    <Layout title="Categorias">
      <div className="space-y-8">

        {/* Category Filter + Management */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Filtrar por categoria</p>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleExpanded}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-white transition-colors"
                title={expandedView ? "Recolher" : "Expandir para gerenciar"}
              >
                {expandedView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {expandedView ? "Recolher" : "Expandir"}
              </button>
              <span className="text-xs text-muted-foreground">{categories.length} categoria{categories.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Category type filter */}
          <div className="flex items-center gap-2">
            {(["all", "expense", "income"] as const).map(f => (
              <button
                key={f}
                onClick={() => { setCatTypeFilter(f); setSelectedCategory("all"); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  catTypeFilter === f
                    ? f === "all" ? "bg-white/15 text-white" : f === "expense" ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {f === "all" ? "Todas" : f === "expense" ? "Saídas" : "Entradas"}
              </button>
            ))}
          </div>

          {/* Versão recolhida — chips compactos tipo abas (só filtrar) */}
          {!expandedView && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-colors",
                  selectedCategory === "all"
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                )}
              >
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-base leading-none shrink-0">·</span>
                <span className="text-xs font-medium">Todas</span>
              </button>
              {categories
                .filter(c => catTypeFilter === "all" || c.type === catTypeFilter || (!c.type && catTypeFilter === "expense"))
                .map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      onContextMenu={(e) => { e.preventDefault(); setSelectedCategory(cat.id); setCtxCat({ cat, x: e.clientX, y: e.clientY }); }}
                      onDoubleClick={() => { setCtxCat(null); setSelectedCategory(cat.id); setExpandedView(true); }}
                      title={`${cat.name} — duplo clique: expandir · clique direito: opções`}
                      className={cn(
                        "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-colors max-w-[12rem] select-none",
                        isSelected
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
                      )}
                    >
                      <CategoryIcon category={cat} size="sm" />
                      <span className="text-xs font-medium truncate">{cat.name}</span>
                    </button>
                  );
                })}
              {categories.length === 0 && <p className="text-sm text-muted-foreground py-2">Nenhuma categoria criada.</p>}
              <button
                onClick={toggleExpanded}
                title="Expandir para gerenciar"
                aria-label="Expandir"
                className="w-9 h-9 rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Versão expandida — cards com gestão (editar / ícone / limite / excluir) */}
          {expandedView && (
          <div className="cat-grid">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "cat-square glass-panel flex flex-col items-center justify-center gap-1 rounded-2xl transition-all",
                selectedCategory === "all"
                  ? "ring-2 ring-primary/50 text-primary"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <span className="text-lg font-bold leading-none">·</span>
              <span className="text-[10px] font-medium">Todas</span>
            </button>

            {categories
              .filter(c => catTypeFilter === "all" || c.type === catTypeFilter || (!c.type && catTypeFilter === "expense"))
              .map((cat) => {
                const spent = categoryExpenses[cat.id] || 0;
                const limit = cat.limit;
                const pct = limit && limit > 0 ? Math.min((spent / limit) * 100, 100) : null;
                const over = limit && limit > 0 && spent > limit;
                const isSelected = selectedCategory === cat.id;
                const isEditing = editingCatId === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "cat-square glass-panel flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer select-none",
                      isEditing
                        ? "ring-2 ring-primary/50"
                        : isSelected
                        ? "ring-2 ring-primary/50"
                        : "hover:ring-1 hover:ring-white/15"
                    )}
                    onClick={() => !isEditing && setSelectedCategory(cat.id)}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 w-full min-h-0">
                      <CategoryIcon category={cat} size={isSelected ? "md" : "xl"} />
                      <span className={cn("text-xs font-semibold truncate w-full text-center leading-tight", isSelected ? "text-primary" : "text-muted-foreground")}>
                        {cat.name}
                      </span>
                      {pct !== null && (
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className={cn("h-full rounded-full", over ? "bg-destructive" : pct > 80 ? "bg-yellow-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="w-full text-center space-y-0.5">
                          <p className={cn("text-[10px] font-bold tabular-nums", over ? "text-destructive" : pct !== null && pct > 80 ? "text-yellow-500" : "text-white")}>
                            {formatCurrency(spent)}
                          </p>
                          {limit && limit > 0 && (
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              limite {formatCurrency(limit)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 w-full mt-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleStartRename(cat.id, cat.name, cat.icon, cat.limit)}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-colors flex items-center justify-center"
                        title="Renomear"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartIconEdit(cat.id, cat.name, cat.icon, cat.limit)}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-colors flex items-center justify-center"
                        title="Editar ícone"
                      >
                        <Image className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(cat.id, cat.name)}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

            {categories.length === 0 && <p style={{ gridColumn: "1 / -1" }} className="text-sm text-muted-foreground py-2">Nenhuma categoria criada.</p>}
          </div>
          )}

          {/* Edit panel — shown below grid when editing */}
          {editingCatId && (() => {
            const cat = categories.find(c => c.id === editingCatId);
            if (!cat) return null;
            return (
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl p-3">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(v => !v)}
                  title="Alterar ícone"
                  className="shrink-0"
                >
                  <CategoryIcon category={{ ...cat, icon: editingIcon || cat.icon }} size="xl" />
                </button>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Nome da Categoria</p>
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 outline-none text-sm font-semibold text-white w-full"
                      placeholder="Nome da categoria"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-1">Definir limite de gasto</p>
                      <input
                        value={editingLimit}
                        onChange={e => setEditingLimit(e.target.value.replace(/[^0-9.,]/g, ""))}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 outline-none text-xs text-white w-full"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    <button
                      onClick={() => setShowIconPicker(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors self-end pb-1.5"
                      title="Alterar ícone"
                    >
                      <Image className="w-3 h-3" /> Alterar ícone
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={handleSaveEdit} className="px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 text-xs font-medium transition-colors flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Salvar
                  </button>
                  <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-white text-xs font-medium transition-colors flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Icon picker */}
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
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-5", showLimitCard ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
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
          {showLimitCard && (
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-center gap-2 border-l-4 border-l-primary">
              <div>
                <p className="text-sm text-muted-foreground truncate">Limite · {selCat!.name}</p>
                <p className="text-2xl font-bold font-display text-white tabular-nums">{formatCurrency(selLimit)}</p>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", selOver ? "bg-destructive" : selPct > 80 ? "bg-yellow-500" : "bg-primary")}
                    style={{ width: `${selPct}%` }}
                  />
                </div>
                <p className={cn("text-[11px] tabular-nums", selOver ? "text-destructive font-medium" : "text-muted-foreground")}>
                  {formatCurrency(selSpent)} usados · {selPct.toFixed(0)}%
                </p>
              </div>
            </div>
          )}
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
      {deleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteModal(null)}
        >
          <div
            className="glass-panel rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-display font-bold">Excluir categoria</h3>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir <span className="text-white font-semibold">"{deleteModal.name}"</span>?
              As transações associadas não serão apagadas.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
      {ctxCat && (() => {
        const cat = ctxCat.cat;
        const close = () => setCtxCat(null);
        const left = Math.min(ctxCat.x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 224);
        const top = Math.min(ctxCat.y, (typeof window !== "undefined" ? window.innerHeight : 9999) - 248);
        const itemCls = "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/10 transition-colors";
        return (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={close}
              onContextMenu={(e) => { e.preventDefault(); close(); }}
            />
            <div
              className="fixed z-50 w-52 glass-panel rounded-xl p-1.5 border border-white/10 shadow-xl select-none"
              style={{ left, top }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 px-2 py-1.5 mb-1 border-b border-white/10">
                <CategoryIcon category={cat} size="sm" />
                <span className="text-xs font-semibold text-white truncate">{cat.name}</span>
              </div>
              <button className={itemCls} onClick={() => { handleStartIconEdit(cat.id, cat.name, cat.icon, cat.limit); close(); }}>
                <Image className="w-4 h-4 shrink-0" /> Alterar ícone
              </button>
              <button className={itemCls} onClick={() => { handleStartRename(cat.id, cat.name, cat.icon, cat.limit); close(); }}>
                <Edit2 className="w-4 h-4 shrink-0" /> Alterar nome
              </button>
              <button className={itemCls} onClick={() => { handleStartRename(cat.id, cat.name, cat.icon, cat.limit); close(); }}>
                <Target className="w-4 h-4 shrink-0" /> Alterar limite
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-destructive/90 hover:text-destructive hover:bg-destructive/15 transition-colors"
                onClick={() => { handleDeleteRequest(cat.id, cat.name); close(); }}
              >
                <Trash2 className="w-4 h-4 shrink-0" /> Excluir
              </button>
            </div>
          </>
        );
      })()}
    </Layout>
  );
}
