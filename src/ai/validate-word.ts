'use server';

import { z } from 'zod';
import { generateGeminiJson, hasGeminiApiKey } from '@/ai/gemini-client';

const ValidateWordInputSchema = z.object({
  word: z.string().describe('The word to validate.'),
});
export type ValidateWordInput = z.infer<typeof ValidateWordInputSchema>;

const ValidateWordOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the word is a valid English word.'),
  reason: z.string().describe('The reason why the word is or is not valid.'),
});
export type ValidateWordOutput = z.infer<typeof ValidateWordOutputSchema>;

export async function validateWord(input: ValidateWordInput): Promise<ValidateWordOutput> {
  if (!input.word || input.word.length < 2) {
    return { isValid: false, reason: 'Words must be at least 2 letters long.' };
  }

  if (!hasGeminiApiKey()) {
    return { isValid: false, reason: 'AI word validation is unavailable until a Gemini API key is configured.' };
  }

  const prompt = `You are a Scrabble dictionary expert. Determine if the following word is a valid English word according to standard Scrabble rules. Do not allow proper nouns, abbreviations, or words with punctuation.

Word: {{{word}}}

Respond with JSON using this exact shape:
{"isValid":true,"reason":"brief explanation"}

Word: ${input.word}`;

  return ValidateWordOutputSchema.parse(await generateGeminiJson<ValidateWordOutput>(prompt));
}
