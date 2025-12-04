'use server';
/**
 * @fileOverview An AI flow to parse and categorize pasted expense data.
 *
 * - processPastedExpenses - A function that processes raw text and returns structured expense data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExpenseParserInputSchema = z.object({
  pastedText: z.string().describe("The raw text pasted by the user containing expense data."),
});

const ExpenseParserOutputSchema = z.object({
  items: z.array(z.object({
    name: z.string().describe("The name of the expense."),
    date: z.string().describe("The date of the expense in YYYY-MM-DD format."),
    amount: z.number().describe("The numerical amount of the expense."),
    category: z.string().describe("The category of the expense."),
  })).describe("An array of parsed expenses."),
});

export type ExpenseParserOutput = z.infer<typeof ExpenseParserOutputSchema>;

const prompt = ai.definePrompt({
  name: 'expenseParserPrompt',
  input: { schema: ExpenseParserInputSchema },
  output: { schema: ExpenseParserOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `You are a data parsing engine. Convert the raw CSV text into a structured JSON array of expenses. The CSV columns are: name,date,amount,category.

Pasted Text:
\`\`\`
{{pastedText}}
\`\`\`

Return only the structured JSON object.`,
});


export async function processPastedExpenses(pastedText: string, categories: {id: string, name: string}[]): Promise<ExpenseParserOutput> {
    const input = {
        pastedText,
    };

    const { output } = await prompt(input);
    if (!output || !output.items) {
        throw new Error("The AI model did not return a valid response.");
    }
    
    // Map the AI's category string to the application's category ID
    const processedItems = output.items.map(item => {
        const foundCategory = categories.find(c => c.name.toLowerCase() === item.category.toLowerCase());
        return {
            name: item.name,
            date: item.date,
            amount: item.amount,
            // Fallback to a default if the AI hallucinates a category not in our list
            category: foundCategory ? foundCategory.id : 'shopping', 
        }
    });

    return { items: processedItems };
}
