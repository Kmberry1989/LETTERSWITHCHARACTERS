'use client';

import React, { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import GameBoard from '@/components/game/game-board';
import TileRack from '@/components/game/tile-rack';
import Scoreboard from '@/components/game/scoreboard';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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


// Main Game Component
function Game() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('game');
  const firestore = useFirestore();
  const { user } = useUser();

  const gameDocRef = useMemoFirebase(() => {
    return firestore && gameId ? doc(firestore, 'games', gameId) : null;
  }, [firestore, gameId]);

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
    handleBlankTileSelect,
    handleSendMessage,
    handleDragStart,
    handleDrop,
    setIsExchanging
  } = useGameState(gameId, user, game);

  if (gameLoading || !user) {
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

  const userPlayerData = game.playerData[user.uid];
  const opponentPlayerData = opponentUid ? game.playerData[opponentUid] : null;


  return (
    <AppLayout>
      <div className="flex h-full flex-col items-center p-4">
        <div className="w-full max-w-4xl flex flex-col gap-4">
          {userPlayerData && opponentPlayerData && (
            <Scoreboard
              players={[
                { displayName: userPlayerData.displayName, score: userPlayerData.score, avatarId: userPlayerData.avatarId, photoURL: userPlayerData.photoURL },
                { displayName: opponentPlayerData.displayName, score: opponentPlayerData.score, avatarId: opponentPlayerData.avatarId, photoURL: opponentPlayerData.photoURL },
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
              onDrop={(row, col) => handleCellClick(row, col)}
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

          {/* Action Dialogs */}
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
              handleRecallAll(); // Recall tiles if dialog is closed without selection
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


// Suspense boundary for client components that use searchParams
export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Game />
    </Suspense>
  );
}
