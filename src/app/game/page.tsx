'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import GameBoard from '@/components/game/game-board';
import type { PlacedTile, Tile } from '@/lib/game/types';
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
import { useToast } from '@/hooks/use-toast';
import { suggestWord } from '@/ai/ai-suggest-word';
import BlankTileDialog from '@/components/game/blank-tile-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import ChatWindow, { ChatMessage } from '@/components/game/chat-window';
import { PlaceHolderImages } from '@/lib/placeholder-images';


// Main Game Component
function Game() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('game');
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const gameDocRef = useMemoFirebase(() => {
    return firestore && gameId ? doc(firestore, 'games', gameId) : null;
  }, [firestore, gameId]);
  
  const { data: game, isLoading: gameLoading } = useDoc<any>(gameDocRef);

  const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>([]);
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeSelection, setExchangeSelection] = useState<number[]>([]);
  const [blankTileDialog, setBlankTileDialog] = useState<{isOpen: boolean, pendingTileIndex: number | null}>({isOpen: false, pendingTileIndex: null});
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isPlayerTurn = user && game ? game.currentTurn === user.uid : false;

  useEffect(() => {
    if (game && user) {
        const userPlayerData = game.playerData[user.uid];
        if (userPlayerData) {
            setPlayerTiles(userPlayerData.tiles.slice(0, 7));
        }
    }
  }, [game, user]);

  const handleTileSelect = (index: number) => {
    if (isExchanging) {
       setExchangeSelection(current => {
         if (current.includes(index)) {
           return current.filter(i => i !== index);
         }
         return [...current, index];
       });
    } else {
       if (!isPlayerTurn) return;
        setSelectedTileIndex(index === selectedTileIndex ? null : index);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedTileIndex === null || !isPlayerTurn) return;

    const tile = playerTiles[selectedTileIndex];
    if (tile) {
      if (tile.letter === ' ') { // It's a blank tile
         setPendingTiles(prev => [...prev, { ...tile, row, col, letter: '' }]);
         setPlayerTiles(prev => {
            const newTiles = [...prev];
            newTiles[selectedTileIndex] = null;
            return newTiles;
         });
         setSelectedTileIndex(null);
         setBlankTileDialog({ isOpen: true, pendingTileIndex: pendingTiles.length });

      } else {
        setPendingTiles(prev => [...prev, { ...tile, row, col }]);
        setPlayerTiles(prev => {
            const newTiles = [...prev];
            newTiles[selectedTileIndex] = null;
            return newTiles;
        });
        setSelectedTileIndex(null);
      }
    }
  };

  const handleRecallTile = (tileToRecall: PlacedTile) => {
    if (!isPlayerTurn) return;
    const firstEmptyIndex = playerTiles.findIndex(t => t === null);
    if (firstEmptyIndex !== -1) {
      setPlayerTiles(prev => {
        const newTiles = [...prev];
        // If it was a blank, recall it as a blank
        newTiles[firstEmptyIndex] = tileToRecall.isBlank ? { letter: ' ', score: 0 } : { letter: tileToRecall.letter, score: tileToRecall.score };
        return newTiles;
      });
      setPendingTiles(prev => prev.filter(t => !(t.row === tileToRecall.row && t.col === tileToRecall.col)));
    }
  };
  
  const handleRecallAll = () => {
    if (!isPlayerTurn) return;
    let newPlayerTiles = [...playerTiles];
    for (const tile of pendingTiles) {
      const firstEmptyIndex = newPlayerTiles.findIndex(t => t === null);
      if (firstEmptyIndex !== -1) {
         newPlayerTiles[firstEmptyIndex] = tile.isBlank ? { letter: ' ', score: 0 } : { letter: tile.letter, score: tile.score };
      }
    }
    setPlayerTiles(newPlayerTiles);
    setPendingTiles([]);
  };

  const handleShuffle = () => {
    if (!isPlayerTurn) return;
    const shuffled = [...playerTiles].sort(() => Math.random() - 0.5);
    setPlayerTiles(shuffled);
  };
  
  const opponentUid = useMemo(() => game?.players.find((p: string) => p !== user?.uid), [game, user]);

  const handlePlay = async () => {
    if (pendingTiles.length === 0 || !gameDocRef || !game || !user || !opponentUid) return;
    
    setIsSubmitting(true);

    try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/games/${gameId}/play`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pendingTiles }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Could not process your move.');
        }

        const result = await response.json();
        const scoredPoints = typeof result?.score === 'number' ? result.score : null;

        toast({
          title: 'Word Played!',
          description: scoredPoints !== null ? `You scored ${scoredPoints} points!` : 'Move submitted successfully.',
        });
        setPendingTiles([]);

    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not process your move.' });
        if(gameDocRef) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
            requestResourceData: { pendingTiles },
          }));
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePass = async () => {
    if (!gameId || !user || !opponentUid) return;
    setIsSubmitting(true);
     try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/games/${gameId}/pass`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Could not pass turn.');
        }

        toast({ title: 'Turn Passed', description: "It's now your opponent's turn." });

    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not pass turn.' });
         if(gameDocRef) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
          }));
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleExchange = async () => {
     if (exchangeSelection.length === 0 || !game || !user || !gameId) return;

     if (game.tileBag.length < 7) {
        toast({ variant: 'destructive', title: 'Cannot Exchange', description: 'Not enough tiles left in the bag to exchange.' });
        return;
     }

     const tilesToExchange = exchangeSelection.map(index => playerTiles[index]!).filter(Boolean) as Tile[];
     if (tilesToExchange.length === 0) return;

     setIsSubmitting(true);
     try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/games/${gameId}/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tiles: tilesToExchange }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || 'Could not exchange tiles.');
        }

        toast({ title: 'Tiles Exchanged', description: `You exchanged ${tilesToExchange.length} tiles. It's now your opponent's turn.` });
        setExchangeSelection([]);
        setIsExchanging(false);
     } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not exchange tiles.' });
        if(gameDocRef) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
            requestResourceData: { tiles: tilesToExchange },
          }));
        }
     } finally {
        setIsSubmitting(false);
     }
  };

  const handleHint = async () => {
    if (!game || !user) return;
    setIsGettingHint(true);
    try {
        const boardStateForAI = JSON.stringify(game.board);
        const playerTilesForAI = playerTiles.map(t => t?.letter).join('');
        const result = await suggestWord({ tiles: playerTilesForAI, boardState: boardStateForAI });
        
        toast({
            title: 'AI Word Suggestion',
            description: `How about playing: ${result.suggestions[0] || 'Hmm, I am stumped...'}`
        });

        if (gameId) {
          const token = await user.getIdToken();
          const response = await fetch(`/api/games/${gameId}/hint`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to record hint usage.');
          }
        }

    } catch (e) {
        toast({ variant: 'destructive', title: 'Hint Error', description: 'Could not get a hint at this time.' });
    } finally {
        setIsGettingHint(false);
    }
  };

  const handleBlankTileSelect = (letter: string) => {
    if (blankTileDialog.pendingTileIndex !== null) {
        const tileToUpdateIndex = blankTileDialog.pendingTileIndex;
        setPendingTiles(prev => {
            const newTiles = [...prev];
            const tileToUpdate = newTiles[tileToUpdateIndex];
            if(tileToUpdate) {
                newTiles[tileToUpdateIndex] = { ...tileToUpdate, letter: letter.toUpperCase(), isBlank: true };
            }
            return newTiles;
        });
    }
    setBlankTileDialog({ isOpen: false, pendingTileIndex: null });
  };
  
  const handleSendMessage = async (text: string) => {
    if (!gameId || !game || !user) return;

    const newMessage: ChatMessage = {
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      text: text,
      timestamp: new Date(),
    };

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/games/${gameId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, senderName: newMessage.senderName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Could not send message.');
      }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Send Error', description: e.message || 'Could not send message.' });
        if(gameDocRef) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
            requestResourceData: { message: newMessage.text },
          }));
        }
    }
  };

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
              placedTiles={game.board} 
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
            onDragStart={(tile, index) => {
              if (!isExchanging) {
                  setSelectedTileIndex(index);
              }
            }}
            onDrop={(targetIndex) => {
              if (selectedTileIndex !== null) {
                  const newTiles = [...playerTiles];
                  const draggedTile = newTiles[selectedTileIndex];
                  
                  // Erase from original position
                  newTiles[selectedTileIndex] = null;
                  // Place temp tile at target to maintain order
                  const temp = newTiles[targetIndex];
                  newTiles[targetIndex] = draggedTile;

                  // Find original empty spot and place temp
                  const originalEmptyIndex = newTiles.indexOf(null);
                  if (originalEmptyIndex !== -1) {
                      newTiles[originalEmptyIndex] = temp;
                  }

                  setPlayerTiles(newTiles);
                  setSelectedTileIndex(null); // Or targetIndex
              }
            }}
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
                  setBlankTileDialog({isOpen: false, pendingTileIndex: null});
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
