import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Transaction, Category, Bill } from "../lib/finance";
import { generateId } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  bills: Bill[];
  initialBalance: number;
  setInitialBalance: (amount: number) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  loading: boolean;
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
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [initialBalance, setInitialBalanceState] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [txRes, catRes, billRes, settingsRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("categories").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("bills").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("user_settings").select("*").eq("user_id", user.id).single(),
      ]);

      setTransactions((txRes.data ?? []).map((r) => ({
        id: r.id, date: r.date, title: r.title, amount: r.amount,
        type: r.type, categoryId: r.category_id, categoryName: r.category_name,
        createdAt: r.created_at,
      })));

      setCategories((catRes.data ?? []).map((r) => ({
        id: r.id, name: r.name, icon: r.icon, type: r.type,
        limit: r.limit_amount, createdAt: r.created_at,
      })));

      setBills((billRes.data ?? []).map((r) => ({
        id: r.id, name: r.name, amount: r.amount, type: r.type,
        paidByMonth: r.paid_by_month ?? {}, createdAt: r.created_at,
      })));

      setInitialBalanceState(settingsRes.data?.initial_balance ?? 0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const setInitialBalance = async (amount: number) => {
    if (!user) return;
    setInitialBalanceState(amount);
    await supabase.from("user_settings").upsert({ user_id: user.id, initial_balance: amount, updated_at: new Date().toISOString() });
  };

  // --- Transactions ---
  const addTransaction = async (txData: Omit<Transaction, "id" | "createdAt">) => {
    if (!user) return;
    const id = generateId();
    const now = new Date().toISOString();
    const newTx: Transaction = { ...txData, id, createdAt: now };
    setTransactions((prev) => [...prev, newTx]);
    await supabase.from("transactions").insert({
      id, user_id: user.id, date: txData.date, title: txData.title,
      amount: txData.amount, type: txData.type,
      category_id: txData.categoryId, category_name: txData.categoryName,
      created_at: now,
    });
  };

  const updateTransaction = async (id: string, txData: Partial<Omit<Transaction, "id" | "createdAt">>) => {
    if (!user) return;
    setTransactions((prev) => prev.map((tx) => tx.id === id ? { ...tx, ...txData } : tx));
    await supabase.from("transactions").update({
      ...(txData.date && { date: txData.date }),
      ...(txData.title && { title: txData.title }),
      ...(txData.amount !== undefined && { amount: txData.amount }),
      ...(txData.type && { type: txData.type }),
      ...(txData.categoryId && { category_id: txData.categoryId }),
      ...(txData.categoryName && { category_name: txData.categoryName }),
    }).eq("id", id).eq("user_id", user.id);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  };

  // --- Categories ---
  const addCategory = (name: string, icon?: string, type?: "income" | "expense") => {
    if (!user) return "";
    const id = generateId();
    const now = new Date().toISOString();
    const newCat: Category = { id, name, icon, type, createdAt: now };
    setCategories((prev) => [...prev, newCat]);
    supabase.from("categories").insert({ id, user_id: user.id, name, icon, type, created_at: now });
    return id;
  };

  const updateCategory = async (id: string, updates: { name?: string; icon?: string; limit?: number }) => {
    if (!user) return;
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
    if (updates.name) {
      setTransactions((prev) => prev.map((tx) => tx.categoryId === id ? { ...tx, categoryName: updates.name! } : tx));
      await supabase.from("transactions").update({ category_name: updates.name }).eq("category_id", id).eq("user_id", user.id);
    }
    await supabase.from("categories").update({
      ...(updates.name && { name: updates.name }),
      ...(updates.icon !== undefined && { icon: updates.icon }),
      ...(updates.limit !== undefined && { limit_amount: updates.limit }),
    }).eq("id", id).eq("user_id", user.id);
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);
  };

  // --- Bills ---
  const addBill = async (billData: { name: string; amount: number; type: "fixed" | "variable" }) => {
    if (!user) return;
    const id = generateId();
    const now = new Date().toISOString();
    const newBill: Bill = { id, ...billData, paidByMonth: {}, createdAt: now };
    setBills((prev) => [...prev, newBill]);
    await supabase.from("bills").insert({ id, user_id: user.id, name: billData.name, amount: billData.amount, type: billData.type, paid_by_month: {}, created_at: now });
  };

  const updateBill = async (id: string, updates: { name?: string; amount?: number; type?: "fixed" | "variable" }) => {
    if (!user) return;
    setBills((prev) => prev.map((b) => b.id === id ? { ...b, ...updates } : b));
    await supabase.from("bills").update(updates).eq("id", id).eq("user_id", user.id);
  };

  const deleteBill = async (id: string) => {
    if (!user) return;
    setBills((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("bills").delete().eq("id", id).eq("user_id", user.id);
  };

  const toggleBillPaid = async (id: string, monthKey: string) => {
    if (!user) return;
    setBills((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const current = b.paidByMonth[monthKey];
        const nowPaid = !current?.paid;
        const updated = {
          ...b,
          paidByMonth: {
            ...b.paidByMonth,
            [monthKey]: { paid: nowPaid, paidAt: nowPaid ? new Date().toISOString() : null },
          },
        };
        supabase.from("bills").update({ paid_by_month: updated.paidByMonth }).eq("id", id).eq("user_id", user.id);
        return updated;
      })
    );
  };

  const clearAllData = async () => {
    if (!user) return;
    setTransactions([]); setCategories([]); setBills([]); setInitialBalanceState(0);
    await Promise.all([
      supabase.from("transactions").delete().eq("user_id", user.id),
      supabase.from("categories").delete().eq("user_id", user.id),
      supabase.from("bills").delete().eq("user_id", user.id),
      supabase.from("user_settings").delete().eq("user_id", user.id),
    ]);
  };

  return (
    <FinanceContext.Provider value={{
      transactions, categories, bills, initialBalance, setInitialBalance,
      currentDate, setCurrentDate, loading,
      addTransaction, updateTransaction, deleteTransaction,
      addCategory, updateCategory, deleteCategory,
      addBill, updateBill, deleteBill, toggleBillPaid,
      clearAllData,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
