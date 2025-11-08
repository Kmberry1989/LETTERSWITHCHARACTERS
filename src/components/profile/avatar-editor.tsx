'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';

const tileSets = [
  { id: 'tile-plastic', name: 'Classic' },
  { id: 'tile-wood', name: 'Wooden' },
  { id: 'tile-gummy', name: 'Gummy' },
  { id: 'tile-runes', name: 'Runes' },
  { id: 'tile-circuit', name: 'Circuit' },
  { id: 'tile-felt', name: 'Felt' },
  { id: 'tile-chrome', name: 'Chrome' },
  { id: 'tile-holographic', name: 'Holographic' },
  { id: 'tile-lava', name: 'Lava' },
  { id: 'tile-papyrus', name: 'Papyrus' },
  { id: 'tile-gilded', name: 'Gilded' },
  { id: 'tile-jellyfish', name: 'Jellyfish' },
  { id: 'tile-carbon', name: 'Carbon Fiber' },
  { id: 'tile-minimalist', name: 'Minimalist' },
];

const boardThemes = [
  { id: 'board-green', name: 'Classic Green' },
  { id: 'board-wood', name: 'Dark Wood' },
  { id: 'board-zen', name: 'Zen Garden' },
  { id: 'board-desk', name: 'Captain\'s Desk' },
  { id: 'board-blossom', name: 'Cherry Blossom' },
  { id: 'board-neon', name: 'Neon City' },
  { id: 'board-blueprint', name: 'Blueprint' },
  { id: 'board-jungle', name: 'Jungle' },
  { id: 'board-library', name: 'Library' },
  { id: 'board-ice', name: 'Arctic Ice' },
  { id: 'board-candy', name: 'Candy Land' },
  { id: 'board-pirate', name: 'Pirate Map' },
  { id: 'board-stained-glass', name: 'Stained Glass' },
  { id: 'board-deep-space', name: 'Deep Space' },
];

export default function AvatarEditor() {
  const [selectedTileSet, setSelectedTileSet] = useState<string>('tile-plastic');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState<string>('board-green');

  const tileImage = PlaceHolderImages.find((p) => p.id === selectedTileSet);
  const boardImage = PlaceHolderImages.find((p) => p.id === selectedBoardTheme);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <h2 className="text-xl font-bold mb-4 font-headline">Your Style</h2>
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-square w-full rounded-md overflow-hidden">
              {boardImage && (
                <Image
                  src={boardImage.imageUrl}
                  alt="Board background"
                  fill
                  data-ai-hint={boardImage.imageHint}
                  className="object-cover"
                />
              )}
              {tileImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="relative w-1/2 aspect-square">
                     <Image
                        src={tileImage.imageUrl}
                        alt={tileImage.description}
                        fill
                        data-ai-hint={tileImage.imageHint}
                        className="object-contain drop-shadow-lg"
                      />
                   </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-4 font-headline">Customize</h2>
        <Tabs defaultValue="tiles" className="w-full">
          <TabsList>
            <TabsTrigger value="tiles">Tile Sets</TabsTrigger>
            <TabsTrigger value="boards">Board Themes</TabsTrigger>
          </TabsList>
          <TabsContent value="tiles">
            <ScrollArea className="h-96">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 pr-4">
                {tileSets.map((item) => {
                  const image = PlaceHolderImages.find((p) => p.id === item.id);
                  return (
                    <Button key={item.id} variant={selectedTileSet === item.id ? 'default' : 'outline'} onClick={() => setSelectedTileSet(item.id)} className="h-auto flex-col p-2 gap-2">
                      {image && <Image src={image.imageUrl} alt={item.name} width={80} height={80} className="rounded-md object-cover aspect-square" />}
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
           <TabsContent value="boards">
             <ScrollArea className="h-96">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 pr-4">
                {boardThemes.map((item) => {
                  const image = PlaceHolderImages.find((p) => p.id === item.id);
                  return (
                    <Button key={item.id} variant={selectedBoardTheme === item.id ? 'default' : 'outline'} onClick={() => setSelectedBoardTheme(item.id)} className="h-auto flex-col p-2 gap-2">
                      {image && <Image src={image.imageUrl} alt={item.name} width={80} height={80} className="rounded-md object-cover aspect-square" />}
                      {item.name}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
