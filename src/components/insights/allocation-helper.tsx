"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useState } from "react";
import { getSuggestion } from "@/ai/flows/suggestion-flow";
import { Skeleton } from "../ui/skeleton";
import { Lightbulb, Sparkles } from "lucide-react";
import { MarkdownContent } from "./markdown-content";
import { 
  parseISO,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
} from "date-fns";


export function AllocationHelper() {
  const { budgetTarget, expenses, categories, getSpentForCategory, isLoading: budgetIsLoading } = useBudget();
  const [suggestion, setSuggestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const accumulatedFunds = (() => {
    if (budgetIsLoading || budgetTarget.amount <= 0 || expenses.length === 0) {
      return 0;
    }
    const now = new Date();
    const firstExpenseDate = expenses.reduce((earliest, e) => {
        const eDate = parseISO(e.date);
        return eDate < earliest ? eDate : earliest;
    }, new Date());
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    let totalBudget = 0;
    switch(budgetTarget.period) {
        case 'daily':
            const daysPassed = differenceInDays(now, firstExpenseDate) + 1;
            totalBudget = budgetTarget.amount * daysPassed;
            break;
        case 'weekly':
            const weeksPassed = differenceInWeeks(now, firstExpenseDate, { weekStartsOn: 1 }) + 1;
            totalBudget = budgetTarget.amount * weeksPassed;
            break;
        case 'monthly':
            const monthsPassed = differenceInMonths(now, firstExpenseDate) + 1;
            totalBudget = budgetTarget.amount * monthsPassed;
            break;
    }
    return totalBudget - totalSpent;
  })();

  const handleGetSuggestion = async () => {
    setIsGenerating(true);
    setSuggestion("");
    try {
      const categorySpending = categories.map(cat => ({
        name: cat.name,
        spent: getSpentForCategory(cat.id)
      }));

      const result = await getSuggestion({
        accumulatedFunds,
        categorySpending
      });
      setSuggestion(result.suggestion);
    } catch (error) {
      console.error("Failed to get suggestion", error);
      setSuggestion("Sorry, I couldn't generate a suggestion right now. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (budgetIsLoading) {
      return (
          <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-20 w-full" />
              </CardContent>
          </Card>
      );
  }

  if (accumulatedFunds <= 0) {
      return (
          <Card>
            <CardHeader>
                <CardTitle>AI Allocation Helper</CardTitle>
                <CardDescription>Get smart suggestions for your extra cash.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground p-8">
                    <Lightbulb className="mx-auto h-12 w-12 mb-4" />
                    <p>Once you have accumulated some extra funds from underspending, the AI helper can give you suggestions on where to allocate them.</p>
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>AI Allocation Helper</CardTitle>
            <CardDescription>Get smart suggestions for your extra cash.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button onClick={handleGetSuggestion} disabled={isGenerating} className="w-full">
                {isGenerating ? "Generating..." : (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Suggest Allocation
                    </>
                )}
            </Button>

            {isGenerating && (
                <div className="space-y-2 pt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-3/4" />
                </div>
            )}

            {suggestion && (
                <div className="prose prose-sm dark:prose-invert rounded-lg border p-4 mt-4">
                   <MarkdownContent content={suggestion} />
                </div>
            )}
        </CardContent>
    </Card>
  );
}
