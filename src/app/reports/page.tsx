
"use client";

import { useState } from "react";
import { SpendingTrendChart } from "@/components/reports/spending-trend-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategorySpendingReport } from "@/components/reports/category-spending-report";
import { AllExpenses } from "@/components/reports/all-expenses";
import { AllIncome } from "@/components/reports/all-income";
import { ExpenseExporter } from "@/components/expense-exporter";

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>('daily');

  const descriptions = {
    daily: 'Your spending activity over the last 30 days.',
    weekly: 'Your spending activity over the last 12 weeks.',
    monthly: 'Your spending activity over the last 12 months.'
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Reports
        </h1>
        <div className="flex items-center space-x-2">
            <ExpenseExporter />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>{descriptions[period]}</CardDescription>
              </div>
              <Tabs value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)} className="mt-4 sm:mt-0">
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <SpendingTrendChart period={period} />
          </CardContent>
        </Card>
        <CategorySpendingReport />
        <AllExpenses />
        <AllIncome />
      </div>
    </div>
  );
}
