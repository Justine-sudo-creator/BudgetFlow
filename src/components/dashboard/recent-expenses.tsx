"use client";

import { useBudget } from "@/hooks/use-budget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { AddExpenseButton } from "../add-expense-button";
import { Button } from "../ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function RecentExpenses() {
  const { expenses, getCategoryById, deleteExpense, isLoading } = useBudget();

  const recentExpenses = expenses
    .slice()
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
        <Card className="lg:col-span-3 md:col-span-2">
             <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="lg:col-span-3 md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>
          Your 5 most recent transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentExpenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentExpenses.map((expense) => {
                const category = getCategoryById(expense.categoryId);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {category && <category.icon className="h-4 w-4 text-muted-foreground" />}
                        <div>
                          <div className="font-medium">
                            {category?.name || "Uncategorized"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(parseISO(expense.date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {currencyFormatter.format(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <AddExpenseButton expenseToEdit={expense} isMenuItem />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => deleteExpense(expense.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
           <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-muted-foreground">No expenses yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}