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

**IMPORTANT RULES:**
1.  **Savings are Separate**: The user manages their savings in a different part of the app.
    {{#if savingsAmount}}
    - The user has already set aside **₱{{savingsAmount}}** for savings. **DO NOT** suggest any allocation for savings. Your entire 100% allocation must be distributed among the 'Need' and 'Want' categories only.
    {{else}}
    - The user has **not set any savings yet**. Your first task is to suggest a reasonable savings amount based on their spending habits and remaining balance. After suggesting savings, allocate 100% of the *remaining* balance across the other categories.
    {{/if}}
2.  **Work with Remaining Spendable Funds**: The budget you create must be based on the \`remainingBalance\` of **₱{{remainingBalance}}**.
3.  **Prioritize Needs, Always**: Essential "Need" categories (like Food, Transport) MUST receive a portion of the remaining funds.
4.  **Be Realistic about Wants**: Analyze spending habits from \`recentExpenses\`. If a "Want" category has high spending, suggest a lower or zero allocation from the remaining funds to prioritize needs.
5.  **Include PHP Amounts**: For each category suggestion, you MUST include the percentage and the **calculated PHP amount** (e.g., 40% - ₱2,000). The total of your suggested PHP amounts must not exceed the \`remainingBalance\`.
6.  **Suggest Sinking Funds (Optional)**: Analyze the \`recentExpenses\` for patterns in 'Want' spending. If you see recurring purchases for a specific goal (e.g., multiple purchases for computer parts, clothes from the same brand, etc.), you can suggest creating a 'Sinking Fund'. Frame this as a smart way to save for bigger goals. Do not suggest a fund if no clear pattern exists.
7.  **Format as Markdown**: Your entire response must be a single markdown string.

{{#if userContext}}
8.  **Consider User Context Heavily**: "{{userContext}}"
{{/if}}

Example Format (with Sinking Fund suggestion):
## AI Budget Plan

You've already set aside **₱{{savingsAmount}}** for savings, great job!

Here is a suggested spending plan for your remaining **₱{{remainingBalance}}**:

*   **Food & Groceries**: 50% (₱1,000.00) - This is a priority.
*   ...and so on for other categories.

### Smart Tip: Create a Sinking Fund!
I noticed you've been spending on computer accessories. Why not start a "New PC Build" sinking fund? It's a great way to save up for bigger goals without feeling guilty. You can create one in the Sinking Funds card.


**USER DATA:**
- Total Allowance: ₱{{allowance}}
- Amount already in Savings: ₱{{savingsAmount}}
- **Remaining Spendable Balance to Budget**: ₱{{remainingBalance}}
- Existing Sinking Funds:
{{#each sinkingFunds}}
    - {{name}} (Target: ₱{{targetAmount}})
{{else}}
    - None yet.
{{/each}}
- Current Category Spending (for context of habits):
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
