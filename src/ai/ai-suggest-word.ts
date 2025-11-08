// This is an AI assistant to suggest words that a player can play given the current state of the game.
// It takes in the current tiles of the player and the current state of the board.
// It returns a list of suggested words.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWordInputSchema = z.object({
  tiles: z.string().describe('The current tiles of the player.'),
  boardState: z.string().describe('The current state of the board.'),
});
export type SuggestWordInput = z.infer<typeof SuggestWordInputSchema>;

const SuggestWordOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of suggested words.'),
});
export type SuggestWordOutput = z.infer<typeof SuggestWordOutputSchema>;

export async function suggestWord(input: SuggestWordInput): Promise<SuggestWordOutput> {
  return suggestWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWordPrompt',
  input: {schema: SuggestWordInputSchema},
  output: {schema: SuggestWordOutputSchema},
  prompt: `You are a Scrabble assistant. Given the current tiles of the player and the current state of the board, suggest valid words that the player can play.

Current tiles: {{{tiles}}}
Current board state: {{{boardState}}}

Suggestions:`,
});

const suggestWordFlow = ai.defineFlow(
  {
    name: 'suggestWordFlow',
    inputSchema: SuggestWordInputSchema,
    outputSchema: SuggestWordOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
