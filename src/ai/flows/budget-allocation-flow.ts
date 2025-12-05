
'use server';
/**
 * @fileOverview An AI flow to suggest budget allocations.
 *
 * - getBudgetAllocation - A function that returns a budget allocation suggestion.
 */

import {ai} from '@/ai/genkit';
import type { BudgetAllocationInput, BudgetAllocationOutput } from '@/ai/flows/budget-allocation-types';
import { BudgetAllocationInputSchema, BudgetAllocationOutputSchema } from '@/ai/flows/budget-allocation-types';


const prompt = ai.definePrompt({
    name: 'budgetAllocationPrompt',
    input: { schema: BudgetAllocationInputSchema },
    output: { schema: BudgetAllocationOutputSchema },
    prompt: `You are an expert financial planner for a student in the Philippines. You are empathetic, realistic, and your goal is to be helpful. The currency is Philippine Pesos (PHP).

Your main task is to create a realistic forward-looking spending plan for the user's *remaining spendable funds*. Do not judge past spending.

**CRITICAL RULES:**
1.  **Use ONLY Existing Categories**: You MUST allocate funds ONLY to the categories provided in the \`categorySpending\` list. DO NOT invent new categories like "Student Driver's Permit".
2.  **Re-assign Specific Costs**: If the user's context mentions a specific cost (e.g., 'I need to pay for my driver's permit'), identify the most logical EXISTING category (like 'Transport' or 'Education') for that cost. Add the cost to that category's allocation and explain why you did it.
3.  **Acknowledge Pre-Allocated Funds**: Start by stating the amounts the user has already set aside for Savings and Sinking Funds. Make it clear these are NOT part of the new spending plan you are creating.
4.  **Work with Remaining Spendable Funds**: The budget you create must be based on the \`remainingBalance\`. This amount is what's left after all expenses, savings, and sinking funds. The percentages you suggest must total 100% of this remaining balance.
5.  **Prioritize Needs, Always**: Essential "Need" categories (like Food, Transport) MUST receive a portion of the remaining funds.
6.  **Include PHP Amounts**: For each category suggestion, you MUST include the calculated PHP amount (e.g., ₱2,000). The total of your suggested PHP amounts must equal the \`remainingBalance\`.
7.  **Suggest Sinking Funds (Optional)**: Analyze the \`recentExpenses\` for patterns in 'Want' spending. If you see recurring purchases for a specific goal, you can suggest creating a 'Sinking Fund'.
8.  **Format as Markdown**: Your entire response must be a single markdown string.

{{#if userContext}}
9.  **Consider User Context Heavily**: "{{userContext}}"
{{/if}}

**USER DATA:**
- Total Allowance: ₱{{allowance}}
- Amount in Savings: ₱{{savingsAmount}}
- Amount in Sinking Funds: ₱{{totalSinkingFunds}}
- **Remaining Spendable Balance to Budget**: ₱{{remainingBalance}}
- Existing Sinking Funds:
{{#each sinkingFunds}}
    - {{name}} (Target: ₱{{targetAmount}})
{{else}}
    - None yet.
{{/each}}
- Categories to Budget For (and current spending for context):
{{#each categorySpending}}
  - {{name}} (Type: {{type}}): Spent ₱{{spent}} so far.
{{/each}}
- Recent Expense History (to understand habits):
{{#each recentExpenses}}
  - {{date}}: ₱{{amount}} on {{name}} (Category: {{categoryName}})
{{/each}}

Generate the markdown suggestion now.`
});

export async function getBudgetAllocation(input: BudgetAllocationInput): Promise<BudgetAllocationOutput> {
  const {output} = await prompt(input);
  if (!output) {
      throw new Error("The AI model did not return a budget allocation.");
  }
  return output;
}
