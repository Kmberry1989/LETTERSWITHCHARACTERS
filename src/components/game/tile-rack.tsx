import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const playerTiles = [
  { letter: 'A', score: 1 },
  { letter: 'C', score: 3 },
  { letter: 'T', score: 1 },
  { letter: 'I', score: 1 },
  { letter: 'V', score: 4 },
  { letter: 'E', score: 1 },
  { letter: 'S', score: '1' },
];

function Tile({ letter, score }: { letter: string; score: number | string }) {
  return (
    <div className="relative flex h-12 w-12 cursor-grab select-none items-center justify-center rounded-md border-b-4 border-black/20 bg-[#f8e8c7] shadow-md transition-transform duration-150 ease-in-out hover:scale-105 active:cursor-grabbing active:scale-95 sm:h-16 sm:w-16">
      <span className="text-3xl font-bold text-gray-800">{letter}</span>
      <span className="absolute bottom-1 right-1.5 text-xs font-semibold text-gray-800">{score}</span>
    </div>
  );
}

export default function TileRack() {
  return (
    <Card className="bg-[#c4a27a] border-2 border-[#a07e56]">
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              {playerTiles.map((tile, i) => (
                <Tile key={i} letter={tile.letter} score={tile.score} />
              ))}
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm">Shuffle</Button>
                <Button variant="secondary" size="sm">Pass Turn</Button>
                <Button size="sm">Play Word</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
