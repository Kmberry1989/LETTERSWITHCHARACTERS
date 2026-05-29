'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from '@/lib/client/document-client';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { Skeleton } from '../ui/skeleton';
import { normalizeUserCosmetics } from '@/lib/user-profile';
import { canAccessTileTier, TILE_COSMETICS } from '@/lib/tile-cosmetics';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

const boardThemes = [
  { id: 'board-green', name: 'Classic Green' },
  { id: 'board-wood', name: 'Dark Wood' },
  { id: 'board-zen', name: 'Zen Garden' },
  { id: 'board-desk', name: "Captain's Desk" },
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

function AppearanceEditorSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <h2 className="mb-4 font-headline text-xl font-bold">Board Preview</h2>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="aspect-square w-full" />
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <h2 className="mb-4 font-headline text-xl font-bold">Appearance</h2>
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}

export default function AppearanceEditor() {
  const { user } = useUser();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    return user ? doc(null, 'users', user.uid) : null;
  }, [user]);

  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);

  const [selectedTileSet, setSelectedTileSet] = useState<string>('tile-minimalist');
  const [selectedBoardTheme, setSelectedBoardTheme] = useState<string>('board-green');
  const [ownedTileSetIds, setOwnedTileSetIds] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(1);

  useEffect(() => {
    if (userProfile) {
      const normalized = normalizeUserCosmetics(userProfile);
      setSelectedTileSet(normalized.equippedTileSetId);
      setOwnedTileSetIds(normalized.ownedTileSetIds);
      setLevel(normalized.level ?? 1);
      setSelectedBoardTheme(userProfile.boardThemeId || 'board-green');
    }
  }, [userProfile]);

  const handleBoardSelection = (id: string) => {
    if (!user || !userDocRef) return;
    setSelectedBoardTheme(id);
    const updatePayload = { boardThemeId: id };

    updateDoc(userDocRef, updatePayload)
      .then(() => {
        toast({
          title: 'Appearance saved',
          description: 'Your board style has been updated.',
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: updatePayload,
          user,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        toast({
          variant: 'destructive',
          title: 'Error saving appearance',
          description: 'Could not save your board customization.',
        });
      });
  };

  const handleTileSelection = async (id: string) => {
    try {
      const response = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Could not equip tile set.');
      }
      setSelectedTileSet(id);
      toast({
        title: 'Tile set equipped',
        description: 'Your new tile style will appear in gameplay.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Could not equip tile set',
        description: error.message || 'Please try again.',
      });
    }
  };

  const tileImage = TILE_COSMETICS.find((p) => p.id === selectedTileSet);
  const boardImage = PlaceHolderImages.find((p) => p.id === selectedBoardTheme);

  if (isLoading || !userProfile) {
    return <AppearanceEditorSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <h2 className="mb-4 font-headline text-xl font-bold">Board Preview</h2>
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-md">
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
                  <div className="relative aspect-square w-1/2 overflow-hidden rounded-2xl border border-black/10 shadow-2xl">
                    <Image
                      src={tileImage.assetPath}
                      alt={tileImage.description}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <h2 className="mb-4 font-headline text-xl font-bold">Board and Tile Style</h2>
        <Tabs defaultValue="tiles" className="w-full">
          <TabsList>
            <TabsTrigger value="tiles">Tile Sets</TabsTrigger>
            <TabsTrigger value="boards">Board Themes</TabsTrigger>
          </TabsList>
          <TabsContent value="tiles">
            <ScrollArea className="h-96">
              <div className="grid grid-cols-2 gap-4 pr-4 sm:grid-cols-3">
                {TILE_COSMETICS.map((item) => {
                  const isOwned = ownedTileSetIds.includes(item.id);
                  const isUnlocked = canAccessTileTier(level, item.id);
                  return (
                    <Button
                      key={item.id}
                      variant={selectedTileSet === item.id ? 'default' : 'outline'}
                      onClick={() => isOwned && handleTileSelection(item.id)}
                      className="relative h-auto flex-col gap-2 p-2"
                      disabled={!isOwned}
                    >
                      <div className="relative aspect-square w-20 overflow-hidden rounded-md border border-black/10">
                        <Image
                          src={item.assetPath}
                          alt={item.name}
                          fill
                          className={`object-cover ${!isUnlocked ? 'opacity-35 grayscale' : !isOwned ? 'opacity-55 saturate-75' : ''}`}
                        />
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/18 backdrop-blur-[1px]">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10">
                              <Lock className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">Lv {item.requiredLevel}</Badge>
                      {item.name}
                    </Button>
                  );
                })}
              </div>
              <div className="mt-4 pr-4">
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/shop">Browse more tile sets in the shop</Link>
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="boards">
            <ScrollArea className="h-96">
              <div className="grid grid-cols-2 gap-4 pr-4 sm:grid-cols-3">
                {boardThemes.map((item) => {
                  const image = PlaceHolderImages.find((p) => p.id === item.id);
                  return (
                    <Button
                      key={item.id}
                      variant={selectedBoardTheme === item.id ? 'default' : 'outline'}
                      onClick={() => handleBoardSelection(item.id)}
                      className="h-auto flex-col gap-2 p-2"
                    >
                      {image && (
                        <Image
                          src={image.imageUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="aspect-square rounded-md object-cover"
                        />
                      )}
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
