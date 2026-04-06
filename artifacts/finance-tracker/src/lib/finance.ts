import { isSameMonth, isSameYear, parseISO, isValid } from "date-fns";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO string
  title: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string; // lucide icon name (e.g. "ShoppingCart") or base64 data URL
  createdAt: string;
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  month: number, // 0-11
  year: number
): Transaction[] {
  return transactions.filter((t) => {
    const date = parseISO(t.date);
    if (!isValid(date)) return false;
    const targetDate = new Date(year, month);
    return isSameMonth(date, targetDate) && isSameYear(date, targetDate);
  });
}

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getBalance(transactions: Transaction[]): number {
  return getTotalIncome(transactions) - getTotalExpenses(transactions);
}

export function getSavings(transactions: Transaction[]): number {
  const balance = getBalance(transactions);
  return balance > 0 ? balance : 0;
}

export function getTransactionsByCategory(transactions: Transaction[]) {
  const grouped: Record<string, { income: number; expense: number; count: number; transactions: Transaction[] }> = {};

  transactions.forEach((t) => {
    if (!grouped[t.categoryId]) {
      grouped[t.categoryId] = { income: 0, expense: 0, count: 0, transactions: [] };
    }
    grouped[t.categoryId].count += 1;
    grouped[t.categoryId].transactions.push(t);
    if (t.type === "income") {
      grouped[t.categoryId].income += t.amount;
    } else {
      grouped[t.categoryId].expense += t.amount;
    }
  });

  return grouped;
}

export function getRecentTransactions(transactions: Transaction[], n: number = 5): Transaction[] {
  return [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, n);
}
