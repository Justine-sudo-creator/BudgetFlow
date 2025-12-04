"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function AllowanceSetter() {
  const { allowance, setAllowance } = useBudget();
  const [amount, setAmount] = useState(String(allowance));
  const { toast } = useToast();

  useEffect(() => {
    setAmount(String(allowance));
  }, [allowance]);

  const handleSetAllowance = () => {
    const newAmount = Number(amount);
    if (!isNaN(newAmount) && newAmount >= 0) {
      setAllowance(newAmount);
      toast({
        title: "Allowance Updated!",
        description: "Your total allowance has been changed.",
      });
    } else {
       toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid number for the allowance.",
      });
    }
  };

  if (allowance > 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Total Allowance</CardTitle>
                <CardDescription>
                This is your total budget. You can add more income or edit this base amount.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="allowance">Current Allowance</Label>
                <Input 
                    type="number" 
                    id="allowance" 
                    placeholder="e.g., 500" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSetAllowance}>Update Allowance</Button>
            </CardFooter>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Allowance</CardTitle>
        <CardDescription>
          Start by setting your total allowance or budget for this period. You can add more income later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="allowance">Initial Allowance</Label>
          <Input 
            type="number" 
            id="allowance" 
            placeholder="e.g., 500" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSetAllowance}>Set Allowance</Button>
      </CardFooter>
    </Card>
  );
}
