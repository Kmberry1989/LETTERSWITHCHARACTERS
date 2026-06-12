'use client';

import { useState } from 'react';
import Image from 'next/image';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
      if (!response.ok) throw new Error(result?.error || 'Could not complete purchase.');
      toast({ title: 'Purchase successful', description: 'Tile set added to your collection.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Purchase failed', description: error.message || 'Please try again.' });
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
      if (!response.ok) throw new Error(result?.error || 'Could not equip tile set.');
      toast({ title: 'Equipped', description: 'Your tiles will use this finish in gameplay.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Equip failed', description: error.message || 'Please try again.' });
    } finally {
      setPendingItemId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-8">
        <div className="glass-panel overflow-hidden rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <Badge variant="outline" className="rounded-full bg-white/[.65] px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em]">
                Collectible Finishes
              </Badge>
              <h1 className="text-3xl font-black tracking-tight font-headline">Berry Shop</h1>
              <p className="max-w-2xl text-sm text-slate-500 sm:text-base">
                Spend berries earned from real matches on tactile tile finishes, then equip them for live play.
              </p>
              <div className="max-w-2xl pt-2">
                <ExperienceMeter experience={experience} level={level} className="w-full" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-[1.25rem] border border-white/75 bg-white/[.78] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_10px_24px_rgba(35,50,80,.08)]">
              <Cherry className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-black">Balance</span>
              <span className="text-lg font-black tabular-nums">{berries.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TILE_COSMETICS.map((item) => {
            const isOwned = ownedTileSetIds.includes(item.id);
            const isEquipped = equippedTileSetId === item.id;
            const isPending = pendingItemId === item.id;
            const canAfford = berries >= item.price;
            const isUnlocked = canAccessTileTier(level, item.id);

            return (
              <Card key={item.id} className="soft-card group relative overflow-hidden rounded-[1.75rem] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(35,50,80,0.12)]">
                <CardHeader className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl font-black">{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="rounded-full bg-white/[.72]">{rarityLabel(item.rarity)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-5 pb-5">
                  <div className="liquid-tray relative aspect-[1.2] overflow-hidden rounded-[1.5rem]">
                    <div className="absolute inset-0 flex items-center justify-center p-5">
                      <div className="relative h-24 w-24 drop-shadow-[0_18px_16px_rgba(15,23,42,0.2)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105 sm:h-28 sm:w-28">
                        <Image src={item.assetPath} alt={item.name} fill className={`object-contain ${!isUnlocked ? 'opacity-35 grayscale' : ''}`} />
                      </div>
                    </div>
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/20 backdrop-blur-[2px]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg">
                          <Lock className="h-6 w-6 text-white drop-shadow" />
                        </div>
                        <span className="rounded-full bg-white/[.88] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-900 shadow-sm">
                          Unlock at level {item.requiredLevel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-black text-slate-500">Unlock • Lv {item.requiredLevel}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/[.72] px-3 py-1 font-black tabular-nums shadow-sm">
                      <Cherry className="h-4 w-4 text-rose-500" />
                      {item.price.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 px-5 pb-5">
                  {isEquipped ? (
                    <Button className="w-full gap-2" variant="secondary" disabled>
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
      </div>
    </AppLayout>
  );
}
