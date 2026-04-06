import { Layout } from "@/components/Layout";
import { SummaryCard } from "@/components/SummaryCard";
import { TransactionList } from "@/components/TransactionList";
import { EmptyState } from "@/components/EmptyState";
import { useFinance } from "@/context/FinanceContext";
import {
  filterTransactionsByMonth,
  getBalance,
  getTotalExpenses,
  getTotalIncome,
  getSavings,
  getRecentTransactions,
  getTransactionsByCategory
} from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { CategoryIcon } from "@/components/CategoryIcon";

export default function Dashboard() {
  const { transactions, currentDate, categories } = useFinance();

  const currentMonthTxs = filterTransactionsByMonth(transactions, currentDate.getMonth(), currentDate.getFullYear());

  const balance = getBalance(currentMonthTxs);
  const income = getTotalIncome(currentMonthTxs);
  const expenses = getTotalExpenses(currentMonthTxs);
  const savings = getSavings(currentMonthTxs);

  const recentTxs = getRecentTransactions(transactions, 5);
  const categoryStats = getTransactionsByCategory(currentMonthTxs);

  const hasData = transactions.length > 0;

  return (
    <Layout title="Dashboard">
      {!hasData ? (
        <EmptyState
          title="Bem-vindo ao FinTrack"
          description="Sua jornada financeira começa aqui. Adicione sua primeira transação para visualizar o resumo do mês."
          actionLabel="Adicionar Transação"
          actionHref="/transactions"
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <SummaryCard
              title="Saldo Disponível"
              amount={formatCurrency(balance)}
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
              title="Economizado no Mês"
              amount={formatCurrency(savings)}
              icon={<PiggyBank className="w-12 h-12 text-accent" />}
              colorClass="text-accent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display font-bold">Atividade Recente</h3>
                <Link href="/transactions" className="text-sm font-medium text-primary hover:text-white flex items-center gap-1 transition-colors">
                  Ver Tudo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <TransactionList transactions={recentTxs} emptyMessage="Nenhuma transação ainda." />
            </div>

            <div className="space-y-5">
              <h3 className="text-lg font-display font-bold">Resumo por Categoria</h3>
              <div className="glass-panel p-5 rounded-2xl space-y-3">
                {Object.keys(categoryStats).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">Sem dados neste mês.</p>
                ) : (
                  Object.entries(categoryStats)
                    .sort(([, a], [, b]) => b.expense - a.expense)
                    .map(([catId, stats]) => {
                      const category = categories.find(c => c.id === catId);
                      const hasOnlyIncome = stats.expense === 0 && stats.income > 0;
                      const hasOnlyExpense = stats.income === 0 && stats.expense > 0;
                      const net = stats.income - stats.expense;

                      let displayValue: string;
                      let colorClass: string;
                      if (hasOnlyIncome) {
                        displayValue = `+${formatCurrency(stats.income)}`;
                        colorClass = 'text-success';
                      } else if (hasOnlyExpense) {
                        displayValue = `-${formatCurrency(stats.expense)}`;
                        colorClass = 'text-destructive';
                      } else {
                        displayValue = `${net >= 0 ? '+' : '-'}${formatCurrency(Math.abs(net))}`;
                        colorClass = net >= 0 ? 'text-success' : 'text-destructive';
                      }

                      return (
                        <div key={catId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CategoryIcon category={category} size="sm" />
                            <div>
                              <p className="font-semibold text-sm">{category?.name || "Sem categoria"}</p>
                              <p className="text-xs text-muted-foreground">{stats.count} transaç{stats.count === 1 ? 'ão' : 'ões'}</p>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${colorClass}`}>
                            {displayValue}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
