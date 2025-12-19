
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useBudget } from "@/hooks/use-budget";
import { utils, writeFile } from "xlsx";
import { format, parseISO } from "date-fns";

export function ExpenseExporter() {
  const { expenses, getCategoryById } = useBudget();
  const [isExporting, setIsExporting] = useState(false);

  const prepareExportData = () => {
    return expenses.map((expense) => {
      const category = getCategoryById(expense.categoryId);
      return {
        name: expense.notes || "N/A",
        date: format(parseISO(expense.date), "yyyy-MM-dd"),
        amount: expense.amount,
        category: category ? category.name : "Uncategorized",
      };
    });
  };

  const handleExport = (formatType: "csv" | "xlsx") => {
    setIsExporting(true);

    const data = prepareExportData();
    const worksheet = utils.json_to_sheet(data);
    const today = format(new Date(), "yyyy-MM-dd");

    if (formatType === "csv") {
      const csvOutput = utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `budgetflow_expenses_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (formatType === "xlsx") {
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, "Expenses");
      writeFile(workbook, `budgetflow_expenses_${today}.xlsx`);
    }

    setIsExporting(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Export Expense Data</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Export as .csv
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExport("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as .xlsx
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
