'use server';

import { z } from 'zod';
import { generateGeminiJson, hasGeminiApiKey } from '@/ai/gemini-client';

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
  if (!hasGeminiApiKey()) {
    throw new Error('AI hints are unavailable until a Gemini API key is configured.');
  }

  const prompt = `You are a Scrabble assistant. Given the current tiles of the player and the current state of the board, suggest up to 3 valid words that the player can play.

Current tiles: {{{tiles}}}
Current board state: {{{boardState}}}

Respond with JSON using this shape exactly:
{"suggestions":["WORD1","WORD2","WORD3"]}

Current tiles: ${input.tiles}
Current board state: ${input.boardState}`;

  const result = SuggestWordOutputSchema.parse(await generateGeminiJson<SuggestWordOutput>(prompt));
  return {
    suggestions: result.suggestions.map((word) => word.toUpperCase()),
  };
}
