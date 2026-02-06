"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { IncomeForm } from "@/components/income-form";
import { TrendingUp } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

export function AddIncomeButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <TrendingUp className="mr-2 h-4 w-4" /> Add Income
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Income</SheetTitle>
          <SheetDescription>
            Log any new income to add to your allowance.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4">
                <IncomeForm afterSubmit={() => setOpen(false)} />
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}