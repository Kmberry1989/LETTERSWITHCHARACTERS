'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, RotateCcw, Save } from 'lucide-react';
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
import { canAccessTileTier, getTileCosmetic, TILE_COLLECTIONS, TILE_COSMETICS } from '@/lib/tile-cosmetics';
import { Badge } from '@/components/ui/badge';
import BoardChrome from '@/components/game/board-chrome';
import GameBoard from '@/components/game/game-board';
import BoardColorPicker from '@/components/profile/board-color-picker';
import { BOARD_SKINS, getDefaultBoardColor, resolveBoardAppearance, resolveBoardColor } from '@/lib/board-skins';

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
  const [selectedBoardColor, setSelectedBoardColor] = useState<string>(getDefaultBoardColor('board-green'));
  const [savedBoardTheme, setSavedBoardTheme] = useState<string>('board-green');
  const [savedBoardColor, setSavedBoardColor] = useState<string>(getDefaultBoardColor('board-green'));
  const [ownedTileSetIds, setOwnedTileSetIds] = useState<string[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [savingBoard, setSavingBoard] = useState(false);
  const [tileCollectionFilter, setTileCollectionFilter] = useState('Classic Collection');

  useEffect(() => {
    if (userProfile) {
      const normalized = normalizeUserCosmetics(userProfile);
      const nextTheme = userProfile.boardThemeId || 'board-green';
      const nextColor = resolveBoardColor(nextTheme, userProfile.boardColor || null, userProfile.boardTintId || null);
      setSelectedTileSet(normalized.equippedTileSetId);
      setTileCollectionFilter(getTileCosmetic(normalized.equippedTileSetId).collection);
      setOwnedTileSetIds(normalized.ownedTileSetIds);
      setLevel(normalized.level ?? 1);
      setSelectedBoardTheme(nextTheme);
      setSelectedBoardColor(nextColor);
      setSavedBoardTheme(nextTheme);
      setSavedBoardColor(nextColor);
    }
  }, [userProfile]);

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

  const handleSaveBoardCustomization = async () => {
    if (!user || !userDocRef) return;
    const normalizedColor = resolveBoardColor(selectedBoardTheme, selectedBoardColor, null);
    const updatePayload = {
      boardThemeId: selectedBoardTheme,
      boardColor: normalizedColor,
      boardTintId: null,
    };

    setSavingBoard(true);
    try {
      await updateDoc(userDocRef, updatePayload);
      setSavedBoardTheme(selectedBoardTheme);
      setSavedBoardColor(normalizedColor);
      setSelectedBoardColor(normalizedColor);
      toast({
        title: 'Board customization saved',
        description: 'Your board style and custom color are ready for play.',
      });
    } catch {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: updatePayload,
        user,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Error saving board customization',
        description: 'Could not save your board appearance.',
      });
    } finally {
      setSavingBoard(false);
    }
  };

  const handleResetBoardCustomization = () => {
    setSelectedBoardTheme('board-green');
    setSelectedBoardColor(getDefaultBoardColor('board-green'));
  };

  const tileImage = TILE_COSMETICS.find((p) => p.id === selectedTileSet);
  const boardAppearance = resolveBoardAppearance(selectedBoardTheme, selectedBoardColor, null);
  const isBoardDirty = selectedBoardTheme !== savedBoardTheme || selectedBoardColor !== savedBoardColor;
  const visibleTileSets =
    tileCollectionFilter === 'all'
      ? TILE_COSMETICS
      : TILE_COSMETICS.filter((tileSet) => tileSet.collection === tileCollectionFilter);

  if (isLoading || !userProfile) {
    return <AppearanceEditorSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <h2 className="mb-3 font-headline text-xl font-bold">Board Preview</h2>
        <Card>
          <CardContent className="space-y-3 p-3 sm:p-4">
            <BoardChrome boardThemeId={selectedBoardTheme} boardColor={selectedBoardColor}>
              <GameBoard />
              {tileImage && (
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <div className="relative aspect-square w-[18%] overflow-hidden rounded-[0.22rem] border border-black/10 shadow-2xl">
                    <Image
                      src={tileImage.assetPath}
                      alt={tileImage.description}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </BoardChrome>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Board Customization</div>
              <div className="mt-2 text-lg font-black text-slate-900">{boardAppearance.skin.name}</div>
              <div className="mt-1 text-sm text-slate-600">{boardAppearance.boardColor}</div>
              <div className="mt-3 h-10 rounded-xl border border-black/10 sm:h-14" style={boardAppearance.previewStyle} />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        <h2 className="mb-4 font-headline text-xl font-bold">Board and Tile Style</h2>
        <Tabs defaultValue="board" className="w-full">
          <TabsList>
            <TabsTrigger value="board">Board Customization</TabsTrigger>
            <TabsTrigger value="tiles">Tile Sets</TabsTrigger>
          </TabsList>
          <TabsContent value="board">
            <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white/85 p-3 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Style Family</div>
                  <div className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">Board style and color only.</div>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    Interface themes are separate. This panel only changes the board preview and gameplay board.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-full" onClick={handleResetBoardCustomization}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to default
                  </Button>
                  <Button className="rounded-full" disabled={!isBoardDirty || savingBoard} onClick={() => void handleSaveBoardCustomization()}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingBoard ? 'Saving...' : 'Save board customization'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
                {BOARD_SKINS.map((item) => {
                  const preview = resolveBoardAppearance(item.id, selectedBoardColor, null);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBoardTheme(item.id)}
                      className={`rounded-[1.1rem] border p-2 text-left transition sm:rounded-[1.5rem] sm:p-3 ${
                        selectedBoardTheme === item.id
                          ? 'border-slate-950 bg-slate-950 text-white shadow-lg'
                          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md'
                      }`}
                    >
                      <div className="h-14 rounded-[0.9rem] border border-black/10 sm:h-24 sm:rounded-[1.1rem]" style={preview.previewStyle} />
                      <div className="mt-3 font-black">{item.name}</div>
                      <div className={`mt-1 text-sm ${selectedBoardTheme === item.id ? 'text-white/75' : 'text-slate-500'}`}>
                        {preview.boardColor}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-3 sm:rounded-[1.75rem] sm:p-4">
                <div className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Custom Color</div>
                <BoardColorPicker value={selectedBoardColor} onChange={setSelectedBoardColor} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="tiles">
            <div className="mb-3 flex items-center justify-between gap-3 pr-4">
              <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500" htmlFor="appearance-tile-collection">
                Collection
              </label>
              <select
                id="appearance-tile-collection"
                value={tileCollectionFilter}
                onChange={(event) => setTileCollectionFilter(event.target.value)}
                className="h-10 min-w-48 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">All collections</option>
                {TILE_COLLECTIONS.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>
            </div>
            <ScrollArea className="h-96">
              <div className="grid grid-cols-2 gap-4 pr-4 sm:grid-cols-3">
                {visibleTileSets.map((item) => {
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
                          sizes="5rem"
                          className={`object-cover ${!isOwned ? 'opacity-90 saturate-90' : ''}`}
                        />
                        {!isUnlocked && (
                          <div className="pointer-events-none absolute inset-0">
                            <div className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/60 bg-white/70 shadow-md backdrop-blur-[1px]">
                              <Lock className="h-4 w-4 text-slate-700/80" />
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
        </Tabs>
      </div>
    </div>
  );
}
