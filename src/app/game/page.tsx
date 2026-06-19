'use client';

import React, { Suspense, useEffect, useRef } from 'react';

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
import { useGameState } from '@/hooks/use-game-state';
import { usePlayableGate } from '@/hooks/use-playable-gate';
import { useBerries } from '@/hooks/use-berries';
import { useToast } from '@/hooks/use-toast';
import { useTurnNotifications } from '@/hooks/use-turn-notifications';

function Game() {
  const botTurnRequestRef = useRef<string | null>(null);
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
      <AppLayout mode="play">
        <div className="h-[100svh] space-y-4 overflow-hidden p-4 select-none">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!game) {
    return (
      <AppLayout mode="play">
        <div className="flex h-[100svh] flex-col items-center justify-center overflow-hidden p-4 text-center select-none">
          <h2 className="text-xl font-semibold">Game not found</h2>
          <p className="text-muted-foreground">The game you are looking for does not exist or has been deleted.</p>
          <Button asChild className="mt-4"><a href="/dashboard">Go to Dashboard</a></Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout mode="play">
      <div className="game-screen-pattern flex h-full min-h-0 min-w-0 touch-none select-none flex-col items-center overflow-hidden overscroll-none px-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-12 md:px-5 md:pb-5 md:pt-5">
        <div className="flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 md:gap-4">
          {userPlayerData && opponentPlayerData && (
            <div className="hidden shrink-0 md:block">
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
            </div>
          )}

          <div className="min-h-0 w-full max-w-[1040px] flex-1 self-center">
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

          <div className="shrink-0 touch-none rounded-2xl bg-background/85 p-1 backdrop-blur md:bg-transparent md:p-0 md:backdrop-blur-0">
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
