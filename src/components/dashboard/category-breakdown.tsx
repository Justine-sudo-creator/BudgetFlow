"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { useBudget } from "@/hooks/use-budget";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function CategoryBreakdown() {
  const { categories, getSpentForCategory, totalSpent, isLoading } = useBudget();

  const chartData = React.useMemo(() => {
    return categories
      .filter(c => c.type !== 'savings') // Exclude savings from spending breakdown
      .map((cat) => ({
        category: cat.name,
        value: getSpentForCategory(cat.id),
        fill: cat.color,
        type: cat.type,
      }))
      .filter((item) => item.value > 0);
  }, [categories, getSpentForCategory]);

  const totalNeeds = chartData
    .filter((d) => d.type === "need")
    .reduce((acc, cur) => acc + cur.value, 0);
  const totalWants = chartData
    .filter((d) => d.type === "want")
    .reduce((acc, cur) => acc + cur.value, 0);

  if (isLoading) {
    return (
        <Card className="lg:col-span-4 md:col-span-2">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                 <Skeleton className="h-48 w-48 rounded-full" />
                 <div className="w-full mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                 </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="lg:col-span-4 md:col-span-2">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
        <CardDescription>
          Spending distribution across needs and wants.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {chartData.length > 0 ? (
          <>
            <ChartContainer
              config={{}}
              className="mx-auto aspect-square h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value, name) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground">{currencyFormatter.format(value as number)}</span>
                    </div>
                  )} />}
                />
                <Pie data={chartData} dataKey="value" nameKey="category" innerRadius={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="w-full text-sm mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Needs vs. Wants</h3>
                <div className="flex items-center justify-between">
                  <span>Needs</span>
                  <span className="font-medium">{currencyFormatter.format(totalNeeds)}</span>
                </div>
                 <div className="flex items-center justify-between">
                  <span>Wants</span>
                  <span className="font-medium">{currencyFormatter.format(totalWants)}</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Top Categories</h3>
                <ul className="space-y-1">
                  {chartData
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 3)
                    .map((item) => (
                      <li key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full" style={{backgroundColor: item.fill}}/>
                           <span>{item.category}</span>
                        </div>
                        <span className="font-mono text-xs">{currencyFormatter.format(item.value)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-[350px] text-center">
            <p className="text-muted-foreground">No expenses logged yet.</p>
            <p className="text-sm text-muted-foreground">
              Add your first expense to see your spending breakdown.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
