'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
  return validateWordFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateWordPrompt',
  input: { schema: ValidateWordInputSchema },
  output: { schema: ValidateWordOutputSchema },
  prompt: `You are a Scrabble dictionary expert. Determine if the following word is a valid English word according to standard Scrabble rules. Do not allow proper nouns, abbreviations, or words with punctuation.

Word: {{{word}}}

Respond with whether it is valid and a brief reason.`,
});

const validateWordFlow = ai.defineFlow(
  {
    name: 'validateWordFlow',
    inputSchema: ValidateWordInputSchema,
    outputSchema: ValidateWordOutputSchema,
  },
  async (input) => {
    if (!input.word || input.word.length < 2) {
        return { isValid: false, reason: "Words must be at least 2 letters long." };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
