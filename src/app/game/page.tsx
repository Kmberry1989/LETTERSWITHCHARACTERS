'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import GameBoard from '@/components/game/game-board';
import TileRack from '@/components/game/tile-rack';
import Scoreboard from '@/components/game/scoreboard';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from '@/lib/client/document-client';
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

function Game() {
  const botTurnRequestRef = useRef<string | null>(null);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const searchParams = useSearchParams();
  const gameId = searchParams.get('game');
  const { user, isUserLoading, canPlay } = usePlayableGate();

  const gameDocRef = useMemoFirebase(() => {
    return gameId ? doc(null, 'games', gameId) : null;
  }, [gameId]);

  const { data: game, isLoading: gameLoading } = useDoc<any>(gameDocRef);

  const {
    board,
    playerTiles,
    pendingTiles,
    selectedTileIndex,
    isSubmitting,
    isGettingHint,
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
    handleRecallTile,
    handleRecallAll,
    handleShuffle,
    handlePlay,
    handlePass,
    handleExchange,
    handleHint,
    handleSendMessage,
    handleBlankTileSelect,
    handleDragStart,
    handleDrop,
    handleBoardDrop,
    setIsExchanging
  } = useGameState(gameId, user, game);

  const userPlayerData = user && game ? game.playerData[user.uid] : null;
  const opponentPlayerData = game && opponentUid ? game.playerData[opponentUid] : null;
  const isBotGame = Boolean(game?.players.includes('bitty-botty-001'));

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
        });
      } catch (error) {
        console.error('Failed to trigger bot move:', error);
        botTurnRequestRef.current = null;
      }
    };

    void runBotTurn();
  }, [gameId, game, isBotGame]);

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
      <div className="flex h-full flex-col items-center p-4">
        <div className="w-full max-w-4xl flex flex-col gap-4">
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

          <div className="w-full max-w-[600px] self-center">
            <GameBoard
              placedTiles={board}
              pendingTiles={pendingTiles}
              onCellClick={handleCellClick}
              onRecallTile={handleRecallTile}
              onDrop={handleBoardDrop}
            />
          </div>

          <TileRack
            tiles={playerTiles}
            selectedTileIndex={selectedTileIndex}
            isPlayerTurn={isPlayerTurn}
            isSubmitting={isSubmitting}
            isGettingHint={isGettingHint}
            hintUsed={userPlayerData?.hintUsed || false}
            isExchanging={isExchanging}
            exchangeSelection={exchangeSelection}
            onTileSelect={handleTileSelect}
            onRecall={handleRecallAll}
            onShuffle={handleShuffle}
            onPlay={handlePlay}
            onHint={handleHint}
            onChatClick={() => setIsChatOpen(true)}
            onToggleExchange={() => setIsExchanging(!isExchanging)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />

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
