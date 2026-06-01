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
  addCategory: (name: string, icon?: string, type?: "income" | "expense") => string;
  updateCategory: (id: string, updates: { name?: string; icon?: string }) => void;
  deleteCategory: (id: string) => void;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem("finance_transactions");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem("finance_categories");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    try {
      localStorage.setItem("finance_transactions", JSON.stringify(transactions));
    } catch (e) {
      console.warn("Não foi possível salvar transações:", e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem("finance_categories", JSON.stringify(categories));
    } catch (e) {
      console.warn("Não foi possível salvar categorias (armazenamento cheio):", e);
    }
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
      prev.map((tx) => {
        if (tx.id !== id) return tx;
        const category = txData.categoryId
          ? categories.find(c => c.id === txData.categoryId)
          : undefined;
        return {
          ...tx,
          ...txData,
          categoryName: category?.name || txData.categoryName || tx.categoryName,
        };
      })
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const addCategory = (name: string, icon?: string, type?: "income" | "expense") => {
    const id = generateId();
    const newCat: Category = { id, name, icon, type, createdAt: new Date().toISOString() };
    setCategories((prev) => [...prev, newCat]);
    return id;
  };

  const updateCategory = (id: string, updates: { name?: string; icon?: string }) => {
    setCategories((prev) => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (updates.name) {
      setTransactions((prev) =>
        prev.map(tx => tx.categoryId === id ? { ...tx, categoryName: updates.name! } : tx)
      );
    }
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const clearAllData = () => {
    setTransactions([]);
    setCategories([]);
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
        updateCategory,
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
