"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { History } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";
import { isPast, parseISO, format } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function DueExpenses() {
  const { recurringExpenses, logRecurringExpense, isLoading, getCategoryById } = useBudget();
  const { toast } = useToast();

  const dueExpenses = useMemo(() => {
    if (!recurringExpenses) return [];
    return recurringExpenses.filter(e => isPast(parseISO(e.nextDueDate)));
  }, [recurringExpenses]);

  const handleLogExpense = (recurringExpenseId: string) => {
    logRecurringExpense(recurringExpenseId);
    toast({
        title: "Expense Logged!",
        description: "The recurring expense has been recorded.",
    });
  }

  if (isLoading) {
      return <Skeleton className="h-48 w-full" />;
  }
  
  if (dueExpenses.length === 0) {
      return null; // Don't render the card if there are no due expenses
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <div>
                <CardTitle>Due Recurring Expenses</CardTitle>
                <CardDescription>Log your recurring payments that are due.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {dueExpenses.map(expense => {
            const category = getCategoryById(expense.categoryId);
            return (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                        <p className="font-semibold">{expense.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {currencyFormatter.format(expense.amount)} - Due: {format(parseISO(expense.nextDueDate), 'MMM d, yyyy')}
                        </p>
                         {category && <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <category.icon className="h-3 w-3" />
                            <span>{category.name}</span>
                         </div>}
                    </div>
                    <Button onClick={() => handleLogExpense(expense.id)}>Log Expense</Button>
                </div>
            )
        })}
      </CardContent>
    </Card>
  );
}
