'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

const grid = [
  ['W', 'O', 'R', 'D', 'S', 'E', 'A', 'R', 'C', 'H'],
  ['L', 'P', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'K'],
  ['E', 'L', 'A', 'Y', 'O', 'U', 'T', 'G', 'F', 'J'],
  ['T', 'A', 'N', 'I', 'M', 'A', 'T', 'I', 'O', 'N'],
  ['T', 'Y', 'I', 'S', 'P', 'R', 'O', 'F', 'I', 'L'],
  ['E', 'E', 'N', 'D', 'A', 'O', 'B', 'A', 'E', 'L'],
  ['R', 'R', 'S', 'C', 'R', 'A', 'B', 'B', 'L', 'E'],
  ['S', 'S', 'E', 'M', 'A', 'G', 'I', 'N', 'I', 'M'],
];

const wordsToFind = ['SCRABBLE', 'WORD', 'SEARCH', 'LAYOUT', 'ANIMATION', 'PROFILE', 'MINIGAMES', 'LETTERS'];

export default function WordSearchGrid() {
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<string[]>([]);
  const [bonusWords, setBonusWords] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedCells.length === 0) return;

    const selectedWord = selectedCells
      .map((cellId) => {
        const [r, c] = cellId.split('-').map(Number);
        return grid[r][c];
      })
      .join('');

    const reversedSelectedWord = selectedWord.split('').reverse().join('');

    let cancelled = false;

    const maybeValidateSelection = async () => {
      let wordFound = false;

      for (const wordToFind of wordsToFind) {
        if (!foundWords.includes(wordToFind) && (wordToFind === selectedWord || wordToFind === reversedSelectedWord)) {
          if (cancelled) return;
          setFoundWords((prev) => [...prev, wordToFind]);
          setFoundCells((prev) => [...prev, ...selectedCells]);
          toast({ title: 'Word Found!', description: `You found "${wordToFind}"!` });
          wordFound = true;
          break;
        }
      }

      if (wordFound) {
        if (!cancelled) setSelectedCells([]);
        return;
      }

      if (selectedWord.length < 3) {
        return;
      }

      const candidate = selectedWord.toLowerCase();
      const reverseCandidate = reversedSelectedWord.toLowerCase();
      if (bonusWords.includes(candidate) || bonusWords.includes(reverseCandidate)) {
        return;
      }

      try {
        const response = await fetch('/api/arcade/validate-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: candidate }),
        });
        const result = await response.json().catch(() => null);
        const acceptedWord = result?.isValid ? candidate.toUpperCase() : null;

        if (!acceptedWord) {
          const reversedResponse = await fetch('/api/arcade/validate-word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: reverseCandidate }),
          });
          const reversedResult = await reversedResponse.json().catch(() => null);
          if (reversedResult?.isValid && !cancelled) {
            setBonusWords((prev) => [...prev, reverseCandidate]);
            toast({ title: 'Bonus Word!', description: `You found "${reverseCandidate.toUpperCase()}" from the full dictionary.` });
            setSelectedCells([]);
          }
          return;
        }

        if (!cancelled) {
          setBonusWords((prev) => [...prev, candidate]);
          toast({ title: 'Bonus Word!', description: `You found "${acceptedWord}" from the full dictionary.` });
          setSelectedCells([]);
        }
      } catch {
        // Ignore transient validation failures and let the player keep selecting.
      }
    };

    void maybeValidateSelection();

    return () => {
      cancelled = true;
    };
  }, [bonusWords, foundWords, selectedCells, toast]);

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cellId = `${rowIndex}-${colIndex}`;
    // Don't allow selecting already found cells
    if (foundCells.includes(cellId)) return;

    setSelectedCells((prev) =>
      prev.includes(cellId) ? prev.filter((id) => id !== cellId) : [...prev, cellId]
    );
  };
  
  const handleClearSelection = () => {
    setSelectedCells([]);
  };

  const allWordsFound = foundWords.length === wordsToFind.length;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Find The Words</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="grid grid-cols-10 gap-1 rounded-lg bg-secondary p-2">
            {grid.map((row, rowIndex) =>
              row.map((letter, colIndex) => {
                const cellId = `${rowIndex}-${colIndex}`;
                const isSelected = selectedCells.includes(cellId);
                const isFound = foundCells.includes(cellId);
                return (
                  <div
                    key={cellId}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={cn(
                      'flex aspect-square cursor-pointer select-none items-center justify-center rounded-md text-lg font-bold transition-colors',
                      isFound ? 'bg-green-500 text-primary-foreground' :
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                    )}
                  >
                    {letter}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <h3 className="mb-4 font-semibold">Words to Find ({foundWords.length}/{wordsToFind.length})</h3>
          <div className="flex flex-wrap gap-2">
            {wordsToFind.map((word) => (
              <Badge
                key={word}
                variant={foundWords.includes(word) ? 'default' : 'secondary'}
                className={cn('transition-all text-sm', foundWords.includes(word) && 'line-through opacity-70')}
              >
                {word}
              </Badge>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="mb-3 font-semibold">Bonus Dictionary Words ({bonusWords.length})</h3>
            <div className="flex flex-wrap gap-2">
              {bonusWords.length > 0 ? (
                bonusWords.map((word) => (
                  <Badge key={word} variant="outline" className="text-sm">
                    {word.toUpperCase()}
                  </Badge>
                ))
              ) : null}
            </div>
          </div>
          {allWordsFound && (
             <div className="mt-8 text-center bg-green-100 dark:bg-green-900/50 p-4 rounded-lg">
                <p className="font-bold text-lg text-green-700 dark:text-green-400">Congratulations!</p>
                <p className="text-sm text-muted-foreground">You found all the words!</p>
             </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={handleClearSelection} disabled={selectedCells.length === 0}>
            Clear Selection
        </Button>
      </CardFooter>
    </Card>
  );
}
