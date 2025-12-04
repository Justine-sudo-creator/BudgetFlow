'use server';
/**
 * @fileOverview An AI flow to suggest allocation for accumulated funds.
 *
 * - getSuggestion - A function that returns a suggestion.
 */

import {ai} from '@/ai/genkit';
import type { SuggestionInput, SuggestionOutput } from '@/ai/flows/suggestion-types';
import { SuggestionInputSchema, SuggestionOutputSchema } from '@/ai/flows/suggestion-types';


const prompt = ai.definePrompt({
    name: 'suggestionPrompt',
    input: { schema: SuggestionInputSchema },
    output: { schema: SuggestionOutputSchema },
    prompt: `You are a friendly and encouraging financial advisor for a student in the Philippines. The user has accumulated some extra funds by spending less than their budget. Your task is to provide a suggestion on how to allocate these funds. The currency is Philippine Pesos (PHP). Keep the local context in mind (e.g., suggesting a ₱500 allocation is a reasonable amount for a coffee treat, but not for a major purchase).

Analyze the user's spending habits based on the provided category spending data.

Your suggestion should be:
1.  **Positive and Encouraging**: Start by congratulating the user on having extra funds.
2.  **Actionable and Contextual**: Provide specific ideas on where to allocate the money. You can suggest putting it towards a 'want' category they haven't spent much on, saving it, or allocating it to a 'need' category for the future. Make the suggestions relevant to a student's life in the Philippines.
3.  **Justified**: Explain *why* you are making a particular suggestion, linking it to their spending patterns. For example, "I noticed you haven't spent much on entertainment, maybe treat yourself to a movie with friends!"
4.  **Forward-looking**: Briefly mention the positive outcome of their choice. e.g., "This will help you relax and recharge for your studies."
5.  **Formatted in Markdown**: Use headings (##), bold text (**text**), and unordered lists (* item) to structure the response clearly.

Here is the user's data:
- Accumulated Funds: ₱{{accumulatedFunds}}
- Category Spending:
{{#each categorySpending}}
  - {{name}}: ₱{{spent}}
{{/each}}

Generate a helpful and motivating suggestion now.`
});


export async function getSuggestion(input: SuggestionInput): Promise<SuggestionOutput> {
  const {output} = await prompt(input);
  if (!output) {
      throw new Error("The AI model did not return a suggestion.");
  }
  return output;
}
