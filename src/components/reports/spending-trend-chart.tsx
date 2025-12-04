
"use client";

import { useMemo } from "react";
import { format, subDays, eachDayOfInterval, parseISO, subWeeks, eachWeekOfInterval, startOfWeek, endOfWeek, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { useBudget } from "@/hooks/use-budget";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Skeleton } from "../ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PHP",
});

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type SpendingTrendChartProps = {
    period: 'daily' | 'weekly' | 'monthly';
};

export function SpendingTrendChart({ period }: SpendingTrendChartProps) {
  const { expenses, isLoading } = useBudget();

  const chartData = useMemo(() => {
    const endDate = new Date();
    
    if (period === 'daily') {
        const startDate = subDays(endDate, 29);
        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
        return dateRange.map((date) => {
          const dateString = format(date, "yyyy-MM-dd");
          const total = expenses
            .filter((e) => format(parseISO(e.date), "yyyy-MM-dd") === dateString)
            .reduce((sum, e) => sum + e.amount, 0);

          return {
            date: format(date, "MMM d"),
            expenses: total,
          };
        });
    }

    if (period === 'weekly') {
        const startDate = subWeeks(endDate, 11);
        const weekRange = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
        return weekRange.map((week) => {
            const weekStart = startOfWeek(week, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
            const total = expenses
                .filter(e => {
                    const expenseDate = parseISO(e.date);
                    return expenseDate >= weekStart && expenseDate <= weekEnd;
                })
                .reduce((sum, e) => sum + e.amount, 0);

            return {
                date: `W/ ${format(weekStart, "MMM d")}`,
                expenses: total,
            };
        });
    }

    if (period === 'monthly') {
        const startDate = subMonths(endDate, 11);
        const monthRange = eachMonthOfInterval({ start: startDate, end: endDate });
        return monthRange.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const total = expenses
                .filter(e => {
                    const expenseDate = parseISO(e.date);
                    return expenseDate >= monthStart && expenseDate <= monthEnd;
                })
                .reduce((sum, e) => sum + e.amount, 0);
            
            return {
                date: format(monthStart, "MMM"),
                expenses: total
            };
        });
    }

    return [];

  }, [expenses, period]);

  const hasData = useMemo(() => chartData.some(d => d.expenses > 0), [chartData]);
  
  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  return (
    <div className="h-[350px] w-full">
        {hasData ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={chartData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => period === 'daily' ? value.slice(0, 3) : value}
                    />
                    <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => currencyFormatter.format(value as number)}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent formatter={(value) => currencyFormatter.format(value as number)} />}
                    />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
                </BarChart>
            </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground">Not enough data for this report period.</p>
            <p className="text-sm text-muted-foreground">
              Log some expenses to see your spending trend.
            </p>
          </div>
        )}
    </div>
  );
}
