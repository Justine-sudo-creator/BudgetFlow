import {z} from 'genkit';

/**
 * @fileOverview Shared types for the suggestion flow.
 *
 * - SuggestionInput - The input type for the getSuggestion function.
 * - SuggestionOutput - The return type for the getSuggestion function.
 */

export const SuggestionInputSchema = z.object({
    accumulatedFunds: z.number().describe("The amount of extra money the user has."),
    categorySpending: z.array(z.object({
        name: z.string().describe("The name of the spending category."),
        spent: z.number().describe("The amount spent in this category."),
    })).describe("An array of objects representing the user's spending per category."),
});
export type SuggestionInput = z.infer<typeof SuggestionInputSchema>;


export const SuggestionOutputSchema = z.object({
    suggestion: z.string().describe("A markdown-formatted string with suggestions for allocating the accumulated funds. It should be encouraging and provide clear, actionable advice with positive reinforcement.")
});
export type SuggestionOutput = z.infer<typeof SuggestionOutputSchema>;
