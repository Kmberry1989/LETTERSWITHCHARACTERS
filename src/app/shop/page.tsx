import Image from 'next/image';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Cherry } from 'lucide-react';

const shopItems = [
  {
    id: 'tile-wood',
    name: 'Wooden Tile Set',
    description: 'A classic, rustic look for your tiles.',
    price: 500,
    imageId: 'shop-item-tile-1'
  },
  {
    id: 'tile-metal',
    name: 'Metallic Tile Set',
    description: 'A sleek, modern look for your tiles.',
    price: 750,
    imageId: 'shop-item-tile-2'
  },
  {
    id: 'prop-wizard',
    name: 'Wizard Hat',
    description: 'A magical hat for your avatar.',
    price: 1200,
    imageId: 'shop-item-prop-1'
  },
   {
    id: 'prop-sword',
    name: 'Pixel Sword',
    description: 'A classic 8-bit sword for your avatar.',
    price: 800,
    imageId: 'swag-prop-1'
  }
];

function ShopItemCard({ item }: { item: typeof shopItems[0] }) {
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
            className="rounded-lg object-cover"
          />
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          <Cherry className="mr-2 h-4 w-4 text-red-400" />
          {item.price.toLocaleString()}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ShopPage() {
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
            <ShopItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
