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
          title="Welcome to FinTrack"
          description="Your premium financial journey starts here. Add your first transaction to unlock insights and take control of your wealth."
          actionLabel="Add Transaction"
          actionHref="/transactions"
        />
      ) : (
        <div className="space-y-8">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryCard 
              title="Available Balance" 
              amount={formatCurrency(balance)} 
              icon={<Wallet className="w-12 h-12 text-primary" />}
            />
            <SummaryCard 
              title="Total Income" 
              amount={formatCurrency(income)} 
              icon={<TrendingUp className="w-12 h-12 text-success" />}
              colorClass="text-success"
            />
            <SummaryCard 
              title="Total Expenses" 
              amount={formatCurrency(expenses)} 
              icon={<TrendingDown className="w-12 h-12 text-destructive" />}
              colorClass="text-destructive"
            />
            <SummaryCard 
              title="Saved This Month" 
              amount={formatCurrency(savings)} 
              icon={<PiggyBank className="w-12 h-12 text-accent" />}
              colorClass="text-accent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-display font-bold">Recent Activity</h3>
                <Link href="/transactions" className="text-sm font-medium text-primary hover:text-white flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <TransactionList transactions={recentTxs} emptyMessage="No transactions yet." />
            </div>

            {/* Category Breakdown (Current Month) */}
            <div className="space-y-6">
              <h3 className="text-xl font-display font-bold">Category Summary</h3>
              <div className="glass-panel p-6 rounded-2xl space-y-5">
                {Object.keys(categoryStats).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No data for this month.</p>
                ) : (
                  Object.entries(categoryStats)
                    .sort(([, a], [, b]) => b.expense - a.expense) // Sort by expense descending
                    .map(([catId, stats]) => {
                    const category = categories.find(c => c.id === catId);
                    const net = stats.income - stats.expense;
                    const isPositive = net >= 0;
                    
                    return (
                      <div key={catId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                          <div>
                            <p className="font-semibold">{category?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{stats.count} transactions</p>
                          </div>
                        </div>
                        <div className={`font-bold tracking-tight ${isPositive ? 'text-success' : 'text-destructive'}`}>
                          {isPositive ? '+' : '-'}{formatCurrency(Math.abs(net))}
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
