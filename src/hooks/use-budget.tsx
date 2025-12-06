


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
import { collection, doc, writeBatch, runTransaction } from "firebase/firestore";
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
  setBudgets: (budgets: Budget[], balanceSnapshot: number) => Promise<void>;
  resetBudgetPlan: () => Promise<void>;
  budgetTarget: BudgetTarget;
  setBudgetTarget: (target: BudgetTarget) => void;
  sinkingFunds: SinkingFund[];
  addSinkingFund: (fund: Omit<SinkingFund, 'id' | 'currentAmount'>) => void;
  updateSinkingFund: (fund: SinkingFund) => void;
  deleteSinkingFund: (id: string) => void;
  allocateToSinkingFund: (id: string, amount: number) => void;
  spendFromSinkingFund: (sinkingFundId: string, categoryId: string) => void;
  totalSpent: number;
  remainingBalance: number;
  balanceAtBudgetSet: number;
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
  const balanceAtBudgetSet = userData?.balanceAtBudgetSet ?? 0;


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
        if (!firestore || !incomeColRef || !userDocRef) return;
        
        runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            const newAllowance = (userDoc.data().allowance || 0) + incomeItem.amount;
            transaction.update(userDocRef, { allowance: newAllowance });

            const newIncomeDocRef = doc(incomeColRef);
            transaction.set(newIncomeDocRef, incomeItem);
        }).catch(error => console.error("Add income transaction failed:", error));
    },
    [firestore, incomeColRef, userDocRef]
);

  const deleteIncomes = useCallback(
    (ids: string[]) => {
        if (!firestore || !incomeColRef || !userDocRef || !income) return;
        runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
             if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            const currentAllowance = userDoc.data().allowance || 0;
            let amountToReduce = 0;
            
            for (const id of ids) {
                const incomeToDelete = income.find(inc => inc.id === id);
                if (incomeToDelete) {
                    amountToReduce += incomeToDelete.amount;
                    const incomeDocRef = doc(incomeColRef, id);
                    transaction.delete(incomeDocRef);
                }
            }

            const newAllowance = currentAllowance - amountToReduce;
            transaction.update(userDocRef, { allowance: newAllowance });
        }).catch(error => console.error("Batch delete incomes transaction failed:", error));
    },
    [firestore, incomeColRef, userDocRef, income]
  );
  
  const setBudgets = useCallback((newBudgets: (Budget & {id?: string})[], balanceSnapshot: number) => {
    if (!firestore || !budgetsColRef || !userDocRef) return Promise.reject("Firestore not ready");
    
    // Check if this is ONLY a savings update.
    // This is true if there's only one budget item and its category is 'savings'.
    const isSavingsOnlyUpdate = newBudgets.length === 1 && newBudgets[0].categoryId === 'savings';

    const batch = writeBatch(firestore);

    newBudgets.forEach(b => {
      const docId = b.categoryId;
      const docRef = doc(budgetsColRef, docId);
      const dataToSet: Partial<Budget> & { id?: string, categoryId?: string } = { ...b };
      delete dataToSet.id;
      delete dataToSet.categoryId;
      batch.set(docRef, dataToSet, { merge: true });
    });

    if (!isSavingsOnlyUpdate) {
        batch.update(userDocRef, { balanceAtBudgetSet: balanceSnapshot });
    }
    
    return batch.commit();
  }, [firestore, budgetsColRef, userDocRef]);

  const resetBudgetPlan = useCallback(() => {
    if (!firestore || !budgetsColRef || !userDocRef) return Promise.reject("Firestore not ready");
    const batch = writeBatch(firestore);
    
    batch.update(userDocRef, { balanceAtBudgetSet: 0 });

    const spendCategoryIds = categories.filter(c => c.type !== 'savings').map(c => c.id);
    spendCategoryIds.forEach(catId => {
      const docRef = doc(budgetsColRef, catId);
      batch.set(docRef, { amount: 0, percentage: 0 }, { merge: true });
    });

    return batch.commit();
  }, [firestore, budgetsColRef, userDocRef, categories]);


  const addSinkingFund = useCallback((fund: Omit<SinkingFund, 'id' | 'currentAmount'>) => {
    if (!sinkingFundsColRef) return;
    addDocumentNonBlocking(sinkingFundsColRef, { ...fund, currentAmount: 0 });
  }, [sinkingFundsColRef]);

 const updateSinkingFund = useCallback(async (fund: SinkingFund) => {
    if (!firestore || !sinkingFundsColRef || !sinkingFunds || !userDocRef) return;

    const originalFund = sinkingFunds.find(f => f.id === fund.id);
    if (!originalFund) return;

    const difference = fund.currentAmount - originalFund.currentAmount;
    
    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw "User document does not exist!";
            
            const currentAllowance = userDoc.data().allowance;
            // The total allowance should not change when moving money between spendable and sinking funds.
            // The money is already in the budget.
            
            const fundDocRef = doc(sinkingFundsColRef, fund.id);
            transaction.set(fundDocRef, { 
              name: fund.name, 
              targetAmount: fund.targetAmount, 
              currentAmount: fund.currentAmount 
            });
        });
    } catch (error) {
        console.error("Sinking fund update transaction failed: ", error);
    }
}, [firestore, sinkingFundsColRef, sinkingFunds, userDocRef]);


  const deleteSinkingFund = useCallback(async (id: string) => {
    if (!sinkingFundsColRef) return;
    const fundDocRef = doc(sinkingFundsColRef, id);
    deleteDocumentNonBlocking(fundDocRef);
  }, [sinkingFundsColRef]);
  
  const allocateToSinkingFund = useCallback(async (id: string, amount: number) => {
      if (!firestore || !sinkingFundsColRef || !sinkingFunds || !userDocRef || amount <= 0) return;
      
      const fund = sinkingFunds.find(f => f.id === id);
      if (!fund) return;
      
      try {
        await runTransaction(firestore, async (transaction) => {
            const fundDocRef = doc(sinkingFundsColRef, id);
            const fundDoc = await transaction.get(fundDocRef);
            if (!fundDoc.exists()) {
                throw `Sinking fund with id ${id} does not exist!`;
            }
            
            const newCurrentAmount = (fundDoc.data().currentAmount || 0) + amount;
            transaction.update(fundDocRef, { currentAmount: newCurrentAmount });
        });
      } catch (error) {
        console.error("Allocating to sinking fund failed:", error);
      }
  }, [firestore, sinkingFundsColRef, sinkingFunds, userDocRef]);

  const spendFromSinkingFund = useCallback(async (sinkingFundId: string, categoryId: string) => {
    if (!firestore || !sinkingFundsColRef || !expensesColRef || !sinkingFunds) return;
    
    const fund = sinkingFunds.find(f => f.id === sinkingFundId);
    if (!fund || fund.currentAmount <= 0) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Create the new expense
            const newExpenseRef = doc(expensesColRef);
            transaction.set(newExpenseRef, {
                amount: fund.currentAmount,
                categoryId: categoryId,
                date: new Date().toISOString(),
                notes: `Purchase from sinking fund: ${fund.name}`,
            });

            // 2. Delete the sinking fund
            const fundDocRef = doc(sinkingFundsColRef, sinkingFundId);
            transaction.delete(fundDocRef);
        });
    } catch (error) {
        console.error("Spending from sinking fund failed:", error);
    }
}, [firestore, sinkingFundsColRef, expensesColRef, sinkingFunds]);


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
    resetBudgetPlan,
    budgetTarget,
    setBudgetTarget,
    sinkingFunds: sinkingFunds ?? [],
    addSinkingFund,
    updateSinkingFund,
    deleteSinkingFund,
    allocateToSinkingFund,
    spendFromSinkingFund,
    totalSpent,
    remainingBalance,
    balanceAtBudgetSet,
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

    