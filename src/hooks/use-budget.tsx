

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { Expense, Budget, Category, Income, BudgetTarget, SinkingFund } from "@/lib/types";
import { seedCategories } from "@/lib/seed";
import { differenceInDays, parseISO } from "date-fns";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { 
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase/non-blocking-updates";


interface BudgetContextType {
  allowance: number;
  setAllowance: (amount: number) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  addExpenses: (expenses: Omit<Expense, "id">[]) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  deleteExpenses: (ids: string[]) => void;
  income: Income[];
  addIncome: (income: Omit<Income, "id">) => void;
  deleteIncomes: (ids: string[]) => void;
  categories: Category[];
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => Promise<void>;
  budgetTarget: BudgetTarget;
  setBudgetTarget: (target: BudgetTarget) => void;
  sinkingFunds: SinkingFund[];
  addSinkingFund: (fund: Omit<SinkingFund, 'id' | 'currentAmount'>) => void;
  updateSinkingFund: (fund: SinkingFund) => void;
  deleteSinkingFund: (id: string) => void;
  allocateToSinkingFund: (id: string, amount: number) => void;
  totalSpent: number;
  remainingBalance: number;
  dailyAverage: number;
  survivalDays: number;
  getCategoryById: (id: string) => Category | undefined;
  getBudgetForCategory: (categoryId: string) => number;
  getSpentForCategory: (categoryId: string) => number;
  isLoading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const expensesColRef = useMemoFirebase(() => {
    if (!userDocRef) return null;
    return collection(userDocRef, 'expenses');
  }, [userDocRef]);

  const incomeColRef = useMemoFirebase(() => {
    if (!userDocRef) return null;
    return collection(userDocRef, 'income');
  }, [userDocRef]);

  const budgetsColRef = useMemoFirebase(() => {
    if (!userDocRef) return null;
    return collection(userDocRef, 'budgets');
  }, [userDocRef]);
  
  const sinkingFundsColRef = useMemoFirebase(() => {
    if (!userDocRef) return null;
    return collection(userDocRef, 'sinkingFunds');
  }, [userDocRef]);

  const { data: userData, isLoading: userLoading } = useDoc<any>(userDocRef);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesColRef);
  const { data: income, isLoading: incomeLoading } = useCollection<Income>(incomeColRef);
  const { data: budgetsFromHook, isLoading: budgetsLoading } = useCollection<Budget>(budgetsColRef);
  const { data: sinkingFunds, isLoading: sinkingFundsLoading } = useCollection<SinkingFund>(sinkingFundsColRef);
  
  const budgets = useMemo(() => {
    if (!budgetsFromHook) return [];
    // The document ID from firestore is the categoryId
    return budgetsFromHook.map(b => ({ ...b, categoryId: (b as any).id }));
  }, [budgetsFromHook]);

  const allowance = userData?.allowance ?? 0;
  const budgetTarget = userData?.budgetTarget ?? { amount: 0, period: 'daily' };

  const isLoading = userLoading || expensesLoading || incomeLoading || budgetsLoading || sinkingFundsLoading;
  
  const categories = seedCategories;

  const setAllowance = useCallback((amount: number) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { allowance: amount });
  }, [userDocRef]);

  const setBudgetTarget = useCallback((target: BudgetTarget) => {
    if (!userDocRef) return;
    updateDocumentNonBlocking(userDocRef, { budgetTarget: target });
  }, [userDocRef]);

  const addExpense = useCallback(
    (expense: Omit<Expense, "id">) => {
      if (!expensesColRef) return;
      addDocumentNonBlocking(expensesColRef, expense);
    },
    [expensesColRef]
  );
  
  const addExpenses = useCallback(
    (expensesToAdd: Omit<Expense, "id">[]) => {
      if (!firestore || !expensesColRef) return;
      const batch = writeBatch(firestore);
      expensesToAdd.forEach((expense) => {
        const newDocRef = doc(expensesColRef);
        batch.set(newDocRef, expense);
      });
      batch.commit().catch(error => console.error("Batch add expenses failed:", error));
    },
    [firestore, expensesColRef]
  );

  const updateExpense = useCallback(
    (updatedExpense: Expense) => {
      if (!expensesColRef) return;
      const { id, ...data } = updatedExpense;
      const docRef = doc(expensesColRef, id);
      updateDocumentNonBlocking(docRef, data);
    },
    [expensesColRef]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      if (!expensesColRef) return;
      const docRef = doc(expensesColRef, id);
      deleteDocumentNonBlocking(docRef);
    },
    [expensesColRef]
  );

  const deleteExpenses = useCallback(
    (ids: string[]) => {
      if (!firestore || !expensesColRef) return;
      const batch = writeBatch(firestore);
      ids.forEach(id => {
        batch.delete(doc(expensesColRef, id));
      });
      batch.commit().catch(error => console.error("Batch delete expenses failed:", error));
    },
    [firestore, expensesColRef]
  );
  
  const addIncome = useCallback(
    (incomeItem: Omit<Income, "id">) => {
      if (!incomeColRef || !userDocRef) return;
      addDocumentNonBlocking(incomeColRef, incomeItem);
      const newAllowance = allowance + incomeItem.amount;
      updateDocumentNonBlocking(userDocRef, { allowance: newAllowance });
    },
    [incomeColRef, userDocRef, allowance]
  );

  const deleteIncomes = useCallback(
    (ids: string[]) => {
        if (!firestore || !incomeColRef || !userDocRef || !income) return;
        const batch = writeBatch(firestore);
        let amountToReduce = 0;
        
        ids.forEach(id => {
            const incomeToDelete = income.find(inc => inc.id === id);
            if (incomeToDelete) {
                amountToReduce += incomeToDelete.amount;
                batch.delete(doc(incomeColRef, id));
            }
        });
        const newAllowance = allowance - amountToReduce;
        batch.update(userDocRef, { allowance: newAllowance });

        batch.commit().catch(error => console.error("Batch delete incomes failed:", error));
    },
    [firestore, incomeColRef, userDocRef, income, allowance]
  );
  
  const setBudgets = useCallback((newBudgets: Budget[]) => {
    if (!firestore || !budgetsColRef) return Promise.reject("Firestore not ready");
    const batch = writeBatch(firestore);
    
    // Create a map of the existing budgets for quick lookup
    const existingBudgetsMap = new Map(budgets.map(b => [b.categoryId, b]));

    newBudgets.forEach(b => {
      const docRef = doc(budgetsColRef, b.categoryId);
      const dataToSet: Partial<Budget> & { categoryId?: string } = { ...b };
      delete dataToSet.categoryId; // Don't save categoryId in the document itself

      if (Object.keys(dataToSet).length > 0) {
        batch.set(docRef, dataToSet, { merge: true });
      }
    });
    
    return batch.commit();
  }, [firestore, budgetsColRef, budgets]);

  const addSinkingFund = useCallback((fund: Omit<SinkingFund, 'id' | 'currentAmount'>) => {
    if (!sinkingFundsColRef) return;
    addDocumentNonBlocking(sinkingFundsColRef, { ...fund, currentAmount: 0 });
  }, [sinkingFundsColRef]);

  const updateSinkingFund = useCallback((fund: SinkingFund) => {
    if (!sinkingFundsColRef) return;
    const { id, ...data } = fund;
    const docRef = doc(sinkingFundsColRef, id);
    updateDocumentNonBlocking(docRef, data);
  }, [sinkingFundsColRef]);

  const deleteSinkingFund = useCallback((id: string) => {
    if (!sinkingFundsColRef) return;
    const fundDocRef = doc(sinkingFundsColRef, id);
    deleteDocumentNonBlocking(fundDocRef);
  }, [sinkingFundsColRef]);
  
  const allocateToSinkingFund = useCallback((id: string, amount: number) => {
      if (!firestore || !sinkingFundsColRef || !sinkingFunds || !userDocRef) return;
      const fund = sinkingFunds.find(f => f.id === id);
      if (fund) {
          const newCurrentAmount = (fund.currentAmount || 0) + amount;
          const fundDocRef = doc(sinkingFundsColRef, id);
          
          const batch = writeBatch(firestore);
          batch.update(fundDocRef, { currentAmount: newCurrentAmount });
          batch.commit();
      }
  }, [firestore, sinkingFundsColRef, sinkingFunds, userDocRef, allowance]);


  const totalSpent = useMemo(
    () => (expenses ?? []).filter(e => {
        const category = categories.find(c => c.id === e.categoryId);
        return category?.type !== 'savings';
    }).reduce((sum, e) => sum + e.amount, 0),
    [expenses, categories]
  );
  
  const totalSavingsBudget = useMemo(() => {
    return (budgets ?? []).find(b => b.categoryId === 'savings')?.amount ?? 0;
  }, [budgets]);
  
  const totalSinkingFundsAllocated = useMemo(() => {
    return (sinkingFunds ?? []).reduce((sum, fund) => sum + fund.currentAmount, 0);
  }, [sinkingFunds]);


  const remainingBalance = useMemo(
    () => allowance - totalSpent - totalSavingsBudget - totalSinkingFundsAllocated,
    [allowance, totalSpent, totalSavingsBudget, totalSinkingFundsAllocated]
  );

  const dailyAverage = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    const spendingExpenses = expenses.filter(e => {
        const category = categories.find(c => c.id === e.categoryId);
        return category?.type !== 'savings';
    });
    if (spendingExpenses.length === 0) return 0;

    const firstExpenseDate = spendingExpenses.reduce((earliest, e) => {
      const eDate = parseISO(e.date);
      return eDate < earliest ? eDate : earliest;
    }, new Date());

    const days = differenceInDays(new Date(), firstExpenseDate) + 1;
    return totalSpent / days;
  }, [expenses, totalSpent, categories]);

  const survivalDays = useMemo(() => {
    if (remainingBalance <= 0) return 0;
    
    let dailyTarget = 0;
    if (budgetTarget && budgetTarget.amount > 0) {
      switch (budgetTarget.period) {
        case 'daily':
          dailyTarget = budgetTarget.amount;
          break;
        case 'weekly':
          dailyTarget = budgetTarget.amount / 7;
          break;
        case 'monthly':
          dailyTarget = budgetTarget.amount / 30; // Approximation
          break;
      }
    }
    
    const spendRate = dailyTarget > 0 ? dailyTarget : dailyAverage;

    if (spendRate <= 0) return Infinity;
    return remainingBalance / spendRate;
  }, [remainingBalance, dailyAverage, budgetTarget]);

  const getCategoryById = useCallback(
    (id: string) => categories.find((c) => c.id === id),
    [categories]
  );

  const getBudgetForCategory = useCallback(
    (categoryId: string) =>
      (budgets ?? []).find((b) => b.categoryId === categoryId)?.amount ?? 0,
    [budgets]
  );

  const getSpentForCategory = useCallback(
    (categoryId: string) =>
      (expenses ?? [])
        .filter((e) => e.categoryId === categoryId)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );
  
  const value: BudgetContextType = {
    allowance,
    setAllowance,
    expenses: expenses ?? [],
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
    deleteExpenses,
    income: income ?? [],
    addIncome,
    deleteIncomes,
    categories,
    budgets: budgets ?? [],
    setBudgets,
    budgetTarget,
    setBudgetTarget,
    sinkingFunds: sinkingFunds ?? [],
    addSinkingFund,
    updateSinkingFund,
    deleteSinkingFund,
    allocateToSinkingFund,
    totalSpent,
    remainingBalance,
    dailyAverage,
    survivalDays,
    getCategoryById,
    getBudgetForCategory,
    getSpentForCategory,
    isLoading,
  };

  return (
    <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
