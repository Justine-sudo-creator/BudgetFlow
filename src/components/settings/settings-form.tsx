
"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import type { BudgetTarget } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { useTheme } from "next-themes";
import { Separator } from "../ui/separator";

function DeveloperSettings() {
    const { subscriptionTier, setSubscriptionTier } = useBudget();
    const { toast } = useToast();

    if (subscriptionTier !== 'premium') {
        return null;
    }

    const handleRevert = () => {
        setSubscriptionTier('free');
        toast({
            title: "Reverted to Free Plan",
            description: "You are now on the free plan for testing purposes.",
        });
    }

    return (
        <Card className="mt-6 border-destructive">
            <CardHeader>
                <CardTitle>Developer Settings</CardTitle>
                <CardDescription>
                    This section is for testing purposes and is only visible to premium users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm">
                    Your current plan is: <span className="font-semibold capitalize">{subscriptionTier}</span>
                </p>
            </CardContent>
            <CardFooter>
                <Button variant="destructive" onClick={handleRevert}>Revert to Free Plan</Button>
            </CardFooter>
        </Card>
    )
}

export function SettingsForm() {
  const { allowance, setAllowance, budgetTarget, setBudgetTarget, isLoading } = useBudget();
  const [allowanceAmount, setAllowanceAmount] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetPeriod, setTargetPeriod] = useState<BudgetTarget['period']>('daily');
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      setAllowanceAmount(String(allowance));
      setTargetAmount(String(budgetTarget.amount));
      setTargetPeriod(budgetTarget.period);
    }
  }, [allowance, budgetTarget, isLoading]);

  const handleSaveSettings = () => {
    const newAllowance = Number(allowanceAmount);
    if (!isNaN(newAllowance) && newAllowance >= 0) {
      setAllowance(newAllowance);
    } else {
       toast({
        variant: "destructive",
        title: "Invalid Allowance",
        description: "Please enter a valid number for the allowance.",
      });
      return;
    }

    const newTargetAmount = Number(targetAmount);
    if (!isNaN(newTargetAmount) && newTargetAmount >= 0) {
        setBudgetTarget({
            amount: newTargetAmount,
            period: targetPeriod
        });
    } else {
        toast({
            variant: "destructive",
            title: "Invalid Budget Target",
            description: "Please enter a valid number for the budget target amount.",
        });
        return;
    }

    toast({
      title: "Settings Saved!",
      description: "Your allowance, targets, and theme have been updated.",
    });
  };
  
  if (isLoading) {
      return (
          <>
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                        Manage your total allowance and setup your budget targets.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-1/2" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-32" />
                </CardFooter>
            </Card>
          </>
      )
  }

  return (
    <>
        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                Manage your budget, targets, and application theme.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="allowance">Total Allowance</Label>
                    <Input 
                        type="number" 
                        id="allowance" 
                        placeholder="e.g., 500" 
                        value={allowanceAmount}
                        onChange={(e) => setAllowanceAmount(e.target.value)}
                        />
                    <p className="text-sm text-muted-foreground">This is your total budget. You can add income to increase it.</p>
                </div>
                
                <div className="space-y-4">
                    <Label>Budget Target</Label>
                    <div className="flex items-center gap-4">
                        <Input 
                            type="number" 
                            id="budgetTarget" 
                            placeholder="e.g., 50" 
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            className="w-1/2"
                        />
                        <RadioGroup value={targetPeriod} onValueChange={(value: BudgetTarget['period']) => setTargetPeriod(value)} className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="daily" id="daily" />
                                <Label htmlFor="daily">Daily</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="weekly" id="weekly" />
                                <Label htmlFor="weekly">Weekly</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="monthly" id="monthly" />
                                <Label htmlFor="monthly">Monthly</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <p className="text-sm text-muted-foreground">Set a spending target to help with forecasting how long your funds will last.</p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                    <Label>Theme</Label>
                    <RadioGroup value={theme} onValueChange={setTheme} className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="light" />
                            <Label htmlFor="light">Light</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dark" id="dark" />
                            <Label htmlFor="dark">Dark</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="system" id="system" />
                            <Label htmlFor="system">System</Label>
                        </div>
                    </RadioGroup>
                    <p className="text-sm text-muted-foreground">Select the theme for the application.</p>
                </div>


            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveSettings}>Save Settings</Button>
            </CardFooter>
        </Card>
        <DeveloperSettings />
    </>
  );
}

    