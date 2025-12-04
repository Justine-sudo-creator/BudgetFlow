"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, Hourglass, Loader, Target, PiggyBank, Receipt } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function SummaryCards() {
  const {
    allowance,
    totalSpent,
    remainingBalance,
    survivalDays,
    dailyAverage,
    budgetTarget,
    isLoading
  } = useBudget();

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
            <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="animate-pulse bg-muted rounded-md w-2/3 h-6" />
                    <Loader className="h-4 w-4 text-muted-foreground animate-spin" />
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse bg-muted rounded-md w-1/2 h-8 mb-2" />
                    <div className="animate-pulse bg-muted rounded-md w-1/3 h-4" />
                </CardContent>
            </Card>
        ))}
    </div>;
  }

  const getSurvivalDescription = () => {
    if (budgetTarget && budgetTarget.amount > 0) {
      return `Based on your ${budgetTarget.period} target`;
    }
    return "Based on your average daily spend";
  };


  const summaryData = [
    {
      title: "Remaining",
      icon: Wallet,
      value: currencyFormatter.format(remainingBalance),
      description: `${allowance > 0 ? ((remainingBalance / allowance) * 100).toFixed(0) : 0}% of budget left`,
    },
    {
      title: "Spent so far",
      icon: Receipt,
      value: currencyFormatter.format(totalSpent),
      description: `Avg. ${currencyFormatter.format(dailyAverage)}/day`,
    },
    {
      title: "Total Budget",
      icon: PiggyBank,
      value: currencyFormatter.format(allowance),
      description: "Your total income/allowance",
    },
    {
      title: "Runway",
      icon: Hourglass,
      value: `${isFinite(survivalDays) ? Math.floor(survivalDays) : '∞'} days`,
      description: getSurvivalDescription(),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryData.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
