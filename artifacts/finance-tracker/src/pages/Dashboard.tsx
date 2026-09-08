import { Layout } from "@/components/Layout";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionList } from "@/components/TransactionList";
import { EmptyState } from "@/components/EmptyState";
import { useFinance } from "@/context/FinanceContext";
import {
  filterTransactionsByMonth,
  getTotalExpenses,
  getTotalIncome,
  getTransactionsByCategory,
} from "@/lib/finance";
import { formatCurrency, cn } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, CalendarDays, ArrowRight, Check, Clock, PiggyBank, Upload } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryDonut, type DonutSlice } from "@/components/CategoryDonut";
import { QuickAdd } from "@/components/QuickAdd";

export default function Dashboard() {
  const { transactions, bills, currentDate, categories, initialBalance, setInitialBalance, pendingMigration, migrateFromLocalStorage, dismissMigration } = useFinance();
  const [migrating, setMigrating] = useState(false);
  const [balanceInput, setBalanceInput] = useState(initialBalance > 0 ? String(initialBalance) : "");

  const currentMonthTxs = filterTransactionsByMonth(transactions, currentDate.getMonth(), currentDate.getFullYear());

  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  const billsPaid = bills.filter(b => b.paidByMonth[monthKey]?.paid);
  const billsPending = bills.filter(b => !b.paidByMonth[monthKey]?.paid);
  const billsTotalAmount = bills.reduce((s, b) => s + b.amount, 0);
  const billsPaidAmount = billsPaid.reduce((s, b) => s + b.amount, 0);
  const billsProgress = billsTotalAmount > 0 ? (billsPaidAmount / billsTotalAmount) * 100 : 0;

  const income = getTotalIncome(currentMonthTxs);
  const expenses = getTotalExpenses(currentMonthTxs);

  // "Economizado mês anterior" = saldo acumulado até o fim do mês anterior:
  // saldo inicial + TODAS as entradas/saídas/contas pagas ANTES do mês atual
  // (não só o mês anterior isolado — senão os meses do meio somem).
  const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
  const pastTxs = transactions.filter((t) => new Date(t.date).getTime() < startOfCurrentMonth);
  const pastIncome = getTotalIncome(pastTxs);
  const pastExpenses = getTotalExpenses(pastTxs);
  let pastBillsPaid = 0;
  for (const b of bills) {
    for (const [key, v] of Object.entries(b.paidByMonth)) {
      if (!v?.paid) continue;
      const [ky, km] = key.split("-").map(Number);
      const beforeCurrent = ky < currentDate.getFullYear() || (ky === currentDate.getFullYear() && km < currentDate.getMonth());
      if (beforeCurrent) pastBillsPaid += b.amount;
    }
  }
  const prevMonthSaved = initialBalance + pastIncome - pastExpenses - pastBillsPaid;
  const saldoDisponivel = prevMonthSaved + income - expenses - billsPaidAmount;

  const categoryStats = getTransactionsByCategory(currentMonthTxs);

  // --- Dados do donut de gastos por categoria ---
  // Paleta categórica validada (CVD-safe no fundo do app); ordem fixa, nunca cicla.
  const DONUT_COLORS = ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181", "#d95926"];
  const OUTROS_COLOR = "#6b7280";
  const MAX_SLICES = 8;

  const expenseEntries = Object.entries(categoryStats)
    .filter(([, s]) => s.expense > 0)
    .map(([catId, s]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: cat?.name || "Sem categoria",
        amount: s.expense,
        count: s.transactions.filter((t) => t.type === "expense").length,
        limit: cat?.limit,
        icon: cat?.icon,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const donutTotal = expenseEntries.reduce((s, e) => s + e.amount, 0);

  let donutSlices: DonutSlice[];
  if (expenseEntries.length > MAX_SLICES) {
    const head = expenseEntries.slice(0, MAX_SLICES - 1);
    const tail = expenseEntries.slice(MAX_SLICES - 1);
    const outros = {
      id: "__outros__",
      name: "Outros",
      amount: tail.reduce((s, e) => s + e.amount, 0),
      count: tail.reduce((s, e) => s + e.count, 0),
    };
    donutSlices = [...head, outros].map((e, i) => ({ ...e, color: e.id === "__outros__" ? OUTROS_COLOR : DONUT_COLORS[i] }));
  } else {
    donutSlices = expenseEntries.map((e, i) => ({ ...e, color: DONUT_COLORS[i] }));
  }

  const incomeItems = Object.entries(categoryStats)
    .filter(([, s]) => s.income > 0)
    .map(([catId, s]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: cat?.name || "Sem categoria",
        amount: s.income,
        icon: cat?.icon,
        count: s.transactions.filter((t) => t.type === "income").length,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const recentTxs = [...currentMonthTxs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const top5Expenses = [...currentMonthTxs]
    .filter(t => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const top5Income = [...currentMonthTxs]
    .filter(t => t.type === "income")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const userName = (window as any)._userProfile?.name;
  const greeting = userName ? `Bem-vindo, ${userName}` : "Bem-vindo";
  const hasData = transactions.length > 0 || bills.length > 0;

  return (
    <Layout title={greeting}>
      {pendingMigration && (
        <div className="glass-panel border border-primary/30 bg-primary/5 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-2">
          <Upload className="w-5 h-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Dados encontrados neste dispositivo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Detectamos seus dados salvos localmente. Deseja importá-los para a nuvem?</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={async () => { setMigrating(true); await migrateFromLocalStorage(); setMigrating(false); }}
              disabled={migrating}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {migrating ? "Importando..." : "Importar"}
            </button>
            <button
              onClick={dismissMigration}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="glass-panel p-10 rounded-3xl max-w-md w-full flex flex-col items-center gap-6 text-center">
            <PiggyBank className="w-16 h-16 text-primary" />
            <div>
              <h2 className="text-2xl font-display font-bold text-white">Bem-vindo ao Meu Deneros</h2>
              <p className="text-muted-foreground text-sm mt-2">Para começar, informe o seu saldo atual. Você pode deixar em branco se quiser pular.</p>
            </div>
            <div className="w-full space-y-2">
              <label className="text-xs text-muted-foreground font-medium text-left block">Saldo atual (R$)</label>
              <input
                type="number"
                placeholder="0,00"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-lg font-bold placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors text-center"
              />
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/transactions"
                onClick={() => {
                  const val = parseFloat(balanceInput);
                  setInitialBalance(!isNaN(val) && val > 0 ? val : 0);
                }}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-center"
              >
                Começar
              </Link>
              <button
                onClick={() => {
                  setInitialBalance(0);
                  setBalanceInput("");
                }}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Pular por agora
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <SummaryCard
              title="Saldo Disponível"
              amount={formatCurrency(saldoDisponivel)}
              icon={<Wallet className="w-12 h-12 text-primary" />}
            />
            <SummaryCard
              title="Total de Entradas"
              amount={formatCurrency(income)}
              icon={<TrendingUp className="w-12 h-12 text-success" />}
              colorClass="text-success"
            />
            <SummaryCard
              title="Total de Saídas"
              amount={formatCurrency(expenses + billsPaidAmount)}
              icon={<TrendingDown className="w-12 h-12 text-destructive" />}
              colorClass="text-destructive"
            />
            <SummaryCard
              title="Economizado mês anterior"
              amount={formatCurrency(prevMonthSaved)}
              icon={<CalendarDays className="w-12 h-12 text-accent" />}
              colorClass="text-accent"
              editValue={prevMonthSaved}
              onSave={(value) => setInitialBalance(value - (pastIncome - pastExpenses - pastBillsPaid))}
              editHint="Ajusta o saldo inicial para bater com este valor. O Saldo Disponível acompanha."
            />
          </div>

          <QuickAdd />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopList
              title="Top 5 Gastos"
              txs={top5Expenses}
              type="expense"
              categories={categories}
              empty="Sem gastos neste mês."
            />
            <TopList
              title="Top 5 Entradas"
              txs={top5Income}
              type="income"
              categories={categories}
              empty="Sem entradas neste mês."
            />
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold">Gastos por Categoria</h3>
              <span className="text-xs text-muted-foreground tabular-nums">{formatCurrency(donutTotal)} no mês</span>
            </div>
            {donutTotal <= 0 && incomeItems.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sem dados neste mês.</p>
            ) : (
              <CategoryDonut slices={donutSlices} total={donutTotal} incomeItems={incomeItems} />
            )}
          </div>

          {bills.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-bold">Contas do Mês</h3>
                <Link href="/bills" className="text-sm font-medium text-primary hover:text-white flex items-center gap-1 transition-colors">
                  Ver Tudo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{billsPaid.length} de {bills.length} pagas</span>
                  <span>{formatCurrency(billsPaidAmount)} / {formatCurrency(billsTotalAmount)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", billsProgress === 100 ? "bg-success" : "bg-primary")}
                    style={{ width: `${billsProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {bills.map(b => {
                  const paid = b.paidByMonth[monthKey]?.paid ?? false;
                  return (
                    <div key={b.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {paid
                          ? <Check className="w-3.5 h-3.5 text-success shrink-0" />
                          : <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        }
                        <span className={`text-sm ${paid ? "line-through text-muted-foreground" : "text-white"}`}>
                          {b.name}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${paid ? "text-success" : "text-destructive"}`}>
                        {formatCurrency(b.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold">Atividade Recente</h3>
              <Link href="/transactions" className="text-sm font-medium text-primary hover:text-white flex items-center gap-1 transition-colors">
                Ver Tudo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="glass-panel p-6 rounded-3xl">
              <TransactionList transactions={recentTxs} emptyMessage="Nenhuma transação ainda." />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function TopList({ title, txs, type, categories, empty }: {
  title: string;
  txs: ReturnType<typeof useFinance>["transactions"];
  type: "income" | "expense";
  categories: ReturnType<typeof useFinance>["categories"];
  empty: string;
}) {
  return (
    <div className="glass-panel p-6 rounded-3xl space-y-4">
      <h3 className="text-base font-display font-bold">{title}</h3>
      {txs.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">{empty}</p>
      ) : (
        <div className="space-y-3">
          {txs.map(tx => {
            const category = categories.find(c => c.id === tx.categoryId);
            return (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon category={category} size="sm" />
                  <p className="text-sm font-medium truncate">{tx.title}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ml-4 flex-shrink-0 ${type === "expense" ? "text-destructive" : "text-success"}`}>
                  {type === "expense" ? "-" : "+"}{formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
