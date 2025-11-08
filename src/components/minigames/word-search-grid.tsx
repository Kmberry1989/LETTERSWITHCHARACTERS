'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

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

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cellId = `${rowIndex}-${colIndex}`;
    setSelectedCells((prev) =>
      prev.includes(cellId) ? prev.filter((id) => id !== cellId) : [...prev, cellId]
    );
  };

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
                return (
                  <div
                    key={cellId}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={cn(
                      'flex aspect-square cursor-pointer select-none items-center justify-center rounded-md text-lg font-bold transition-colors',
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
        <div>
          <h3 className="mb-4 font-semibold">Words to Find</h3>
          <div className="flex flex-wrap gap-2">
            {wordsToFind.map((word) => (
              <Badge
                key={word}
                variant={foundWords.includes(word) ? 'default' : 'secondary'}
                className={cn('transition-all', foundWords.includes(word) && 'line-through')}
              >
                {word}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">Click on the letters to form words. Good luck!</p>
      </CardFooter>
    </Card>
  );
}
