import Image from 'next/image';
import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MinigamesPage() {
  const wordSearchImage = PlaceHolderImages.find(p => p.id === 'minigame-word-search');

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Minigames</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/minigames/word-search">
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
              {wordSearchImage && (
                <Image
                  src={wordSearchImage.imageUrl}
                  alt={wordSearchImage.description}
                  width={600}
                  height={400}
                  data-ai-hint={wordSearchImage.imageHint}
                  className="w-full object-cover aspect-[3/2]"
                />
              )}
              <CardHeader>
                <CardTitle>Word Search</CardTitle>
                <CardDescription>Find the hidden words in the grid.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Card className="flex flex-col items-center justify-center border-dashed text-center">
            <CardHeader>
              <CardTitle>Crosswords</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
          </Card>
           <Card className="flex flex-col items-center justify-center border-dashed text-center">
            <CardHeader>
              <CardTitle>Connect the Dots</CardTitle>
              <CardDescription>Coming Soon</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
