
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { Expense, Budget, Category, Income, BudgetTarget } from "@/lib/types";
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
  setBudgets: (budgets: Budget[]) => void;
  budgetTarget: BudgetTarget;
  setBudgetTarget: (target: BudgetTarget) => void;
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

  const { data: userData, isLoading: userLoading } = useDoc<any>(userDocRef);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesColRef);
  const { data: income, isLoading: incomeLoading } = useCollection<Income>(incomeColRef);
  const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsColRef);
  
  const allowance = userData?.allowance ?? 0;
  const budgetTarget = userData?.budgetTarget ?? { amount: 0, period: 'daily' };

  const isLoading = userLoading || expensesLoading || incomeLoading || budgetsLoading;
  
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
      if (!firestore || !budgetsColRef) return;
      const batch = writeBatch(firestore);

      // First, delete all existing budgets for the user
      budgets?.forEach(oldBudget => {
        const docRef = doc(budgetsColRef, oldBudget.categoryId); // Assuming categoryId is the doc id
        batch.delete(docRef);
      });

      // Then, add the new budgets
      newBudgets.forEach(b => {
          const docRef = doc(budgetsColRef, b.categoryId); // Use categoryId as the document ID
          batch.set(docRef, { amount: b.amount });
      });

      batch.commit().catch(error => console.error("Set budgets failed:", error));
  }, [firestore, budgetsColRef, budgets]);


  const savingsBudget = useMemo(() => {
    const savingsCategory = categories.find(c => c.type === 'savings');
    if (!savingsCategory || !budgets) return 0;
    return budgets.find(b => b.categoryId === savingsCategory.id)?.amount ?? 0;
  }, [budgets, categories]);

  const totalSpent = useMemo(
    () => (expenses ?? []).reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const remainingBalance = useMemo(
    () => allowance - totalSpent - savingsBudget,
    [allowance, totalSpent, savingsBudget]
  );

  const dailyAverage = useMemo(() => {
    if (!expenses || expenses.length === 0) return 0;
    const firstExpenseDate = expenses.reduce((earliest, e) => {
      const eDate = parseISO(e.date);
      return eDate < earliest ? eDate : earliest;
    }, new Date());

    const days = differenceInDays(new Date(), firstExpenseDate) + 1;
    return totalSpent / days;
  }, [expenses, totalSpent]);

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
    budgets: (budgets ?? []).map(b => ({...b, categoryId: (b as any).id })), // Map Firestore doc ID to categoryId
    setBudgets,
    budgetTarget,
    setBudgetTarget,
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
