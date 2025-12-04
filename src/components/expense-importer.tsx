"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useBudget } from "@/hooks/use-budget";
import { processPastedExpenses } from "@/ai/flows/expense-parser-flow";
import { Import } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Skeleton } from "./ui/skeleton";
import { format, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

type ParsedExpense = {
    name: string;
    date: string;
    amount: number;
    category: string;
}

export function ExpenseImporter() {
  const [open, setOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const { toast } = useToast();
  const { categories, addExpenses } = useBudget();

  const handleProcessText = async () => {
    if (!pastedText.trim()) {
      toast({
        variant: "destructive",
        title: "No data provided",
        description: "Please paste your expense data into the text box.",
      });
      return;
    }

    setIsProcessing(true);
    setParsedExpenses([]);
    try {
        const expenseCategories = categories.filter(c => c.type !== 'savings').map(c => ({ id: c.id, name: c.name }));
        const result = await processPastedExpenses(pastedText, expenseCategories);
        
        if (result.items.length === 0) {
            toast({
                title: "No Expenses Found",
                description: "The AI couldn't find any valid expense data in the text you provided.",
            });
        } else {
            setParsedExpenses(result.items);
        }

    } catch (error) {
      console.error("Failed to process expenses:", error);
      toast({
        variant: "destructive",
        title: "AI Processing Error",
        description: "Something went wrong while trying to parse your expenses. Please check the format and try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddExpenses = () => {
    if (parsedExpenses.length === 0) return;

    const expensesToAdd = parsedExpenses.map(exp => {
        // Handle YYYY-MM-DD to prevent timezone shift
        const dateString = exp.date.split('T')[0];
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        return {
            amount: exp.amount,
            categoryId: exp.category, // Use the parsed category ID
            date: date.toISOString(),
            notes: `Imported: ${exp.name}`
        }
    });

    addExpenses(expensesToAdd);

    toast({
        title: "Expenses Imported!",
        description: `${parsedExpenses.length} expenses have been successfully added.`,
    });
    
    // Reset state and close dialog
    setParsedExpenses([]);
    setPastedText("");
    setOpen(false);
  };

  const resetState = () => {
    setPastedText("");
    setParsedExpenses([]);
    setIsProcessing(false);
    if (!open) {
        setOpen(true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setPastedText("");
            setParsedExpenses([]);
            setIsProcessing(false);
        }
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Import className="mr-2 h-4 w-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Expenses</DialogTitle>
          <DialogDescription>
            Paste your expenses from a CSV file (name,date,amount,category). The AI will parse them for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
                <h3 className="font-semibold">1. Paste Your Data</h3>
                <Textarea
                    placeholder="e.g., Lunch,2024-07-29,150,Food & Groceries..."
                    className="h-64"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    disabled={isProcessing}
                />
                 <Button onClick={handleProcessText} disabled={isProcessing || !pastedText.trim()} className="w-full">
                    {isProcessing ? "Processing..." : "Parse Expenses"}
                </Button>
            </div>
            <div className="space-y-2">
                 <h3 className="font-semibold">2. Review and Confirm</h3>
                 <div className="border rounded-lg h-72 overflow-y-auto">
                    {isProcessing ? (
                         <div className="p-4 space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                         </div>
                    ) : parsedExpenses.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Expense</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {parsedExpenses.map((exp, index) => {
                                    const category = categories.find(c => c.id === exp.category);
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="font-medium">{exp.name}</div>
                                                <div className="text-xs text-muted-foreground">{format(parseISO(exp.date), 'MM/dd/yyyy')}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-xs">
                                                    {category && <category.icon className="h-3 w-3" />}
                                                    {category?.name ?? 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{currencyFormatter.format(exp.amount)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground p-4">
                            <p>Parsed expenses will appear here for your review.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddExpenses} disabled={isProcessing || parsedExpenses.length === 0}>
            Add {parsedExpenses.length > 0 ? parsedExpenses.length : ""} Expenses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
