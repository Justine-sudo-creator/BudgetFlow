import {z} from 'genkit';

/**
 * @fileOverview Shared types for the budget allocation flow.
 *
 * - BudgetAllocationInput - The input type for the getBudgetAllocation function.
 * - BudgetAllocationOutput - The return type for the getBudgetAllocation function.
 */

export const BudgetAllocationInputSchema = z.object({
    allowance: z.number().describe("The total allowance for the period."),
    remainingBalance: z.number().describe("The actual amount of money left to be budgeted for spending categories."),
    savingsAmount: z.number().describe("The amount already set aside for savings. This is NOT part of the remainingBalance for spending."),
    sinkingFunds: z.array(z.object({
        name: z.string().describe("The name of the sinking fund."),
        targetAmount: z.number().describe("The target amount for the fund."),
        currentAmount: z.number().describe("The current amount saved in the fund."),
    })).describe("An array of the user's existing sinking funds."),
    categorySpending: z.array(z.object({
        name: z.string().describe("The name of the spending category."),
        spent: z.number().describe("The amount spent in this category so far."),
        type: z.string().describe("The type of the category (need, want, or savings).")
    })).describe("An array of objects representing the user's spending per category. Excludes savings."),
    recentExpenses: z.array(z.object({
        name: z.string().describe("The notes or name of the expense item."),
        amount: z.number().describe("The amount of the expense."),
        date: z.string().describe("The date of the expense."),
        categoryName: z.string().describe("The name of the expense's category."),
    })).describe("An array of recent expenses to analyze spending habits."),
    userContext: z.string().optional().describe("Optional context provided by the user to influence the budget suggestion (e.g., 'It's summer break, no school expenses').")
});
export type BudgetAllocationInput = z.infer<typeof BudgetAllocationInputSchema>;

export const BudgetAllocationOutputSchema = z.object({
    suggestion: z.string().describe("A markdown-formatted string with budget allocation suggestions for each category, including percentages, the exact calculated PHP amount, and justifications. This plan should be a 'course-correction' based on the remaining balance. It may also include an optional suggestion to create a new sinking fund.")
});
export type BudgetAllocationOutput = z.infer<typeof BudgetAllocationOutputSchema>;
