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
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { CategoryIcon } from "@/components/CategoryIcon";
import { subMonths } from "date-fns";

export default function Dashboard() {
  const { transactions, currentDate, categories } = useFinance();

  const prevDate = subMonths(currentDate, 1);
  const currentMonthTxs = filterTransactionsByMonth(transactions, currentDate.getMonth(), currentDate.getFullYear());
  const prevMonthTxs = filterTransactionsByMonth(transactions, prevDate.getMonth(), prevDate.getFullYear());

  const netOf = (txs: typeof transactions) =>
    txs.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);

  const prevMonthNet = netOf(prevMonthTxs);
  const prevMonthSaved = prevMonthNet < 0 ? 0 : prevMonthNet;
  const income = getTotalIncome(currentMonthTxs);
  const expenses = getTotalExpenses(currentMonthTxs);
  const saldoDisponivel = prevMonthSaved + income - expenses;

  const categoryStats = getTransactionsByCategory(currentMonthTxs);

  const recentTxs = [...transactions]
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
  const hasData = transactions.length > 0;

  return (
    <Layout title={greeting}>
      {!hasData ? (
        <EmptyState
          title="Bem-vindo ao Meu Deneros"
          description="Sua jornada financeira começa aqui. Adicione sua primeira transação para visualizar o resumo do mês."
          actionLabel="Adicionar Transação"
          actionHref="/transactions"
        />
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
              amount={formatCurrency(expenses)}
              icon={<TrendingDown className="w-12 h-12 text-destructive" />}
              colorClass="text-destructive"
            />
            <SummaryCard
              title="Economizado mês anterior"
              amount={formatCurrency(prevMonthSaved)}
              icon={<CalendarDays className="w-12 h-12 text-accent" />}
              colorClass="text-accent"
            />
          </div>

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

          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-display font-bold">Resumo por Categoria</h3>
            {Object.keys(categoryStats).length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Sem dados neste mês.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryStats)
                  .sort(([, a], [, b]) => b.expense - a.expense)
                  .map(([catId, stats]) => {
                    const category = categories.find(c => c.id === catId);
                    const net = stats.income - stats.expense;
                    const hasOnlyIncome = stats.expense === 0;
                    const hasOnlyExpense = stats.income === 0;
                    const displayValue = hasOnlyIncome
                      ? `+${formatCurrency(stats.income)}`
                      : hasOnlyExpense
                      ? `-${formatCurrency(stats.expense)}`
                      : `${net >= 0 ? "+" : "-"}${formatCurrency(Math.abs(net))}`;
                    const colorClass = hasOnlyIncome || net > 0 ? "text-success" : "text-destructive";
                    return (
                      <div key={catId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={category} size="sm" />
                          <div>
                            <p className="font-semibold text-sm">{category?.name || "Sem categoria"}</p>
                            <p className="text-xs text-muted-foreground">{stats.count} transaç{stats.count === 1 ? "ão" : "ões"}</p>
                          </div>
                        </div>
                        <span className={`font-bold text-sm ${colorClass}`}>{displayValue}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

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
