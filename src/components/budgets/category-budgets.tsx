
"use client";

import { useBudget } from "@/hooks/use-budget";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useState, useEffect, useMemo, useRef } from "react";
import type { Budget, CategoryType, Category } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Sparkles, Save } from "lucide-react";
import { getBudgetAllocation } from "@/ai/flows/budget-allocation-flow";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { MarkdownContent } from "../insights/markdown-content";
import { subDays, parseISO, format } from "date-fns";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

const typeVariant: Record<CategoryType, "default" | "secondary" | "outline"> = {
    need: 'default',
    want: 'secondary',
    savings: 'outline',
}

export function CategoryBudgets() {
  const { allowance, categories, budgets, getSpentForCategory, expenses, isLoading, remainingBalance, sinkingFunds, setBudgets } = useBudget();
  const [localPercentages, setLocalPercentages] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [userContext, setUserContext] = useState("");
  
  const { toast } = useToast();

  const spendCategories = useMemo(() => categories.filter(c => c.type !== 'savings'), [categories]);
  const savingsBudgetAmount = useMemo(() => budgets.find(b => b.categoryId === 'savings')?.amount ?? 0, [budgets]);
  
  useEffect(() => {
    if (budgets.length > 0) {
        const initialPercentages = budgets.reduce((acc, budget) => {
            if (budget.percentage) {
                acc[budget.categoryId] = budget.percentage;
            }
            return acc;
        }, {} as Record<string, number>);
        setLocalPercentages(initialPercentages);
    }
  }, [budgets]);


  const handlePercentageChange = (categoryId: string, percentageStr: string) => {
    const percentage = parseFloat(percentageStr);
    if (isNaN(percentage)) {
      setLocalPercentages(prev => ({ ...prev, [categoryId]: 0 }));
    } else {
      setLocalPercentages(prev => ({ ...prev, [categoryId]: Math.max(0, Math.min(100, percentage)) }));
    }
  };
  
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(c => c.id === id);
  }
  
  const handleSavePlan = async () => {
    if (totalAllocatedPercentage > 100) {
        toast({
            variant: "destructive",
            title: "Overallocated!",
            description: "Total allocated percentage cannot exceed 100%.",
        });
        return;
    }
    
    const newBudgets: Budget[] = spendCategories.map(category => {
        const percentage = localPercentages[category.id] || 0;
        const allocatedFromRemaining = (percentage / 100) * remainingBalance;
        const spent = getSpentForCategory(category.id);
        const totalBudgetForCategory = spent + allocatedFromRemaining;
        
        return {
            categoryId: category.id,
            amount: totalBudgetForCategory,
            percentage,
        }
    });

    try {
        await setBudgets(newBudgets);
        toast({
            title: "Budget Plan Saved!",
            description: "Your new category percentage allocations have been saved.",
        });
    } catch(error) {
        console.error("Failed to save budget plan", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save your budget plan.",
        });
    }
  };

  const handleGetBudgetAllocation = async () => {
    if (allowance <= 0) {
        toast({
            variant: "destructive",
            title: "Set Allowance First",
            description: "You need to set your total allowance before the AI can create a budget.",
        });
        return;
    }
    setIsGenerating(true);
    setSuggestion(null);
    try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentExpenses = expenses
            .filter(e => parseISO(e.date) >= thirtyDaysAgo)
            .map(e => {
                const category = getCategoryById(e.categoryId);
                return {
                    name: e.notes || 'Expense',
                    amount: e.amount,
                    date: format(parseISO(e.date), 'yyyy-MM-dd'),
                    categoryName: category?.name || 'Uncategorized'
                }
            });

        const categorySpending = spendCategories.map(c => ({
            name: c.name,
            type: c.type,
            spent: getSpentForCategory(c.id),
        }));
        
        const result = await getBudgetAllocation({
            allowance,
            remainingBalance,
            savingsAmount: savingsBudgetAmount,
            sinkingFunds: sinkingFunds || [],
            categorySpending,
            recentExpenses,
            userContext: userContext || undefined
        });

        setSuggestion(result.suggestion);

        toast({
            title: "AI Budget Generated!",
            description: "The AI has suggested a budget for you. Review and save it.",
        });

    } catch (error) {
        console.error("Failed to get budget allocation", error);
        toast({
            variant: "destructive",
            title: "AI Error",
            description: "Sorry, I couldn't generate a budget right now. Please try again.",
        });
    } finally {
        setIsGenerating(false);
    }
  };

  const totalAllocatedPercentage = useMemo(() => {
    return Object.values(localPercentages).reduce((total, p) => total + (p || 0), 0);
  }, [localPercentages]);

  const totalAllocatedAmount = useMemo(() => {
    return (totalAllocatedPercentage / 100) * remainingBalance;
  }, [totalAllocatedPercentage, remainingBalance]);

  if (isLoading) {
    return (
        <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted p-4 rounded-lg space-y-2">
                    <div className="h-5 w-1/4 bg-muted-foreground/20 rounded" />
                    <div className="h-8 w-full bg-muted-foreground/20 rounded" />
                    <div className="h-4 w-1/2 bg-muted-foreground/20 rounded" />
                </div>
            ))}
        </div>
    );
  }

  return (
    <>
      <Card className="mb-6">
          <CardHeader>
              <CardTitle>AI Budget Planner</CardTitle>
              <CardDescription>Let AI create a balanced budget for your remaining funds based on your spending and current context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                  <Label htmlFor="ai-context" className="text-sm font-medium">Additional Context (Optional)</Label>
                  <Textarea 
                      id="ai-context"
                      placeholder="e.g., 'It's my summer break, no school expenses' or 'I have a big project due, might need more for supplies.'"
                      value={userContext}
                      onChange={(e) => setUserContext(e.target.value)}
                      className="mt-1"
                  />
              </div>
              <Button onClick={handleGetBudgetAllocation} disabled={isGenerating || allowance <= 0} className="w-full">
                  {isGenerating ? "Generating Budget..." : (
                      <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {allowance > 0 ? "Generate AI Budget Plan" : "Set Allowance to Enable AI"}
                      </>
                  )}
              </Button>
              {isGenerating && (
                  <div className="space-y-2 pt-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                  </div>
              )}
              {suggestion && (
                  <div className="prose prose-sm dark:prose-invert rounded-lg border p-4 mt-4">
                    <MarkdownContent content={suggestion} />
                  </div>
              )}
          </CardContent>
      </Card>
      
      <div className="space-y-8 mt-6">
          <div className="p-4 bg-muted rounded-lg text-center sticky top-0 z-10">
              <p className="text-sm text-muted-foreground">Plan your budget from your remaining balance.</p>
              <p className="text-lg font-bold">{currencyFormatter.format(remainingBalance)}</p>
              <div className="flex justify-center items-baseline gap-2">
                <p className={`text-sm font-semibold ${totalAllocatedPercentage > 100 ? 'text-destructive' : 'text-primary'}`}>
                    {Math.round(totalAllocatedPercentage)}% Allocated
                </p>
                <p className="text-xs text-muted-foreground">
                    ({currencyFormatter.format(totalAllocatedAmount)})
                </p>
              </div>
          </div>
          {spendCategories.map(category => {
              const spent = getSpentForCategory(category.id);
              const percentage = localPercentages[category.id] ?? 0;
              const allocatedFromRemaining = (percentage / 100) * remainingBalance;
              const totalBudgetForCategory = spent + allocatedFromRemaining;
              const leftToSpend = totalBudgetForCategory - spent;
              const progress = totalBudgetForCategory > 0 ? (spent / totalBudgetForCategory) * 100 : 0;


              return (
                  <div key={category.id}>
                      <div className="flex items-center justify-between mb-2">
                          <Label htmlFor={`budget-percentage-${category.id}`} className="flex items-center gap-2 text-base">
                          <category.icon className="w-5 h-5 text-muted-foreground" />
                          {category.name}
                          </Label>
                          <Badge variant={typeVariant[category.type]} className="capitalize text-xs h-5">{category.type}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                          <Input
                              id={`budget-percentage-${category.id}`}
                              type="number"
                              placeholder="0"
                              value={localPercentages[category.id] || ''}
                              onChange={(e) => handlePercentageChange(category.id, e.target.value)}
                              className="w-24"
                          />
                          <span className="text-lg font-semibold">%</span>
                          <span className="text-sm text-muted-foreground">
                              = {currencyFormatter.format(allocatedFromRemaining)}
                          </span>
                      </div>
                      <div className="mt-2 space-y-1">
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{currencyFormatter.format(spent)} spent</span>
                            <span className="font-semibold text-foreground">{currencyFormatter.format(leftToSpend)} left</span>
                            <span>{currencyFormatter.format(totalBudgetForCategory)} total</span>
                          </div>
                      </div>
                  </div>
              )
          })}
           <Button onClick={handleSavePlan} className="w-full">
                <Save className="mr-2 h-4 w-4" /> Save Plan
            </Button>
      </div>
    </>
  );
}
