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
import { useBudget } from "@/hooks/use-budget";
import { useToast } from "@/hooks/use-toast";
import { getMonth, getYear, getDate, setMonth, setYear, setDate, format } from "date-fns";
import { useMemo } from "react";

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  source: z.string().min(1, "Please enter a source"),
  date: z.date(),
});

type IncomeFormValues = z.infer<typeof formSchema>;

export function IncomeForm({ afterSubmit }: { afterSubmit?: () => void }) {
  const { addIncome } = useBudget();
  const { toast } = useToast();

  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      source: "",
      date: new Date(),
    },
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

  function onSubmit(values: IncomeFormValues) {
    addIncome({
      ...values,
      date: values.date.toISOString(),
    });
    toast({ title: "Income added", description: "Your allowance has been updated." });
    form.reset();
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
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Paycheck, Gift" {...field} />
              </FormControl>
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

        <Button type="submit" className="w-full">
          Add Income
        </Button>
      </form>
    </Form>
  );
}