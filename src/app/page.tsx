"use client";

import { AddExpenseButton } from "@/components/add-expense-button";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { useBudget } from "@/hooks/use-budget";
import { AllowanceSetter } from "@/components/dashboard/allowance-setter";
import { ExpenseImporter } from "@/components/expense-importer";


export default function DashboardPage() {
  const { allowance } = useBudget();

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <ExpenseImporter />
          <AddExpenseButton />
        </div>
      </div>
      {allowance > 0 ? (
        <>
          <SummaryCards />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <CategoryBreakdown />
            <RecentExpenses />
          </div>
        </>
      ) : (
        <AllowanceSetter />
      )}
    </div>
  );
}
