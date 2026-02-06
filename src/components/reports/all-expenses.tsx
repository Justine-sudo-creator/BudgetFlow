"use client";

import { useBudget } from "@/hooks/use-budget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { MoreHorizontal, Trash2, ArrowUpDown, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import React, { useState, useMemo } from "react";
import { Checkbox } from "../ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "../ui/scroll-area";


const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

type SortKey = 'date' | 'amount';
const defaultSortConfig = { key: 'date', direction: 'descending' } as const;

export function AllExpenses() {
  const { expenses, getCategoryById, deleteExpense, deleteExpenses, isLoading } = useBudget();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>(defaultSortConfig);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
        if (sortConfig.key === 'date') {
            const dateA = parseISO(a.date).getTime();
            const dateB = parseISO(b.date).getTime();
            return sortConfig.direction === 'ascending' ? dateA - dateB : dateB - dateA;
        } else { // amount
            return sortConfig.direction === 'ascending' ? a.amount - b.amount : b.amount - a.amount;
        }
    });
  }, [expenses, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const resetSort = () => {
    setSortConfig(defaultSortConfig);
  }

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3" />;
    if (sortConfig.direction === 'ascending') return <span className="ml-2">▲</span>;
    return <span className="ml-2">▼</span>;
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedRows(new Set(sortedExpenses.map(e => e.id)));
    } else {
        setSelectedRows(new Set());
    }
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
        newSelectedRows.add(id);
    } else {
        newSelectedRows.delete(id);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleDeleteSelected = () => {
    deleteExpenses(Array.from(selectedRows));
    toast({
      title: `${selectedRows.size} expenses deleted.`,
    });
    setSelectedRows(new Set());
  };

  const isSorted = useMemo(() => {
    return sortConfig.key !== defaultSortConfig.key || sortConfig.direction !== defaultSortConfig.direction;
  }, [sortConfig]);


  if (isLoading) {
    return (
        <Card className="md:col-span-2 lg:col-span-1">
             <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="md:col-span-2 lg:col-span-1">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>
            A complete log of all your recorded expenses.
          </CardDescription>
        </div>
        {isSorted && (
          <Button variant="ghost" size="sm" onClick={resetSort} aria-label="Reset sort">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sortedExpenses.length > 0 ? (
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                    <Checkbox
                        checked={selectedRows.size === sortedExpenses.length && sortedExpenses.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                    />
                </TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('date')} className="px-2">
                        Date {getSortIndicator('date')}
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => requestSort('amount')} className="px-2">
                        Amount {getSortIndicator('amount')}
                    </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense) => {
                const category = getCategoryById(expense.categoryId);
                return (
                  <TableRow key={expense.id} data-state={selectedRows.has(expense.id) && "selected"}>
                     <TableCell>
                        <Checkbox
                            checked={selectedRows.has(expense.id)}
                            onCheckedChange={(checked) => handleRowSelect(expense.id, !!checked)}
                            aria-label="Select row"
                        />
                     </TableCell>
                     <TableCell>
                      <div className="font-medium">
                        {expense.notes || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                        {category && 
                            <div className="flex items-center gap-2">
                                <category.icon className="h-4 w-4 text-muted-foreground" />
                                {category.name}
                            </div>
                        }
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(expense.date), "MMM d, yyyy")}
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
        </ScrollArea>
        ) : (
           <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-muted-foreground">No expenses yet.</p>
          </div>
        )}
      </CardContent>
      {selectedRows.size > 0 && (
         <CardFooter className="border-t pt-6 justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedRows.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete {selectedRows.size} selected expenses.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
         </CardFooter>
      )}
    </Card>
  );
}