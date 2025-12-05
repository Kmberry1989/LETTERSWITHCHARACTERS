'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BotMoveInputSchema = z.object({
    tiles: z.string().describe('The current tiles of the bot.'),
    boardState: z.string().describe('The current state of the board as a JSON string.'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('The difficulty level of the bot.'),
});
export type BotMoveInput = z.infer<typeof BotMoveInputSchema>;

const BotMoveOutputSchema = z.object({
    word: z.string().describe('The word to play.'),
    startRow: z.number().describe('The starting row index (0-based).'),
    startCol: z.number().describe('The starting column index (0-based).'),
    direction: z.enum(['horizontal', 'vertical']).describe('The direction of the word.'),
});
export type BotMoveOutput = z.infer<typeof BotMoveOutputSchema>;

export async function generateBotMove(input: BotMoveInput): Promise<BotMoveOutput | null> {
    try {
        return await botMoveFlow(input);
    } catch (e) {
        console.error("Error generating bot move:", e);
        return null;
    }
}

const prompt = ai.definePrompt({
    name: 'botMovePrompt',
    input: { schema: BotMoveInputSchema },
    output: { schema: BotMoveOutputSchema },
    prompt: `You are an expert Scrabble/Word game bot. Your goal is to find the best valid move given your tiles and the current board state.

Current tiles: {{{tiles}}}
Current board state (JSON): {{{boardState}}}
Difficulty: {{{difficulty}}}

Rules:
1. You must form a valid English word.
2. You must connect to existing tiles on the board (unless it's the first move).
3. You must only use the tiles you have (plus existing board tiles).
4. Output the word, start coordinates, and direction.

Strategy based on difficulty:
- Easy: Play a short, common word. Avoid high-scoring placements.
- Medium: Play a decent word. Don't spend too much time optimizing.
- Hard: Find the highest scoring move possible. Use bonus squares if available.

If no valid move is possible, return a JSON object with empty strings/zeros, but try your hardest to find a move.`,
});

const botMoveFlow = ai.defineFlow(
    {
        name: 'botMoveFlow',
        inputSchema: BotMoveInputSchema,
        outputSchema: BotMoveOutputSchema,
    },
    async input => {
        const { output } = await prompt(input);
        return output!;
    }
);
