import React, { createContext, useContext, useEffect, useState } from "react";
import { Transaction, Category } from "../lib/finance";
import { generateId } from "../lib/utils";

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (id: string, tx: Partial<Omit<Transaction, "id" | "createdAt">>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string) => string; // returns new category id
  deleteCategory: (id: string) => void;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [];

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("finance_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("finance_categories");
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem("finance_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("finance_categories", JSON.stringify(categories));
  }, [categories]);

  const addTransaction = (txData: Omit<Transaction, "id" | "createdAt">) => {
    const category = categories.find((c) => c.id === txData.categoryId);
    const newTx: Transaction = {
      ...txData,
      categoryName: category?.name || txData.categoryName || "",
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, newTx]);
  };

  const updateTransaction = (id: string, txData: Partial<Omit<Transaction, "id" | "createdAt">>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...txData } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const addCategory = (name: string) => {
    const id = generateId();
    const newCat: Category = {
      id,
      name,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    return id;
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    // Also remove or re-categorize transactions? Keeping it simple: don't delete associated txs, 
    // but they will lack a named category unless handled.
  };

  const clearAllData = () => {
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        currentDate,
        setCurrentDate,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        deleteCategory,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
