'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const GRID_SIZE = 15;
const WORDS_TO_FIND = ['SCRABBLE', 'ANIMATION', 'PROFILE', 'MINIGAMES', 'LETTERS', 'CANVAS', 'FLUID', 'DYNAMIC', 'CHALLENGE', 'PUZZLE'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type Point = { r: number; c: number };

// Helper to generate a random grid containing the words
function generateGrid(words: string[]) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(''));
  const dirs = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];

  words.forEach(word => {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const rStart = Math.floor(Math.random() * GRID_SIZE);
      const cStart = Math.floor(Math.random() * GRID_SIZE);

      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const r = rStart + dir[0] * i;
        const c = cStart + dir[1] * i;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || (grid[r][c] !== '' && grid[r][c] !== word[i])) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        for (let i = 0; i < word.length; i++) {
          grid[rStart + dir[0] * i][cStart + dir[1] * i] = word[i];
        }
        placed = true;
      }
      attempts++;
    }
  });

  // Fill empty spaces
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    }
  }
  return grid;
}

export default function WordSearchGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<{start: Point, end: Point}[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Point | null>(null);

  const { toast } = useToast();
  const CELL_SIZE = 40; // Canvas cell size

  // Initialize Grid
  useEffect(() => {
    setGrid(generateGrid(WORDS_TO_FIND));
  }, []);

  // Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || grid.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Background Grid
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw Highlights (Found Words)
    ctx.lineCap = 'round';
    ctx.lineWidth = 26;
    
    foundPaths.forEach(path => {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)'; // Green for found
      ctx.beginPath();
      ctx.moveTo(path.start.c * CELL_SIZE + CELL_SIZE / 2, path.start.r * CELL_SIZE + CELL_SIZE / 2);
      ctx.lineTo(path.end.c * CELL_SIZE + CELL_SIZE / 2, path.end.r * CELL_SIZE + CELL_SIZE / 2);
      ctx.stroke();
    });

    // Draw Current Drag
    if (isDragging && dragStart && dragCurrent) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'; // Sky blue for dragging
      ctx.beginPath();
      ctx.moveTo(dragStart.c * CELL_SIZE + CELL_SIZE / 2, dragStart.r * CELL_SIZE + CELL_SIZE / 2);
      ctx.lineTo(dragCurrent.c * CELL_SIZE + CELL_SIZE / 2, dragCurrent.r * CELL_SIZE + CELL_SIZE / 2);
      ctx.stroke();
    }

    // Draw Letters
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        ctx.fillStyle = '#0f172a';
        ctx.fillText(grid[r][c], c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
      }
    }

  }, [grid, foundPaths, isDragging, dragStart, dragCurrent]);

  const getCellFromEvent = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const c = Math.floor(((clientX - rect.left) * scaleX) / CELL_SIZE);
    const r = Math.floor(((clientY - rect.top) * scaleY) / CELL_SIZE);
    
    if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) return { r, c };
    return null;
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // prevent scroll on touch
    const cell = getCellFromEvent(e);
    if (cell) {
      setIsDragging(true);
      setDragStart(cell);
      setDragCurrent(cell);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (cell) {
      // Snap to valid 45/90 degree angles
      if (dragStart) {
        const dr = cell.r - dragStart.r;
        const dc = cell.c - dragStart.c;
        if (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) {
          setDragCurrent(cell);
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || !dragStart || !dragCurrent) return;
    setIsDragging(false);

    // Build the string of selected letters
    const dr = Math.sign(dragCurrent.r - dragStart.r);
    const dc = Math.sign(dragCurrent.c - dragStart.c);
    const length = Math.max(Math.abs(dragCurrent.r - dragStart.r), Math.abs(dragCurrent.c - dragStart.c));
    
    let selectedWord = '';
    for (let i = 0; i <= length; i++) {
      selectedWord += grid[dragStart.r + dr * i][dragStart.c + dc * i];
    }
    const reversedWord = selectedWord.split('').reverse().join('');

    let found = false;
    for (const word of WORDS_TO_FIND) {
      if (!foundWords.includes(word) && (word === selectedWord || word === reversedWord)) {
        setFoundWords(prev => [...prev, word]);
        setFoundPaths(prev => [...prev, { start: dragStart, end: dragCurrent }]);
        toast({ title: 'Word Found!', description: `You found "${word}"!` });
        found = true;
        break;
      }
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  const allWordsFound = foundWords.length === WORDS_TO_FIND.length;

  return (
    <Card className="max-w-6xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-headline">Mega Word Search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner overflow-x-auto">
          <canvas
            ref={canvasRef}
            width={GRID_SIZE * CELL_SIZE}
            height={GRID_SIZE * CELL_SIZE}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="cursor-crosshair touch-none rounded-md mx-auto block"
            style={{ width: `${GRID_SIZE * CELL_SIZE}px`, height: `${GRID_SIZE * CELL_SIZE}px` }}
          />
        </div>
        <div className="w-full lg:w-72 flex flex-col">
          <h3 className="mb-4 font-bold text-xl text-slate-800">Words ({foundWords.length}/{WORDS_TO_FIND.length})</h3>
          <div className="flex flex-wrap gap-2">
            {WORDS_TO_FIND.map((word) => (
              <Badge
                key={word}
                variant={foundWords.includes(word) ? 'default' : 'secondary'}
                className={`transition-all text-sm py-1.5 px-3 ${foundWords.includes(word) ? 'bg-green-500 hover:bg-green-600 line-through opacity-80' : 'bg-slate-200 text-slate-700'}`}
              >
                {word}
              </Badge>
            ))}
          </div>
          {allWordsFound && (
             <div className="mt-8 text-center bg-green-100 p-6 rounded-2xl border border-green-200">
                <p className="font-black text-2xl text-green-700">Perfect!</p>
                <p className="text-sm text-green-600 mt-2">You cleared the expanded grid.</p>
             </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6 text-slate-500 text-sm">
        <p>Click and drag across the canvas to select words in any direction.</p>
        <Button variant="outline" onClick={() => { setFoundWords([]); setFoundPaths([]); setGrid(generateGrid(WORDS_TO_FIND)); }}>
            Generate New Grid
        </Button>
      </CardFooter>
    </Card>
  );
}
  );
}
