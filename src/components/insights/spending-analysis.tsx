"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { 
  parseISO, 
  isWithinInterval,
  startOfDay, 
  endOfDay,
  startOfISOWeek, 
  endOfISOWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
} from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
});

export function SpendingAnalysis() {
  const { budgetTarget, expenses, isLoading } = useBudget();
  
  const { period, targetAmount, spentInPeriod, accumulatedFunds, status } = (() => {
      if (isLoading || budgetTarget.amount <= 0) {
        return { period: 'N/A', targetAmount: 0, spentInPeriod: 0, accumulatedFunds: 0, status: 'ontrack' as const };
      }

      const now = new Date();
      let spentInPeriod = 0;
      let accumulatedFunds = 0;
      
      const firstExpenseDate = expenses.length > 0 
        ? expenses.reduce((earliest, e) => {
            const eDate = parseISO(e.date);
            return eDate < earliest ? eDate : earliest;
          }, new Date())
        : now;

      switch(budgetTarget.period) {
          case 'daily': {
              const daysPassed = differenceInDays(now, firstExpenseDate) + 1;
              const totalBudget = budgetTarget.amount * daysPassed;
              const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
              accumulatedFunds = totalBudget - totalSpent;
              
              spentInPeriod = expenses
                  .filter(e => isWithinInterval(parseISO(e.date), { start: startOfDay(now), end: endOfDay(now) }))
                  .reduce((sum, e) => sum + e.amount, 0);
              break;
          }
          case 'weekly': {
              const weeksPassed = differenceInWeeks(now, firstExpenseDate, { weekStartsOn: 1 }) + 1;
              const totalBudget = budgetTarget.amount * weeksPassed;
              const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
              accumulatedFunds = totalBudget - totalSpent;

              spentInPeriod = expenses
                  .filter(e => isWithinInterval(parseISO(e.date), { start: startOfISOWeek(now), end: endOfISOWeek(now) }))
                  .reduce((sum, e) => sum + e.amount, 0);
              break;
          }
          case 'monthly': {
              const monthsPassed = differenceInMonths(now, firstExpenseDate) + 1;
              const totalBudget = budgetTarget.amount * monthsPassed;
              const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
              accumulatedFunds = totalBudget - totalSpent;

              spentInPeriod = expenses
                  .filter(e => isWithinInterval(parseISO(e.date), { start: startOfMonth(now), end: endOfMonth(now) }))
                  .reduce((sum, e) => sum + e.amount, 0);
              break;
          }
      }

      let status: 'overspend' | 'underspend' | 'ontrack' = 'ontrack';
      const accumulatedThreshold = budgetTarget.amount * 0.01; // 1% of target as buffer
      if (accumulatedFunds < -accumulatedThreshold) {
          status = 'overspend';
      } else if (accumulatedFunds > accumulatedThreshold) {
          status = 'underspend';
      }
      
      return { 
          period: budgetTarget.period, 
          targetAmount: budgetTarget.amount,
          spentInPeriod, 
          accumulatedFunds,
          status,
        };
  })();


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (budgetTarget.amount <= 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending Analysis</CardTitle>
                <CardDescription>Track your spending against your targets.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Set a budget target in Settings to enable this view.</p>
            </CardContent>
        </Card>
    );
  }

  const statusInfo = {
      overspend: { text: "Overspending", color: "bg-red-500/20 text-red-700 dark:text-red-400", icon: ArrowUp },
      underspend: { text: "Underspending", color: "bg-green-500/20 text-green-700 dark:text-green-400", icon: ArrowDown },
      ontrack: { text: "On Track", color: "bg-blue-500/20 text-blue-700 dark:text-blue-400", icon: Minus },
  }

  const { text, color, icon: StatusIcon } = statusInfo[status];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Analysis</CardTitle>
        <CardDescription>Your performance against your {period} budget.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-4 rounded-lg bg-muted">
            <div>
                <p className="text-sm text-muted-foreground">Accumulated Funds</p>
                <p className={`text-2xl font-bold ${accumulatedFunds < 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {currencyFormatter.format(accumulatedFunds)}
                </p>
            </div>
             <Badge className={`flex gap-2 items-center text-sm ${color}`}>
                <StatusIcon className="h-4 w-4" />
                {text}
            </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
            <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="text-lg font-medium">{currencyFormatter.format(targetAmount)} / {period}</p>
            </div>
             <div>
                <p className="text-sm text-muted-foreground capitalize">Spent (this {period})</p>
                <p className="text-lg font-medium">{currencyFormatter.format(spentInPeriod)}</p>
            </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
            {status === 'overspend' && 'You are spending more than your target. Consider reviewing your expenses.'}
            {status === 'underspend' && 'Great job! You are spending less than your target. You have extra funds you can save or re-allocate.'}
            {status === 'ontrack' && 'You are right on track with your budget. Keep it up!'}
        </p>

      </CardContent>
    </Card>
  );
}
