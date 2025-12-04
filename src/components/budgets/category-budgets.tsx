
"use client";

import { useBudget } from "@/hooks/use-budget";
import { Input } from "../ui/input";
import { Progress } from "../ui/progress";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useState, useEffect, useMemo } from "react";
import type { Budget, CategoryType, Category } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Sparkles } from "lucide-react";
import { getBudgetAllocation } from "@/ai/flows/budget-allocation-flow";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { MarkdownContent } from "../insights/markdown-content";
import { subDays, parseISO, format } from "date-fns";
import { Textarea } from "../ui/textarea";

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
  const { allowance, categories, budgets, setBudgets, getSpentForCategory, getCategoryById, expenses, isLoading, remainingBalance } = useBudget();
  const [localBudgets, setLocalBudgets] = useState<Record<string, string>>({});
  const [localPercentages, setLocalPercentages] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [userContext, setUserContext] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("amount");
  const { toast } = useToast();

  useEffect(() => {
    if (isLoading) return;

    const initialBudgets: Record<string, string> = {};
    const initialPercentages: Record<string, string> = {};
    
    categories.forEach(category => {
        const budget = budgets.find(b => b.categoryId === category.id);
        const spent = getSpentForCategory(category.id);
        const budgetAmount = budget?.amount ?? 0;
        
        initialBudgets[category.id] = String(budgetAmount.toFixed(2));

        if (remainingBalance > 0) {
            const currentBudgetedAmount = budget?.amount ?? 0;
            const portionOfRemaining = Math.max(0, currentBudgetedAmount - spent);
            const percentage = (portionOfRemaining / remainingBalance) * 100;
             initialPercentages[category.id] = percentage > 0 ? percentage.toFixed(0) : '0';
        } else {
            initialPercentages[category.id] = '0';
        }
    });

    const totalInitialPercentage = Object.values(initialPercentages).reduce((sum, val) => sum + parseFloat(val || '0'), 0);
    if (totalInitialPercentage > 0 && totalInitialPercentage !== 100) {
        const factor = 100 / totalInitialPercentage;
        Object.keys(initialPercentages).forEach(key => {
            initialPercentages[key] = (parseFloat(initialPercentages[key] || '0') * factor).toFixed(0);
        });
        let finalTotal = Object.values(initialPercentages).reduce((sum, val) => sum + parseFloat(val || '0'), 0);
        if (finalTotal !== 100) {
             const diff = 100 - finalTotal;
             if (Object.keys(initialPercentages).length > 0) {
                const largestKey = Object.keys(initialPercentages).reduce((a, b) => parseFloat(initialPercentages[a] || '0') > parseFloat(initialPercentages[b] || '0') ? a : b);
                initialPercentages[largestKey] = (parseFloat(initialPercentages[largestKey] || '0') + diff).toFixed(0);
             }
        }
    }


    setLocalBudgets(initialBudgets);
    setLocalPercentages(initialPercentages);
    setIsDirty(false);
  }, [budgets, allowance, categories, getSpentForCategory, isLoading, remainingBalance]);


  const totalPercentage = useMemo(() => {
      return Object.values(localPercentages).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  }, [localPercentages]);
  
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

  const handleAmountBudgetChange = (categoryId: string, value: string) => {
    setLocalBudgets(prev => ({...prev, [categoryId]: value}));
    setIsDirty(true);
  };
  
  const handlePercentageBudgetChange = (categoryId: string, value: string) => {
    setLocalPercentages(prev => ({...prev, [categoryId]: value}));
    setIsDirty(true);
  };

  const handleSaveBudgets = () => {
    let newBudgets: Budget[];

    if (activeTab === 'percentage') {
        if (totalPercentage !== 100) {
            toast({ variant: "destructive", title: "Allocation must be 100%", description: "Please ensure your budget percentages add up to exactly 100." });
            return;
        }
        newBudgets = categories.map(category => {
            const percentage = parseFloat(localPercentages[category.id]) || 0;
            const alreadySpent = getSpentForCategory(category.id);
            const newAllocation = (remainingBalance * percentage) / 100;
            return {
                categoryId: category.id,
                amount: alreadySpent + newAllocation
            };
        });
    } else {
        newBudgets = Object.entries(localBudgets)
        .map(([categoryId, amountStr]) => ({
            categoryId,
            amount: parseFloat(amountStr) || 0,
        }));
    }

    setBudgets(newBudgets.filter(b => b.amount >= 0));
    setIsDirty(false);
    toast({ title: "Budgets Saved", description: "Your category budgets have been updated." });
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

        const categorySpending = categories.map(c => ({
            name: c.name,
            type: c.type,
            spent: getSpentForCategory(c.id),
        }));
        
        const result = await getBudgetAllocation({
            allowance,
            remainingBalance,
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

  const isSaveDisabled = () => {
    if (!isDirty) return true;
    if (activeTab === 'percentage' && totalPercentage !== 100) return true;
    return false;
  }

  return (
    <>
      <Card className="mb-6">
          <CardHeader>
              <CardTitle>AI Budget Planner</CardTitle>
              <CardDescription>Let AI create a balanced budget based on your spending and current context.</CardDescription>
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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="amount">Amount</TabsTrigger>
              <TabsTrigger value="percentage">Percentage</TabsTrigger>
          </TabsList>
          <TabsContent value="amount" className="pt-4">
            <div className="space-y-4">
              {categories.map((category) => {
                  const spent = getSpentForCategory(category.id);
                  const budgetAmount = parseFloat(localBudgets[category.id]) || 0;
                  const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
                  const remaining = budgetAmount - spent;

                  return (
                  <div key={category.id} className="space-y-2">
                      <div className="flex items-center gap-4">
                          <Label htmlFor={`budget-amount-${category.id}`} className="flex items-center gap-2 text-base flex-1">
                              <category.icon className="w-5 h-5 text-muted-foreground" />
                              {category.name}
                          </Label>
                          <Input
                              id={`budget-amount-${category.id}`}
                              type="number"
                              step="10"
                              placeholder="Set budget"
                              value={localBudgets[category.id] ?? ''}
                              onChange={(e) => handleAmountBudgetChange(category.id, e.target.value)}
                              className="w-32 text-right"
                          />
                      </div>
                      {budgetAmount > 0 && (
                          <div className="pl-9">
                              <Progress value={progress > 100 ? 100 : progress} className="h-2" />
                              <p className={`text-xs mt-1 font-medium ${remaining < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {currencyFormatter.format(spent)} spent / {currencyFormatter.format(Math.abs(remaining))} {remaining >= 0 ? 'left' : 'over'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                  Your budget of {currencyFormatter.format(budgetAmount)} is made of {currencyFormatter.format(spent)} spent and {currencyFormatter.format(remaining > 0 ? remaining : 0)} remaining.
                              </p>
                          </div>
                      )}
                  </div>
                  );
              })}
            </div>
        </TabsContent>
        <TabsContent value="percentage" className="pt-4">
            <div className="space-y-8">
                <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Allocate percentages of your remaining balance.</p>
                    <p className="text-lg font-bold">{currencyFormatter.format(remainingBalance)}</p>
                    <p className={`text-sm font-semibold ${totalPercentage !== 100 ? 'text-destructive' : 'text-primary'}`}>
                        {totalPercentage}% Allocated (Must be 100%)
                    </p>
                </div>
                {categories.map(category => {
                    if (category.type === 'savings') return null;
                    const percentage = parseFloat(localPercentages[category.id]) || 0;
                    const calculatedAmount = (remainingBalance * percentage) / 100;
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
                                    value={localPercentages[category.id] ?? ''}
                                    onChange={e => handlePercentageBudgetChange(category.id, e.target.value)}
                                    className="w-24"
                                />
                                <span className="text-lg font-semibold">%</span>
                                <span className="text-sm text-muted-foreground">
                                    = {currencyFormatter.format(calculatedAmount)}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </TabsContent>
      </Tabs>
      <div className="flex justify-end pt-8">
          <Button onClick={handleSaveBudgets} disabled={isSaveDisabled()}>
              Save Budgets
          </Button>
      </div>
    </>
  );
}
