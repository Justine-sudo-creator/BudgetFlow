
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBudget } from "@/hooks/use-budget";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";
import { parseISO, getMonth, getYear, getDate, setMonth, setYear, setDate, format } from "date-fns";
import { useMemo } from "react";

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().min(1, "Please select a category"),
  date: z.date(),
  notes: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

export function ExpenseForm({ expenseToEdit, afterSubmit }: { expenseToEdit?: Expense, afterSubmit?: () => void }) {
  const { categories, addExpense, updateExpense } = useBudget();
  const { toast } = useToast();

  const expenseCategories = categories.filter(c => c.type !== 'savings');

  const defaultValues = expenseToEdit ? {
    amount: expenseToEdit.amount,
    categoryId: expenseToEdit.categoryId,
    date: parseISO(expenseToEdit.date),
    notes: expenseToEdit.notes || "",
  } : {
    amount: 0,
    categoryId: "",
    date: new Date(),
    notes: "",
  }

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const range = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      range.push(i);
    }
    return range.sort((a, b) => b - a);
  }, []);

  const daysInMonth = useMemo(() => {
    const d = form.watch("date");
    const lastDay = new Date(getYear(d), getMonth(d) + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [form.watch("date")]);

  function onSubmit(values: ExpenseFormValues) {
    const expenseData = {
      amount: values.amount,
      categoryId: values.categoryId,
      notes: values.notes || "",
      date: values.date.toISOString(),
    };

    if (expenseToEdit) {
      updateExpense({ ...expenseData, id: expenseToEdit.id });
      toast({ title: "Expense updated", description: "Your expense has been successfully updated." });
    } else {
      addExpense(expenseData);
      toast({ title: "Expense added", description: "Your expense has been successfully logged." });
    }
    form.reset(defaultValues);
    afterSubmit?.();
  }

  const currentDate = form.watch("date");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Date</FormLabel>
          <div className="grid grid-cols-3 gap-2">
            <Select 
              value={getMonth(currentDate).toString()} 
              onValueChange={(val) => form.setValue("date", setMonth(currentDate, parseInt(val)))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={getDate(currentDate).toString()} 
              onValueChange={(val) => form.setValue("date", setDate(currentDate, parseInt(val)))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Day" />
              </SelectTrigger>
              <SelectContent>
                {daysInMonth.map((d) => (
                  <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={getYear(currentDate).toString()} 
              onValueChange={(val) => form.setValue("date", setYear(currentDate, parseInt(val)))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Selected: {format(currentDate, "MMMM d, yyyy")}
          </p>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional notes about the expense" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {expenseToEdit ? 'Save Changes' : 'Add Expense'}
        </Button>
      </form>
    </Form>
  );
}
