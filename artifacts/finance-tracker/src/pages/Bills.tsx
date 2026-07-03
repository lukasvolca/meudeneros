import { Layout } from "@/components/Layout";
import { useFinance } from "@/context/FinanceContext";
import { formatCurrency } from "@/lib/utils";
import { Bill } from "@/lib/finance";
import { Plus, X, Trash2, Edit2, Check, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Bills() {
  const { bills, addBill, updateBill, deleteBill, toggleBillPaid, currentDate } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"fixed" | "variable">("fixed");

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthBills = bills.filter(
    (b) => b.month === currentMonth && b.year === currentYear ||
    // compatibilidade: bills antigas sem month/year
    (b.month === undefined && b.year === undefined)
  );

  const fixedBills = monthBills.filter((b) => b.type === "fixed");
  const variableBills = monthBills.filter((b) => b.type === "variable");

  const totalFixed = fixedBills.reduce((s, b) => s + b.amount, 0);
  const totalVariable = variableBills.reduce((s, b) => s + b.amount, 0);
  const totalPaid = monthBills.filter((b) => b.paid).reduce((s, b) => s + b.amount, 0);
  const totalPending = totalFixed + totalVariable - totalPaid;

  const resetForm = () => {
    setFormName("");
    setFormAmount("");
    setFormType("fixed");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAmount) return;
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (editingId) {
      updateBill(editingId, { name: formName.trim(), amount, type: formType });
    } else {
      addBill({ name: formName.trim(), amount, type: formType, month: currentMonth, year: currentYear });
    }
    resetForm();
  };

  const startEdit = (bill: Bill) => {
    setFormName(bill.name);
    setFormAmount(String(bill.amount));
    setFormType(bill.type);
    setEditingId(bill.id);
    setShowForm(true);
  };

  const renderBillRow = (bill: Bill) => (
    <div
      key={bill.id}
      className={`flex items-center gap-3 p-4 rounded-2xl transition-colors ${
        bill.paid ? "bg-success/5 border border-success/15" : "bg-white/5 border border-white/10"
      }`}
    >
      <button
        onClick={() => toggleBillPaid(bill.id)}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
          bill.paid
            ? "bg-success border-success text-white"
            : "border-white/30 hover:border-primary"
        }`}
      >
        {bill.paid && <Check className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${bill.paid ? "line-through text-muted-foreground" : "text-white"}`}>
          {bill.name}
        </p>
        {bill.paid && bill.paidAt && (
          <p className="text-xs text-success flex items-center gap-1 mt-0.5">
            <CalendarCheck className="w-3 h-3" />
            Pago em {format(parseISO(bill.paidAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
      </div>

      <span className={`font-bold text-sm shrink-0 ${bill.paid ? "text-success" : "text-destructive"}`}>
        {formatCurrency(bill.amount)}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => startEdit(bill)}
          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => deleteBill(bill.id)}
          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderSection = (title: string, items: Bill[], total: number) => (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-display font-bold">{title}</h3>
        <span className="text-sm font-bold text-destructive">{formatCurrency(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">Nenhuma conta cadastrada.</p>
      ) : (
        <div className="space-y-2">
          {items.map(renderBillRow)}
        </div>
      )}
    </div>
  );

  return (
    <Layout title="Contas do Mês">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 rounded-2xl">
            <p className="text-xs text-muted-foreground font-medium">Total Contas</p>
            <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalFixed + totalVariable)}</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl">
            <p className="text-xs text-muted-foreground font-medium">Pago</p>
            <p className="text-xl font-bold text-success mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="glass-panel p-5 rounded-2xl">
            <p className="text-xs text-muted-foreground font-medium">Pendente</p>
            <p className="text-xl font-bold text-destructive mt-1">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Fechar" : "Nova Conta"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-display font-bold">
              {editingId ? "Editar Conta" : "Nova Conta"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nome da conta"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                autoFocus
              />
              <input
                type="number"
                placeholder="Valor"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                step="0.01"
                min="0"
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
              />
              <div className="flex items-center gap-2">
                {(["fixed", "variable"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      formType === t
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-white/5 text-muted-foreground border border-white/10 hover:text-white"
                    }`}
                  >
                    {t === "fixed" ? "Fixa" : "Variável"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                {editingId ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </form>
        )}

        {renderSection("Contas Fixas", fixedBills, totalFixed)}
        {renderSection("Contas Variáveis", variableBills, totalVariable)}
      </div>
    </Layout>
  );
}
