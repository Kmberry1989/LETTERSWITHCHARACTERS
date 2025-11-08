'use client';

import Image from 'next/image';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Cherry } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBerries } from '@/hooks/use-berries';
import { ScrollArea } from '@/components/ui/scroll-area';

const shopItems = [
  { id: 'tile-wood', name: 'Wooden Tiles', description: 'A classic, rustic look.', price: 500, imageId: 'tile-wood' },
  { id: 'tile-gummy', name: 'Gummy Tiles', description: 'A sweet and chewy design.', price: 750, imageId: 'tile-gummy' },
  { id: 'tile-runes', name: 'Runic Tiles', description: 'Mystical and ancient.', price: 1000, imageId: 'tile-runes' },
  { id: 'tile-circuit', name: 'Circuit Tiles', description: 'A high-tech look.', price: 1200, imageId: 'tile-circuit' },
  { id: 'tile-felt', name: 'Felt Tiles', description: 'A soft, crafty feel.', price: 600, imageId: 'tile-felt' },
  { id: 'tile-chrome', name: 'Chrome Tiles', description: 'Sleek and reflective.', price: 1500, imageId: 'tile-chrome' },
  { id: 'tile-holographic', name: 'Holographic Tiles', description: 'Shimmering and futuristic.', price: 2000, imageId: 'tile-holographic' },
  { id: 'tile-lava', name: 'Lava Tiles', description: 'Hot and dangerous.', price: 1750, imageId: 'tile-lava' },
  { id: 'tile-papyrus', name: 'Papyrus Tiles', description: 'Ancient and papery.', price: 800, imageId: 'tile-papyrus' },
  { id: 'tile-gilded', name: 'Gilded Tiles', description: 'Ornate and luxurious.', price: 2500, imageId: 'tile-gilded' },
  { id: 'tile-jellyfish', name: 'Jellyfish Tiles', description: 'Bioluminescent and deep.', price: 1800, imageId: 'tile-jellyfish' },
  { id: 'tile-carbon', name: 'Carbon Fiber Tiles', description: 'Strong and lightweight.', price: 2200, imageId: 'tile-carbon' },
  { id: 'tile-minimalist', name: 'Minimalist Tiles', description: 'Clean and simple.', price: 500, imageId: 'tile-minimalist' },
  { id: 'board-wood', name: 'Dark Wood Board', description: 'A rich, dark wood theme.', price: 1200, imageId: 'board-wood' },
  { id: 'board-zen', name: 'Zen Garden Board', description: 'Peaceful and serene.', price: 1500, imageId: 'board-zen' },
  { id: 'board-desk', name: 'Captain\'s Desk Board', description: 'Nautical and adventurous.', price: 1600, imageId: 'board-desk' },
  { id: 'board-blossom', name: 'Cherry Blossom Board', description: 'Beautiful and floral.', price: 1800, imageId: 'board-blossom' },
  { id: 'board-neon', name: 'Neon City Board', description: 'Cyberpunk and vibrant.', price: 2000, imageId: 'board-neon' },
  { id: 'board-blueprint', name: 'Blueprint Board', description: 'Architectural and precise.', price: 1400, imageId: 'board-blueprint' },
  { id: 'board-jungle', name: 'Jungle Board', description: 'Lush and wild.', price: 1700, imageId: 'board-jungle' },
  { id: 'board-library', name: 'Library Board', description: 'Cozy and studious.', price: 1600, imageId: 'board-library' },
  { id: 'board-ice', name: 'Arctic Ice Board', description: 'Cold and crystalline.', price: 1800, imageId: 'board-ice' },
  { id: 'board-candy', name: 'Candy Land Board', description: 'Sweet and delightful.', price: 2200, imageId: 'board-candy' },
  { id: 'board-pirate', name: 'Pirate Map Board', description: 'An adventurous journey.', price: 1900, imageId: 'board-pirate' },
  { id: 'board-stained-glass', name: 'Stained Glass Board', description: 'Artistic and colorful.', price: 2500, imageId: 'board-stained-glass' },
  { id: 'board-deep-space', name: 'Deep Space Board', description: 'Vast and mysterious.', price: 2800, imageId: 'board-deep-space' },
];


function ShopItemCard({ item, onPurchase, disabled }: { item: typeof shopItems[0], onPurchase: (price: number) => void, disabled: boolean }) {
  const image = PlaceHolderImages.find((p) => p.id === item.imageId);
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center justify-center">
        {image && (
          <Image
            src={image.imageUrl}
            alt={item.name}
            width={200}
            height={200}
            data-ai-hint={image.imageHint}
            className="rounded-lg object-cover aspect-square"
          />
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => onPurchase(item.price)} disabled={disabled}>
          <Cherry className="mr-2 h-4 w-4 text-red-400" />
          {item.price.toLocaleString()}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ShopPage() {
  const { berries, setBerries } = useBerries();
  const { toast } = useToast();
  const [purchasedItems, setPurchasedItems] = useState<string[]>([]);

  const handlePurchase = (itemId: string, price: number) => {
    if (berries >= price) {
      setBerries(berries - price);
      setPurchasedItems([...purchasedItems, itemId]);
      toast({
        title: 'Purchase Successful!',
        description: `You bought a new item!`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Not Enough Berries',
        description: "You don't have enough berries to purchase this item.",
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Berry Shop</h1>
        </div>
        <p className="text-muted-foreground">
          Spend your hard-earned berries on new items for your avatar or custom game pieces.
        </p>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pr-4">
            {shopItems.map((item) => (
              <ShopItemCard 
                key={item.id} 
                item={item} 
                onPurchase={() => handlePurchase(item.id, item.price)}
                disabled={purchasedItems.includes(item.id) || berries < item.price}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
