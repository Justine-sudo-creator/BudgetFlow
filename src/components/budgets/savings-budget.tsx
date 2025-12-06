
"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import type { Budget } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function SavingsBudget() {
  const { budgets, setBudgets, isLoading, remainingBalance } = useBudget();
  const [savingsAmount, setSavingsAmount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const savingsBudget = budgets.find(b => b.categoryId === 'savings');
  const otherBudgets = budgets.filter(b => b.categoryId !== 'savings');

  useEffect(() => {
    if (savingsBudget) {
      setSavingsAmount(savingsBudget.amount);
    } else {
      setSavingsAmount(0);
    }
  }, [savingsBudget]);

  const handleSaveSavings = async () => {
    setIsSaving(true);

    const newBudgets: Budget[] = [...otherBudgets, { categoryId: 'savings', amount: savingsAmount }];

    try {
      await setBudgets(newBudgets, 0);
      toast({ title: "Savings Updated", description: "Your savings allocation has been saved." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your savings budget." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const spendableWithoutSavings = remainingBalance + (savingsBudget?.amount ?? 0);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Savings</CardTitle>
        <CardDescription>
          Allocate a portion of your total budget to savings. This amount will
          be set aside and not included in your spendable balance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="savings-amount">Savings Amount</Label>
          <Input
            id="savings-amount"
            type="number"
            value={savingsAmount}
            onChange={(e) => setSavingsAmount(Number(e.target.value))}
            placeholder="0.00"
          />
        </div>
        <p className="text-xs text-muted-foreground">
            Current Spendable Balance: {currencyFormatter.format(spendableWithoutSavings)}
        </p>
        <p className="text-xs text-muted-foreground">
            Remaining for planning after savings: {currencyFormatter.format(remainingBalance)}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSavings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Savings"}
        </Button>
      </CardFooter>
    </Card>
  );
}
