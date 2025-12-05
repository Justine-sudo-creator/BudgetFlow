"use client";

import { useBudget } from "@/hooks/use-budget";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, PiggyBank, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { SinkingFund } from "@/lib/types";
import { Progress } from "../ui/progress";
import { Skeleton } from "../ui/skeleton";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function SinkingFundForm({ fund, onSave }: { fund?: SinkingFund, onSave: () => void }) {
  const [name, setName] = useState(fund?.name || "");
  const [targetAmount, setTargetAmount] = useState(fund?.targetAmount || 0);
  const [currentAmount, setCurrentAmount] = useState(fund?.currentAmount || 0);
  const { addSinkingFund, updateSinkingFund } = useBudget();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fund) {
      updateSinkingFund({ ...fund, name, targetAmount, currentAmount });
    } else {
      addSinkingFund({ name, targetAmount });
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fund-name">Fund Name</Label>
        <Input id="fund-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., New Laptop" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fund-target">Target Amount</Label>
        <Input id="fund-target" type="number" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))} placeholder="e.g., 50000" required />
      </div>
      {fund && (
         <div className="space-y-2">
            <Label htmlFor="fund-current">Current Amount</Label>
            <Input id="fund-current" type="number" value={currentAmount} onChange={(e) => setCurrentAmount(Number(e.target.value))} required />
        </div>
      )}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit">Save Fund</Button>
      </DialogFooter>
    </form>
  );
}


function AllocateToFundForm({ fund, onSave }: { fund: SinkingFund, onSave: () => void }) {
    const { allocateToSinkingFund, remainingBalance } = useBudget();
    const [amount, setAmount] = useState(0);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount > remainingBalance) {
            toast({
                variant: 'destructive',
                title: "Insufficient Balance",
                description: `You only have ${currencyFormatter.format(remainingBalance)} available to allocate.`,
            });
            return;
        }
        allocateToSinkingFund(fund.id, amount);
        toast({
            title: "Funds Allocated!",
            description: `${currencyFormatter.format(amount)} has been added to your '${fund.name}' fund.`,
        });
        onSave();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="allocation-amount">Amount to Add</Label>
                <Input id="allocation-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
            </div>
             <p className="text-xs text-muted-foreground">Available to allocate: {currencyFormatter.format(remainingBalance)}</p>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Allocate</Button>
            </DialogFooter>
        </form>
    );
}

export function SinkingFunds() {
  const { sinkingFunds, deleteSinkingFund, isLoading } = useBudget();
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});

  const handleOpenChange = (dialogId: string, open: boolean) => {
      setOpenDialogs(prev => ({ ...prev, [dialogId]: open }));
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sinking Funds</CardTitle>
        <CardDescription>Set aside money for specific savings goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sinkingFunds.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No sinking funds yet. Add one to start saving for a goal!</p>
        ) : (
          sinkingFunds.map(fund => {
            const progress = fund.targetAmount > 0 ? (fund.currentAmount / fund.targetAmount) * 100 : 0;
            return (
              <div key={fund.id} className="border p-3 rounded-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold">{fund.name}</h4>
                        <p className="text-sm text-muted-foreground">
                            {currencyFormatter.format(fund.currentAmount)} of {currencyFormatter.format(fund.targetAmount)}
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Dialog open={openDialogs[`edit-${fund.id}`]} onOpenChange={(open) => handleOpenChange(`edit-${fund.id}`, open)}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Sinking Fund</DialogTitle>
                                    <DialogDescription>Update the fund's name, target, and current amount.</DialogDescription>
                                </DialogHeader>
                                <SinkingFundForm fund={fund} onSave={() => handleOpenChange(`edit-${fund.id}`, false)} />
                            </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the '{fund.name}' fund. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSinkingFund(fund.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <Progress value={progress} className="my-2 h-2" />
                <Dialog open={openDialogs[`allocate-${fund.id}`]} onOpenChange={(open) => handleOpenChange(`allocate-${fund.id}`, open)}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="w-full mt-2">
                            <PiggyBank className="mr-2 h-4 w-4" /> Allocate Funds
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                         <DialogHeader>
                            <DialogTitle>Allocate to '{fund.name}'</DialogTitle>
                            <DialogDescription>Add money from your remaining balance to this fund.</DialogDescription>
                         </DialogHeader>
                         <AllocateToFundForm fund={fund} onSave={() => handleOpenChange(`allocate-${fund.id}`, false)} />
                    </DialogContent>
                </Dialog>
              </div>
            );
          })
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={openDialogs['add-new']} onOpenChange={(open) => handleOpenChange('add-new', open)}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Sinking Fund
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Sinking Fund</DialogTitle>
                    <DialogDescription>Start a new savings goal for something specific.</DialogDescription>
                </DialogHeader>
                <SinkingFundForm onSave={() => handleOpenChange('add-new', false)} />
            </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
