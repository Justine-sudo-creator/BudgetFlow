
"use client";

import { useBudget } from "@/hooks/use-budget";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useState, useEffect, useMemo, useRef } from "react";
import type { Budget, CategoryType, Category } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Sparkles, Save, RotateCcw } from "lucide-react";
import { getBudgetAllocation } from "@/ai/flows/budget-allocation-flow";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { MarkdownContent } from "../insights/markdown-content";
import { subDays, parseISO, format } from "date-fns";
import { Textarea } from "../ui/textarea";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useUser } from "@/firebase";
import { loadStripe } from "@stripe/stripe-js";

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
  const { 
    allowance, categories, budgets, getSpentForCategory, expenses, isLoading, 
    remainingBalance, sinkingFunds, setBudgets, balanceAtBudgetSet, resetBudgetPlan,
    subscriptionTier 
  } = useBudget();
  const { user } = useUser();
  const [localPercentages, setLocalPercentages] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [userContext, setUserContext] = useState("");
  
  const { toast } = useToast();
  
  const isPremium = subscriptionTier === 'premium';

  const spendCategories = useMemo(() => categories.filter(c => c.type !== 'savings'), [categories]);
  const savingsBudgetAmount = useMemo(() => budgets.find(b => b.categoryId === 'savings')?.amount ?? 0, [budgets]);
  
  // A flag to indicate if a budget plan is currently active and "locked in"
  const isPlanActive = useMemo(() => balanceAtBudgetSet > 0, [balanceAtBudgetSet]);

  // Determine the base balance for budget calculations
  const planningBalance = useMemo(() => {
    return isPlanActive ? balanceAtBudgetSet : remainingBalance;
  }, [isPlanActive, balanceAtBudgetSet, remainingBalance]);

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
    if (isPlanActive) return; // Don't allow changes if a plan is active
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
    
    // Use the current remainingBalance as the snapshot for this new plan
    const balanceSnapshot = remainingBalance;

    const newBudgets: Budget[] = spendCategories.map(category => {
        const percentage = localPercentages[category.id] || 0;
        const allocatedAmount = (percentage / 100) * balanceSnapshot;
        
        return {
            id: category.id,
            categoryId: category.id,
            amount: allocatedAmount,
            percentage,
        }
    });

    // We must also include the savings budget in the array we pass to setBudgets
    const savingsBudget = budgets.find(b => b.categoryId === 'savings');
    if (savingsBudget) {
      newBudgets.push(savingsBudget as Budget & {id: string});
    }

    try {
        await setBudgets(newBudgets, balanceSnapshot);
        toast({
            title: "Budget Plan Saved!",
            description: "Your new category budgets have been locked in.",
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

  const handleResetPlan = async () => {
    try {
      await resetBudgetPlan();
      toast({
        title: "Budget Plan Reset",
        description: "You can now create a new budget plan with your current balance.",
      });
    } catch(error) {
       console.error("Failed to reset budget plan", error);
        toast({
            variant: "destructive",
            title: "Reset Failed",
            description: "Could not reset your budget plan.",
        });
    }
  }

  const handleGenerateAI = async () => {
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
  }

  const handleGetBudgetAllocation = async () => {
    if (allowance <= 0) {
        toast({
            variant: "destructive",
            title: "Set Allowance First",
            description: "You need to set your total allowance before the AI can create a budget.",
        });
        return;
    }
     if (isPlanActive) {
        toast({
            variant: "destructive",
            title: "Plan is Active",
            description: "Please reset your current budget plan before generating a new one.",
        });
        return;
    }
    
    if (isPremium) {
      await handleGenerateAI();
      return;
    }

    // --- Logic for non-premium users to upgrade ---
    if (!user) {
        toast({ variant: 'destructive', title: "Not logged in", description: "You must be logged in to upgrade." });
        return;
    }
    setIsGenerating(true);
    try {
        const res = await fetch('/api/stripe/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid }),
        });

        if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error || 'Failed to create checkout session.');
        }

        const { sessionId } = await res.json();
        
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
            throw new Error("Stripe publishable key is not set in environment variables.");
        }
        
        console.log(`Initializing Stripe with publishable key: ${publishableKey.substring(0, 10)}...`);

        const stripe = await loadStripe(publishableKey);
        
        if (!stripe) throw new Error('Stripe.js failed to load.');

        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
            console.error("Stripe redirectToCheckout error:", error);
            throw new Error(`An error occurred with our connection to Stripe: ${error.message}`);
        }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Upgrade Failed",
            description: error.message || "Could not initiate payment. Please try again.",
        });
    } finally {
        setIsGenerating(false);
    }
  };

  const totalAllocatedPercentage = useMemo(() => {
    if (isPlanActive) {
        // If plan is active, sum the stored percentages
        return budgets.reduce((total, b) => total + (b.percentage || 0), 0);
    }
    // Otherwise, use the local state for planning
    return Object.values(localPercentages).reduce((total, p) => total + (p || 0), 0);
  }, [localPercentages, isPlanActive, budgets]);

  const totalAllocatedAmount = useMemo(() => {
    return (totalAllocatedPercentage / 100) * planningBalance;
  }, [totalAllocatedPercentage, planningBalance]);

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
              <CardDescription>
                {isPremium 
                    ? "Generate a new AI budget plan for your remaining funds."
                    : "Upgrade to Premium to unlock the AI Budget Planner."
                }
              </CardDescription>
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
                      disabled={isPlanActive || isGenerating}
                  />
              </div>
              <Button onClick={handleGetBudgetAllocation} disabled={isGenerating || allowance <= 0 || isPlanActive} className="w-full">
                  {isGenerating && !isPremium ? "Redirecting to payment..." : ""}
                  {isGenerating && isPremium ? "Generating..." : ""}
                  {!isGenerating && (
                      <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {!isPremium && "Upgrade to Use AI Planner"}
                          {isPremium && allowance <= 0 && "Set Allowance to Enable AI"}
                          {isPremium && isPlanActive && "Reset Plan to Generate New AI Budget"}
                          {isPremium && !isPlanActive && !isGenerating && "Generate AI Budget Plan"}
                      </>
                  )}
              </Button>
              {isGenerating && (
                  <div className="space-y-2 pt-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                  </div>
              )}
              {suggestion && !isPlanActive && (
                  <div className="prose prose-sm dark:prose-invert rounded-lg border p-4 mt-4">
                    <MarkdownContent content={suggestion} />
                  </div>
              )}
          </CardContent>
      </Card>
      
      <div className="space-y-8 mt-6">
          <div className="p-4 bg-muted rounded-lg sticky top-0 z-10 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                      <p className="text-sm text-muted-foreground">Current Live Balance</p>
                      <p className="text-lg font-bold">{currencyFormatter.format(remainingBalance)}</p>
                  </div>
                  <div>
                      <p className="text-sm text-muted-foreground">Budget Based On</p>
                      <p className="text-lg font-bold">{currencyFormatter.format(planningBalance)}</p>
                  </div>
              </div>
              {isPlanActive && (
                <Alert>
                  <AlertTitle>Budget Plan Active</AlertTitle>
                  <AlertDescription>
                    Your category budgets are locked. To make changes, reset the plan.
                  </AlertDescription>
                </Alert>
              )}
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Category Allocation</h3>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${totalAllocatedPercentage > 100 ? 'text-destructive' : 'text-primary'}`}>
                        {Math.round(totalAllocatedPercentage)}% Allocated
                    </p>
                    <p className="text-xs text-muted-foreground">
                        ({currencyFormatter.format(totalAllocatedAmount)})
                    </p>
                </div>
            </div>
            <div className="space-y-6">
            {spendCategories.map(category => {
                const spent = getSpentForCategory(category.id);
                const budgetForCat = budgets.find(b => b.categoryId === category.id);
                
                let allocatedBudget: number;
                if (isPlanActive) {
                    allocatedBudget = budgetForCat?.amount ?? 0;
                } else {
                    const percentage = localPercentages[category.id] ?? 0;
                    allocatedBudget = (percentage / 100) * planningBalance;
                }

                // If a plan is active, leftToSpend is the allocated amount minus what's been spent *since the plan was set*.
                // For simplicity in this implementation, we will always show the allocated amount as "left to spend" when planning.
                // When a plan is active, this value represents the budget for the period going forward.
                const leftToSpend = allocatedBudget;
                
                // The total for the progress bar is what's been spent + what's newly allocated.
                // This correctly represents the "total funds" for the category for the period.
                const totalForProgress = spent + allocatedBudget;

                const progress = totalForProgress > 0 ? (spent / totalForProgress) * 100 : 0;


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
                                  value={isPlanActive ? budgetForCat?.percentage ?? '' : localPercentages[category.id] || ''}
                                  onChange={(e) => handlePercentageChange(category.id, e.target.value)}
                                  className="w-24"
                                  readOnly={isPlanActive}
                                  aria-readonly={isPlanActive}
                              />
                              <span className="text-lg font-semibold">%</span>
                              <span className="text-sm text-muted-foreground">
                                  = {currencyFormatter.format(allocatedBudget)}
                              </span>
                          </div>
                        <div className="mt-2 space-y-1">
                            <Progress value={progress} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{currencyFormatter.format(spent)} spent</span>
                              <span className={`font-semibold ${leftToSpend < 0 ? 'text-destructive' : 'text-foreground'}`}>{currencyFormatter.format(leftToSpend)} left</span>
                              <span>{currencyFormatter.format(totalForProgress)} total</span>
                            </div>
                        </div>
                    </div>
                )
            })}
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleResetPlan} variant="outline" disabled={!isPlanActive}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset & Re-plan
                </Button>
                <Button onClick={handleSavePlan} disabled={isPlanActive}>
                    <Save className="mr-2 h-4 w-4" /> Save & Lock Plan
                </Button>
            </div>
      </div>
    </>
  );
}

    