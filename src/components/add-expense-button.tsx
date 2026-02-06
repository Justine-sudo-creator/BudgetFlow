"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { ExpenseForm } from "@/components/expense-form";
import { Plus, Edit } from "lucide-react";
import type { Expense } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface AddExpenseButtonProps {
  expenseToEdit?: Expense;
  isMenuItem?: boolean;
}

export function AddExpenseButton({ expenseToEdit, isMenuItem }: AddExpenseButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {expenseToEdit ? (
          isMenuItem ? (
            <div className="flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </div>
          ) : (
            <Button variant="ghost" size="sm">Edit</Button>
          )
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{expenseToEdit ? 'Edit Expense' : 'Add New Expense'}</SheetTitle>
          <SheetDescription>
            {expenseToEdit ? 'Update the details of your expense.' : 'Log a new expense to track your spending.'}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-4">
                <ExpenseForm expenseToEdit={expenseToEdit} afterSubmit={() => setOpen(false)} />
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}