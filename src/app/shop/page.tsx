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

const shopItems = [
  {
    id: 'tile-wood',
    name: 'Wooden Tile Set',
    description: 'A classic, rustic look for your tiles.',
    price: 500,
    imageId: 'tile-wood'
  },
  {
    id: 'tile-metallic',
    name: 'Metallic Tile Set',
    description: 'A sleek, modern look for your tiles.',
    price: 750,
    imageId: 'tile-metallic'
  },
  {
    id: 'tile-marble',
    name: 'Marble Tile Set',
    description: 'An elegant, polished marble design.',
    price: 1000,
    imageId: 'tile-marble'
  },
  {
    id: 'tile-cosmic',
    name: 'Cosmic Tile Set',
    description: 'An out-of-this-world cosmic design.',
    price: 1500,
    imageId: 'tile-cosmic'
  },
  {
    id: 'board-wood',
    name: 'Dark Wood Board',
    description: 'A rich, dark wood theme for your game board.',
    price: 1200,
    imageId: 'board-wood'
  },
   {
    id: 'board-stone',
    name: 'Stone Board',
    description: 'A cool, solid stone board theme.',
    price: 1200,
    imageId: 'board-stone'
  },
  {
    id: 'board-beach',
    name: 'Beach Board',
    description: 'Relax with this sandy beach board theme.',
    price: 1200,
    imageId: 'board-beach'
  },
  {
    id: 'board-space',
    name: 'Space Board',
    description: 'Take your game to the final frontier.',
    price: 2000,
    imageId: 'board-space'
  }
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {shopItems.map((item) => (
            <ShopItemCard 
              key={item.id} 
              item={item} 
              onPurchase={() => handlePurchase(item.id, item.price)}
              disabled={purchasedItems.includes(item.id) || berries < item.price}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
