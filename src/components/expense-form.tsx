
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useBudget } from "@/hooks/use-budget";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
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
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
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
