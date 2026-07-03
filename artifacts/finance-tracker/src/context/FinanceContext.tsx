import React, { createContext, useContext, useEffect, useState } from "react";
import { Transaction, Category, Bill } from "../lib/finance";
import { generateId } from "../lib/utils";

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  bills: Bill[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => void;
  updateTransaction: (id: string, tx: Partial<Omit<Transaction, "id" | "createdAt">>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string, icon?: string, type?: "income" | "expense") => string;
  updateCategory: (id: string, updates: { name?: string; icon?: string; limit?: number }) => void;
  deleteCategory: (id: string) => void;
  addBill: (bill: { name: string; amount: number; type: "fixed" | "variable" }) => void;
  updateBill: (id: string, updates: { name?: string; amount?: number; type?: "fixed" | "variable" }) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string, monthKey: string) => void;
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

  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem("finance_bills");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Migrate old format (bills with month/year/paid/paidAt) to new template format
      return parsed.map((b: Bill & { month?: number; year?: number; paid?: boolean; paidAt?: string | null }) => {
        if (b.paidByMonth !== undefined) return b;
        const paidByMonth: Bill["paidByMonth"] = {};
        if (b.paid && b.month !== undefined && b.year !== undefined) {
          paidByMonth[`${b.year}-${b.month}`] = { paid: true, paidAt: b.paidAt ?? null };
        }
        return { id: b.id, name: b.name, amount: b.amount, type: b.type, paidByMonth, createdAt: b.createdAt };
      });
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

  useEffect(() => {
    try {
      localStorage.setItem("finance_bills", JSON.stringify(bills));
    } catch (e) {
      console.warn("Não foi possível salvar contas:", e);
    }
  }, [bills]);

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

  const updateCategory = (id: string, updates: { name?: string; icon?: string; limit?: number }) => {
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

  const addBill = (billData: { name: string; amount: number; type: "fixed" | "variable" }) => {
    const newBill: Bill = {
      id: generateId(),
      name: billData.name,
      amount: billData.amount,
      type: billData.type,
      paidByMonth: {},
      createdAt: new Date().toISOString(),
    };
    setBills((prev) => [...prev, newBill]);
  };

  const updateBill = (id: string, updates: { name?: string; amount?: number; type?: "fixed" | "variable" }) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBill = (id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleBillPaid = (id: string, monthKey: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const current = b.paidByMonth[monthKey];
        const nowPaid = !current?.paid;
        return {
          ...b,
          paidByMonth: {
            ...b.paidByMonth,
            [monthKey]: { paid: nowPaid, paidAt: nowPaid ? new Date().toISOString() : null },
          },
        };
      })
    );
  };

  const clearAllData = () => {
    setTransactions([]);
    setCategories([]);
    setBills([]);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        bills,
        currentDate,
        setCurrentDate,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addBill,
        updateBill,
        deleteBill,
        toggleBillPaid,
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
