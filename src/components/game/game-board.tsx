import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

const boardLayout = [
  ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW'],
  ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
  ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
  ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '','', 'DL'],
  ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
  ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
  ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
  ['TW', '', '', 'DL', '', '', '', '★', '', '', '', 'DL', '', '', 'TW'],
  ['', '', 'DL', '', '', '', 'DL', '', 'DL', '', '', '', 'DL', '', ''],
  ['', 'TL', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'TL', ''],
  ['', '', '', '', 'DW', '', '', '', '', '', 'DW', '', '', '', ''],
  ['DL', '', '', 'DW', '', '', '', 'DL', '', '', '', 'DW', '', '', 'DL'],
  ['', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', ''],
  ['', 'DW', '', '', '', 'TL', '', '', '', 'TL', '', '', '', 'DW', ''],
  ['TW', '', '', 'DL', '', '', '', 'TW', '', '', '', 'DL', '', '', 'TW'],
];

const placedTiles = {
  '7-4': { letter: 'L', score: 1 },
  '7-5': { letter: 'E', score: 1 },
  '7-6': { letter: 'T', score: 1 },
  '7-7': { letter: 'T', score: 1 },
  '7-8': { letter: 'E', score: 1 },
  '7-9': { letter: 'R', score: 1 },
  '7-10': { letter: 'S', score: 1 },
  '8-7': { letter: 'H', score: 4 },
  '9-7': { letter: 'E', score: 1 },
  '10-7': { letter: 'M', score: 3 },
  '11-7': { letter: 'E', score: 1 },
};


function Cell({ type, children }: { type: string; children?: React.ReactNode }) {
  const classMap: { [key: string]: string } = {
    'DL': 'board-cell-dl',
    'TL': 'board-cell-tl',
    'DW': 'board-cell-dw',
    'TW': 'board-cell-tw',
    '★': 'board-cell-start',
  };

  const textMap: { [key: string]: string } = {
    'DL': 'Double Letter',
    'TL': 'Triple Letter',
    'DW': 'Double Word',
    'TW': 'Triple Word',
  };
  
  return (
    <div
      className={cn(
        'flex aspect-square select-none items-center justify-center rounded-sm text-xs font-semibold uppercase tracking-tighter text-center leading-none',
        'bg-[#e0d6c4] border border-[#d1c6b4]',
        classMap[type]
      )}
    >
      {children || (type === '★' ? <Star className="h-4 w-4" /> : textMap[type])}
    </div>
  );
}

function Tile({ letter, score }: { letter: string; score: number }) {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-sm border-b-2 border-black/20 bg-[#f8e8c7] shadow-sm">
      <span className="text-lg font-bold text-gray-800">{letter}</span>
      <span className="absolute bottom-0 right-0.5 text-[0.5rem] font-semibold text-gray-800">{score}</span>
    </div>
  );
}

export default function GameBoard() {
  return (
    <div className="w-full aspect-square max-w-full">
      <div className="grid grid-cols-15 gap-0.5 sm:gap-1 p-1 sm:p-2 bg-[#d1c6b4] rounded-md">
        {boardLayout.map((row, rowIndex) =>
          row.map((cellType, colIndex) => {
            const tileKey = `${rowIndex}-${colIndex}`;
            // @ts-ignore
            const tile = placedTiles[tileKey];
            return (
              <Cell key={`${rowIndex}-${colIndex}`} type={cellType}>
                {tile && <Tile letter={tile.letter} score={tile.score} />}
              </Cell>
            );
          })
        )}
      </div>
    </div>
  );
}
