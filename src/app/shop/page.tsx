'use client';

import { useState } from 'react';
import Image from 'next/image';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBerries } from '@/hooks/use-berries';
import { Cherry, Check, Lock, Search, Sparkles } from 'lucide-react';
import { canAccessTileTier, TILE_COLLECTIONS, TILE_COSMETICS } from '@/lib/tile-cosmetics';
import ExperienceMeter from '@/components/profile/experience-meter';

function rarityLabel(rarity: string) {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
}

export default function ShopPage() {
  const { berries, level, experience, ownedTileSetIds, equippedTileSetId, isLoading } = useBerries();
  const { toast } = useToast();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleTileSets = TILE_COSMETICS.filter((item) => {
    const matchesCollection = selectedCollection === 'all' || item.collection === selectedCollection;
    const matchesSearch =
      !normalizedSearchQuery ||
      item.name.toLowerCase().includes(normalizedSearchQuery) ||
      item.collection.toLowerCase().includes(normalizedSearchQuery) ||
      item.description.toLowerCase().includes(normalizedSearchQuery);
    return matchesCollection && matchesSearch;
  });

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
        <div className="glass-panel overflow-hidden rounded-[2rem] p-4 sm:p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h1 className="sr-only">Shop</h1>
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

        <div className="glass-panel flex flex-col gap-3 rounded-[1.5rem] p-3 sm:flex-row sm:items-center sm:p-4">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search tile finishes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tile finishes"
              className="h-11 w-full rounded-xl border border-white/80 bg-white/80 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Collection</span>
            <select
              aria-label="Filter tile collection"
              value={selectedCollection}
              onChange={(event) => setSelectedCollection(event.target.value)}
              className="h-11 min-w-48 rounded-xl border border-white/80 bg-white/80 px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">All collections</option>
              {TILE_COLLECTIONS.map((collection) => (
                <option key={collection} value={collection}>
                  {collection}
                </option>
              ))}
            </select>
          </label>
          <span className="self-center whitespace-nowrap rounded-full bg-white/75 px-3 py-1 text-xs font-black text-slate-600">
            {visibleTileSets.length} tiles
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTileSets.map((item) => {
            const isOwned = ownedTileSetIds.includes(item.id);
            const isEquipped = equippedTileSetId === item.id;
            const isPending = pendingItemId === item.id;
            const canAfford = berries >= item.price;
            const isUnlocked = canAccessTileTier(level, item.id);

            return (
              <Card
                key={item.id}
                className="soft-card group relative overflow-hidden rounded-[1.75rem] [contain-intrinsic-size:auto_560px] [content-visibility:auto] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(35,50,80,0.12)]"
              >
                <CardHeader className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-slate-400">
                        {item.collection}
                      </div>
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
                        <Image
                          src={item.assetPath}
                          alt={item.name}
                          fill
                          sizes="(min-width: 640px) 7rem, 6rem"
                          className="object-contain"
                        />
                      </div>
                    </div>
                    {!isUnlocked && (
                      <div className="pointer-events-none absolute inset-0">
                        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white/65 shadow-md backdrop-blur-[1px]">
                          <Lock className="h-4 w-4 text-slate-700/80" />
                        </div>
                        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/60 bg-white/75 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-900 shadow-sm backdrop-blur-[1px]">
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
        {visibleTileSets.length === 0 ? (
          <div className="glass-panel rounded-[1.5rem] p-8 text-center">
            <div className="text-lg font-black text-slate-900">No tile finishes found</div>
            <p className="mt-1 text-sm text-slate-500">Try a different name or collection.</p>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
