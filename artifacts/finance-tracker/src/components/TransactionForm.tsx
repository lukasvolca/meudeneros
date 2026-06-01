import { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { Plus, X, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { CategoryIconPicker } from "./CategoryIconPicker";
import { CategoryIcon } from "./CategoryIcon";

interface TransactionFormProps {
  initialData?: any;
  onClose?: () => void;
}

function formatAmountMask(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  while (d.length < 3) d = "0" + d;
  const cents = d.slice(-2);
  const integer = (d.slice(0, -2).replace(/^0+/, "") || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return integer + "," + cents;
}

function parseAmount(masked: string): number {
  return parseFloat(masked.replace(/\./g, "").replace(",", ".")) || 0;
}

function initAmountDisplay(value?: number): string {
  if (!value || value <= 0) return "";
  return formatAmountMask(String(Math.round(value * 100)));
}

export function TransactionForm({ initialData, onClose }: TransactionFormProps) {
  const { categories, addCategory, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<"income" | "expense">(initialData?.type || "expense");
  const [amount, setAmount] = useState(initAmountDisplay(initialData?.amount));
  const [title, setTitle] = useState(initialData?.title || "");
  const [date, setDate] = useState(
    initialData?.date
      ? format(new Date(initialData.date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || (categories[0]?.id || ""));
  const [errors, setErrors] = useState<{ title?: string; amount?: string; category?: string }>({});

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Typeless categories show only for expenses (they're usually expense categories)
  // Income mode shows only explicitly income-tagged categories
  const filteredCategories = categories.filter(c => c.type === type || (!c.type && type === "expense"));

  const displayDate = date ? date.split("-").reverse().join("/") : "";

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = formatAmountMask(e.target.value);
    setAmount(masked);
    setErrors(p => ({ ...p, amount: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = "Informe um nome para a transação.";
    if (!amount || parseAmount(amount) <= 0) e.amount = "Informe um valor válido.";
    if (!categoryId) e.category = "Selecione uma categoria.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const txData = {
      type,
      amount: parseAmount(amount),
      title: title.trim(),
      date: new Date(date + 'T12:00:00').toISOString(),
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
      setErrors({});
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const id = addCategory(newCategoryName.trim(), newCategoryIcon || undefined, type);
      setCategoryId(id);
      setIsAddingCategory(false);
      setNewCategoryName("");
      setNewCategoryIcon("");
      setShowIconPicker(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-display font-bold">
          {initialData ? "Editar Transação" : "Nova Transação"}
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Toggle */}
        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              type === "expense" ? "bg-destructive text-white" : "text-muted-foreground hover:text-white"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Saída
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              type === "income" ? "bg-success text-white" : "text-muted-foreground hover:text-white"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> Entrada
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valor com máscara BR */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                className="w-full glass-input rounded-xl py-3 pl-10 pr-4 text-lg font-semibold placeholder:text-white/20"
                placeholder="0,00"
              />
            </div>
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Data com display DD/MM/AAAA */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Data</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={displayDate}
                onClick={() => {
                  const picker = document.getElementById("__date_picker") as HTMLInputElement | null;
                  if (picker?.showPicker) picker.showPicker();
                }}
                className="w-full glass-input rounded-xl py-3 px-4 text-white cursor-pointer"
                placeholder="DD/MM/AAAA"
              />
              <input
                type="date"
                id="__date_picker"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", top: 0, left: 0, pointerEvents: "none" }}
                tabIndex={-1}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Nome</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
            className="w-full glass-input rounded-xl py-3 px-4 text-white placeholder:text-white/20"
            placeholder="Ex: Aluguel, Salário, Mercado..."
          />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">Categoria</label>

          {isAddingCategory ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(v => !v)}
                    title="Escolher ícone"
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center"
                  >
                    <CategoryIcon
                      category={newCategoryIcon ? { id: '', name: newCategoryName, icon: newCategoryIcon, createdAt: '' } : undefined}
                      size="sm"
                      className="w-8 h-8"
                    />
                  </button>
                </div>
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 glass-input rounded-xl py-3 px-4"
                  placeholder="Nome da nova categoria"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                    if (e.key === 'Escape') { setIsAddingCategory(false); setShowIconPicker(false); }
                  }}
                />
                <button type="button" onClick={handleAddCategory}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                  Criar
                </button>
                <button type="button" onClick={() => { setIsAddingCategory(false); setShowIconPicker(false); }}
                  className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {showIconPicker && (
                <CategoryIconPicker
                  value={newCategoryIcon}
                  onChange={setNewCategoryIcon}
                  onClose={() => setShowIconPicker(false)}
                />
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                  <CategoryIcon category={selectedCategory} size="sm" />
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); setErrors(p => ({ ...p, category: undefined })); }}
                  className="w-full glass-input rounded-xl py-3 pl-12 pr-4 appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecione uma categoria</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-background text-foreground">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium"
                title="Nova categoria"
              >
                <Plus className="w-4 h-4 text-primary" />
                Nova
              </button>
            </div>
          )}
          {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {initialData ? "Salvar Alterações" : "Salvar Transação"}
        </button>
      </form>
    </div>
  );
}
