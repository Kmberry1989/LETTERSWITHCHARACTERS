'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import GameBoard from '@/components/game/game-board';
import BoardStage from '@/components/game/board-stage';
import BoardChrome from '@/components/game/board-chrome';
import TileRack from '@/components/game/tile-rack';
import Scoreboard from '@/components/game/scoreboard';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import BlankTileDialog from '@/components/game/blank-tile-dialog';
import ChatWindow from '@/components/game/chat-window';
import AudioSettings from '@/components/profile/audio-settings';
import { useGameState } from '@/hooks/use-game-state';
import { usePlayableGate } from '@/hooks/use-playable-gate';
import { Pause } from 'lucide-react';
import { useBerries } from '@/hooks/use-berries';
import { useToast } from '@/hooks/use-toast';
import { useTurnNotifications } from '@/hooks/use-turn-notifications';

function Game() {
  const botTurnRequestRef = useRef<string | null>(null);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const searchParams = useSearchParams();
  const gameId = searchParams.get('game');
  const { user, isUserLoading, canPlay } = usePlayableGate();
  const { equippedTileSetId } = useBerries();
  const { toast } = useToast();

  const gameDocRef = useMemoFirebase(() => {
    return gameId ? doc(null, 'games', gameId) : null;
  }, [gameId]);
  const userDocRef = useMemoFirebase(() => {
    return user ? doc(null, 'users', user.uid) : null;
  }, [user]);

  const { data: game, isLoading: gameLoading } = useDoc<any>(gameDocRef);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const {
    board,
    playerTiles,
    pendingTiles,
    selectedTileIndex,
    selectedPendingTileKey,
    isSubmitting,
    isExchanging,
    exchangeSelection,
    blankTileDialog,
    setBlankTileDialog,
    isChatOpen,
    setIsChatOpen,
    isPlayerTurn,
    opponentUid,
    handleTileSelect,
    handleCellClick,
    handlePendingTileSelect,
    handleRecallAll,
    handleShuffle,
    handlePlay,
    handlePass,
    handleExchange,
    handleSendMessage,
    handleBlankTileSelect,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleBoardDrop,
    setIsExchanging,
    shuffleTick,
    replenishedTileIndexes,
  } = useGameState(gameId, user, game, equippedTileSetId);

  const userPlayerData = user && game ? game.playerData[user.uid] : null;
  const opponentPlayerData = game && opponentUid ? game.playerData[opponentUid] : null;
  const isBotGame = Boolean(game?.players.includes('bitty-botty-001'));
  const opponentName = opponentPlayerData?.displayName || 'your opponent';

  useTurnNotifications({
    enabled: Boolean(user && game),
    isUsersTurn: Boolean(isPlayerTurn && game?.status === 'active'),
    title: 'Your turn',
    body: `It’s your move against ${opponentName}.`,
  });
  const ownerTileSetIds = game?.playerData
    ? Object.fromEntries(
        Object.entries(game.playerData).map(([uid, playerData]: [string, any]) => [
          uid,
          playerData?.equippedTileSetId || null,
        ])
      )
    : {};
  const selectedBoardThemeId = userProfile?.boardThemeId || user?.boardThemeId || 'board-green';
  const selectedBoardTintId = userProfile?.boardTintId || user?.boardTintId || null;
  const selectedBoardColor = userProfile?.boardColor || user?.boardColor || null;

  useEffect(() => {
    if (!gameId || !game || !isBotGame || game.status !== 'active') {
      botTurnRequestRef.current = null;
      return;
    }

    if (game.currentTurn !== 'bitty-botty-001') {
      botTurnRequestRef.current = null;
      return;
    }

    const turnKey = `${gameId}:${game.currentTurn}:${Object.keys(game.board).length}:${game.consecutivePasses ?? 0}`;
    if (botTurnRequestRef.current === turnKey) {
      return;
    }

    botTurnRequestRef.current = turnKey;

    const runBotTurn = async () => {
      try {
        await fetch(`/api/games/${gameId}/bot-move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ difficulty: game.difficulty || 'Medium' }),
        }).then(async (response) => {
          if (!response.ok) {
            const result = await response.json().catch(() => null);
            throw new Error(result?.error || 'Bot move is unavailable right now.');
          }
        });
      } catch (error) {
        console.error('Failed to trigger bot move:', error);
        toast({
          variant: 'destructive',
          title: 'Bot unavailable',
          description: error instanceof Error ? error.message : 'Bot play is unavailable right now.',
        });
        botTurnRequestRef.current = null;
      }
    };

    void runBotTurn();
  }, [gameId, game, isBotGame, toast]);

  if (gameLoading || isUserLoading || !user || !canPlay) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!game) {
    return (
      <AppLayout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold">Game not found</h2>
          <p className="text-muted-foreground">The game you are looking for does not exist or has been deleted.</p>
          <Button asChild className="mt-4"><a href="/dashboard">Go to Dashboard</a></Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-full flex-col items-center overflow-x-hidden p-2 sm:p-4">
        <div className="flex w-full max-w-4xl flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-end">
            <Dialog open={isPauseOpen} onOpenChange={setIsPauseOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 shadow-sm">
                  <Pause className="h-4 w-4" />
                  Pause & Audio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Pause Menu</DialogTitle>
                  <DialogDescription>
                    Adjust audio, review the next systems coming online, or step away from the board.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 md:grid-cols-[1.25fr_0.75fr]">
                  <AudioSettings />
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <h3 className="mb-3 font-semibold">Meta-board work in progress</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Wheel-of-fortune style bonus spaces after matches</li>
                      <li>• Avatar tokens that move around a long-form board</li>
                      <li>• Turn rewards from casual solo mini-games</li>
                      <li>• Penalties, boosts, and event tiles for the overall meta loop</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {userPlayerData && opponentPlayerData && (
            <Scoreboard
              players={[
                {
                  displayName: userPlayerData.displayName,
                  score: userPlayerData.score,
                  avatarId: userPlayerData.avatarId,
                  photoURL: userPlayerData.photoURL,
                  avatarPosterUrl: userPlayerData.avatarPosterUrl,
                },
                {
                  displayName: opponentPlayerData.displayName,
                  score: opponentPlayerData.score,
                  avatarId: opponentPlayerData.avatarId,
                  photoURL: opponentPlayerData.photoURL,
                  avatarPosterUrl: opponentPlayerData.avatarPosterUrl,
                },
              ]}
              isPlayerTurn={isPlayerTurn}
              currentPlayerName={userPlayerData.displayName}
              gameStatus={game.status}
            />
          )}

          <div className="w-full max-w-[860px] self-center">
            <BoardStage>
              <BoardChrome boardThemeId={selectedBoardThemeId} boardTintId={selectedBoardTintId} boardColor={selectedBoardColor}>
                <GameBoard
                  placedTiles={board}
                  pendingTiles={pendingTiles}
                  onCellClick={handleCellClick}
                  onPendingTileSelect={handlePendingTileSelect}
                  onDrop={handleBoardDrop}
                  tileSetId={equippedTileSetId}
                  ownerTileSetIds={ownerTileSetIds}
                  selectedPendingTileKey={selectedPendingTileKey}
                />
              </BoardChrome>
            </BoardStage>
          </div>

          <div className="sticky bottom-2 z-20 -mx-1 rounded-2xl bg-background/80 p-1 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
            <TileRack
              tiles={playerTiles}
              selectedTileIndex={selectedTileIndex}
              isPlayerTurn={isPlayerTurn}
              isSubmitting={isSubmitting}
              isExchanging={isExchanging}
              exchangeSelection={exchangeSelection}
              onTileSelect={handleTileSelect}
              onRecall={handleRecallAll}
              onShuffle={handleShuffle}
              onPlay={handlePlay}
              onChatClick={() => setIsChatOpen(true)}
              onToggleExchange={() => setIsExchanging(!isExchanging)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              tileSetId={equippedTileSetId}
              shuffleTick={shuffleTick}
              replenishedTileIndexes={replenishedTileIndexes}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button id="pass-turn-trigger" className="hidden">Pass</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to pass?</AlertDialogTitle>
                <AlertDialogDescription>
                  If both players pass consecutively, the game will end. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePass}>Yes, Pass Turn</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button id="exchange-tiles-trigger" className="hidden">Exchange</button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Exchange {exchangeSelection.length} tile(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will skip your turn. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleExchange}>Yes, Exchange</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <BlankTileDialog
            isOpen={blankTileDialog.isOpen}
            onClose={() => {
              setBlankTileDialog({ isOpen: false, pendingTileIndex: null });
              handleRecallAll();
            }}
            onSelect={handleBlankTileSelect}
          />

          <ChatWindow
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={game.messages || []}
            onSendMessage={handleSendMessage}
            currentUser={user}
          />
        </div>
      </div>
    </AppLayout>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Game />
    </Suspense>
  );
}
