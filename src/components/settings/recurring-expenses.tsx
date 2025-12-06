"use client";

import { useState } from "react";
import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, Trash2, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import type { RecurringExpense } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";


const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function RecurringExpenseForm({ onSave }: { onSave: () => void }) {
  const { addRecurringExpense, categories } = useBudget();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>(new Date());
  
  const expenseCategories = categories.filter(c => c.type !== 'savings');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || amount <= 0 || !categoryId || !nextDueDate) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all required fields." });
      return;
    }
    
    addRecurringExpense({
      name,
      amount,
      categoryId,
      period,
      nextDueDate: nextDueDate.toISOString(),
    });
    
    toast({ title: "Recurring Expense Added" });
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rec-name">Name</Label>
        <Input id="rec-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Netflix Subscription" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rec-amount">Amount</Label>
        <Input id="rec-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rec-category">Category</Label>
        <Select onValueChange={setCategoryId} value={categoryId}>
          <SelectTrigger id="rec-category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <category.icon className="w-4 h-4" />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Frequency</Label>
        <RadioGroup value={period} onValueChange={(v: any) => setPeriod(v)} className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="daily" id="rec-daily" />
            <Label htmlFor="rec-daily">Daily</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weekly" id="rec-weekly" />
            <Label htmlFor="rec-weekly">Weekly</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="monthly" id="rec-monthly" />
            <Label htmlFor="rec-monthly">Monthly</Label>
          </div>
        </RadioGroup>
      </div>
       <div className="space-y-2">
        <Label>Next Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn("w-full justify-start text-left font-normal", !nextDueDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {nextDueDate ? format(nextDueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={nextDueDate}
              onSelect={setNextDueDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save Expense</Button>
      </DialogFooter>
    </form>
  );
}


export function RecurringExpenses() {
  const { recurringExpenses, deleteRecurringExpense, isLoading } = useBudget();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </CardContent>
         <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Expenses</CardTitle>
        <CardDescription>
          Manage your recurring bills and subscriptions. These will appear on your dashboard when they are due.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recurringExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recurring expenses yet. Add one to get started.
          </p>
        ) : (
          recurringExpenses.map((expense: RecurringExpense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">{expense.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currencyFormatter.format(expense.amount)} every {expense.period.replace('ly', '')}
                </p>
                <p className="text-xs text-muted-foreground">
                    Next due: {format(parseISO(expense.nextDueDate), 'MMM d, yyyy')}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteRecurringExpense(expense.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Recurring Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recurring Expense</DialogTitle>
              <DialogDescription>
                Define a new recurring expense to track.
              </DialogDescription>
            </DialogHeader>
            <RecurringExpenseForm onSave={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
