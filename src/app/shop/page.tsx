'use client';

import { useState } from 'react';
import Image from 'next/image';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBerries } from '@/hooks/use-berries';
import { Cherry, Check, Lock, Sparkles } from 'lucide-react';
import { canAccessTileTier, TILE_COSMETICS } from '@/lib/tile-cosmetics';
import ExperienceMeter from '@/components/profile/experience-meter';

function rarityLabel(rarity: string) {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export default function ShopPage() {
  const { berries, level, experience, ownedTileSetIds, equippedTileSetId, isLoading } = useBerries();
  const { toast } = useToast();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const handlePurchase = async (itemId: string) => {
    setPendingItemId(itemId);
    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Could not complete purchase.');
      }

      toast({
        title: 'Purchase successful',
        description: 'Tile set added to your collection.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Purchase failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setPendingItemId(null);
    }
  };

  const handleEquip = async (itemId: string) => {
    setPendingItemId(itemId);
    try {
      const response = await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || 'Could not equip tile set.');
      }

      toast({
        title: 'Equipped',
        description: 'Your tiles will use this finish in gameplay.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Equip failed',
        description: error.message || 'Please try again.',
      });
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-8">
        <div className="rounded-3xl border bg-[radial-gradient(circle_at_top_left,rgba(255,238,201,0.95),rgba(255,255,255,0.92)_42%,rgba(255,236,231,0.95)_100%)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight font-headline">Berry Shop</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Spend berries earned from real matches on tactile tile finishes, then equip them for live play.
              </p>
              <div className="max-w-2xl pt-2">
                <ExperienceMeter experience={experience} level={level} className="w-full" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border bg-white/90 px-4 py-2 shadow-sm">
              <Cherry className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-semibold">Balance</span>
              <span className="text-lg font-black tabular-nums">{berries.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="grid gap-4 pr-4 md:grid-cols-2 xl:grid-cols-3">
            {TILE_COSMETICS.map((item) => {
              const isOwned = ownedTileSetIds.includes(item.id);
              const isEquipped = equippedTileSetId === item.id;
              const isPending = pendingItemId === item.id;
              const canAfford = berries >= item.price;
              const isUnlocked = canAccessTileTier(level, item.id);

              return (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,247,241,0.98))] shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{rarityLabel(item.rarity)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative aspect-[1.25] overflow-hidden rounded-2xl border border-black/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(226,232,240,0.96)_55%,_rgba(203,213,225,0.98))]">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.34),transparent_48%)]" />
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_58%)]" />
                      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-5">
                        <div className="relative h-24 w-24 transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28">
                          <Image
                            src={item.assetPath}
                            alt={item.name}
                            fill
                            className={`object-contain ${!isUnlocked ? 'opacity-35 grayscale' : ''}`}
                          />
                        </div>
                      </div>
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/18 backdrop-blur-[1px]">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/12 shadow-lg">
                            <Lock className="h-6 w-6 text-white drop-shadow" />
                          </div>
                          <span className="rounded-full bg-white/88 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-900 shadow-sm">
                            Unlock at level {item.requiredLevel}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Price • Lv {item.requiredLevel}</span>
                      <span className="inline-flex items-center gap-1 font-black tabular-nums">
                        <Cherry className="h-4 w-4 text-rose-500" />
                        {item.price.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {isEquipped ? (
                      <Button className="w-full gap-2" disabled>
                        <Sparkles className="h-4 w-4" />
                        Equipped
                      </Button>
                    ) : isOwned ? (
                      <Button className="w-full gap-2" onClick={() => handleEquip(item.id)} disabled={isPending || isLoading}>
                        <Check className="h-4 w-4" />
                        {isPending ? 'Equipping...' : 'Equip'}
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        onClick={() => handlePurchase(item.id)}
                        disabled={isPending || isLoading || !canAfford || !isUnlocked}
                        variant={canAfford && isUnlocked ? 'default' : 'secondary'}
                      >
                        {!isUnlocked ? <Lock className="h-4 w-4" /> : <Cherry className="h-4 w-4" />}
                        {isPending ? 'Purchasing...' : !isUnlocked ? `Reach level ${item.requiredLevel}` : canAfford ? 'Buy now' : 'Need more berries'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
