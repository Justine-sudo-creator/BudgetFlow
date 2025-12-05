"use client";

import { CategoryBudgets } from "@/components/budgets/category-budgets";
import { SavingsBudget } from "@/components/budgets/savings-budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddExpenseButton } from "@/components/add-expense-button";

export default function BudgetsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Budgets
        </h1>
        <div className="flex items-center space-x-2">
          <AddExpenseButton />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <CardTitle>Category Budgets</CardTitle>
            </CardHeader>
            <CardContent>
                <CategoryBudgets />
            </CardContent>
            </Card>
        </div>
        <div>
            <SavingsBudget />
        </div>
      </div>
    </div>
  );
}
