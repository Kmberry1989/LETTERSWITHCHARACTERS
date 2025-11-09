'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/app-layout';
import GameBoard, { PlacedTile, Tile } from '@/components/game/game-board';
import TileRack from '@/components/game/tile-rack';
import Scoreboard from '@/components/game/scoreboard';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
import { calculateScore, getWordsFromPlacedTiles } from '@/lib/scoring';
import { validateWord } from '@/ai/validate-word';
import { suggestWord } from '@/ai/ai-suggest-word';
import { drawTiles } from '@/lib/game-logic';
import BlankTileDialog from '@/components/game/blank-tile-dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import ChatWindow, { ChatMessage } from '@/components/game/chat-window';


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
    if (pendingTiles.length === 0 || !gameDocRef || !game || !user) return;
    
    setIsSubmitting(true);

    const formedWordsInfo = getWordsFromPlacedTiles(pendingTiles, game.board);
    if (formedWordsInfo.length === 0 && pendingTiles.length > 1) {
        toast({ variant: 'destructive', title: 'Invalid Placement', description: 'Tiles must form a single continuous line.'});
        setIsSubmitting(false);
        return;
    }

    try {
        for (const wordInfo of formedWordsInfo) {
            const { isValid, reason } = await validateWord({ word: wordInfo.word });
            if (!isValid) {
                toast({ variant: 'destructive', title: 'Invalid Word', description: `"${wordInfo.word}" is not a valid word. ${reason}` });
                setIsSubmitting(false);
                return;
            }
        }

        const score = calculateScore(pendingTiles, game.board);
        const newBoard = { ...game.board };
        pendingTiles.forEach(tile => {
            newBoard[`${tile.row}-${tile.col}`] = { letter: tile.letter, score: tile.score, isBlank: tile.isBlank };
        });

        const tilesToDrawCount = pendingTiles.length;
        const [newTilesForPlayer, updatedTileBag] = drawTiles(game.tileBag, tilesToDrawCount);

        const currentTiles = playerTiles.filter(t => t !== null) as Tile[];
        const finalPlayerTiles = [...currentTiles, ...newTilesForPlayer];

        const updatePayload = {
            board: newBoard,
            tileBag: updatedTileBag,
            [`playerData.${user.uid}.score`]: game.playerData[user.uid].score + score,
            [`playerData.${user.uid}.tiles`]: finalPlayerTiles,
            currentTurn: opponentUid,
            consecutivePasses: 0,
        };

        await updateDoc(gameDocRef, updatePayload);

        toast({ title: 'Word Played!', description: `You scored ${score} points!` });
        setPendingTiles([]);

    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not process your move.' });
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

  const handlePass = async () => {
    if (!gameDocRef || !game || !user) return;
    setIsSubmitting(true);
     try {
        const consecutivePasses = (game.consecutivePasses || 0) + 1;
        let updatePayload: any = {
            currentTurn: opponentUid,
            consecutivePasses: consecutivePasses,
        };

        // End game logic
        if (consecutivePasses >= 2) {
            updatePayload.status = 'finished';
            // Determine winner
            const p1Score = game.playerData[user.uid].score;
            const p2Score = game.playerData[opponentUid].score;
            updatePayload.winner = p1Score > p2Score ? user.uid : p2Score > p1Score ? opponentUid : 'draw';
        }

        await updateDoc(gameDocRef, updatePayload);
        toast({ title: 'Turn Passed', description: "It's now your opponent's turn." });

    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not pass turn.' });
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
     if (exchangeSelection.length === 0 || !gameDocRef || !game || !user) return;

     if (game.tileBag.length < 7) {
        toast({ variant: 'destructive', title: 'Cannot Exchange', description: 'Not enough tiles left in the bag to exchange.' });
        return;
     }

     setIsSubmitting(true);
     try {
        // Get tiles to exchange from player's hand
        const tilesToExchange = exchangeSelection.map(index => playerTiles[index]!).filter(Boolean) as Tile[];
        
        // Get remaining tiles from player's hand
        const remainingPlayerTiles = playerTiles.filter((_, index) => !exchangeSelection.includes(index)).filter(Boolean) as Tile[];

        // Draw new tiles from the bag
        const [newTilesForPlayer, tileBagAfterDraw] = drawTiles(game.tileBag, tilesToExchange.length);

        // Add exchanged tiles back to the bag and shuffle
        const finalTileBag = [...tileBagAfterDraw, ...tilesToExchange].sort(() => Math.random() - 0.5);

        const finalPlayerTiles = [...remainingPlayerTiles, ...newTilesForPlayer];
        
        const updatePayload = {
            tileBag: finalTileBag,
            [`playerData.${user.uid}.tiles`]: finalPlayerTiles,
            currentTurn: opponentUid,
            consecutivePasses: 0,
        };

        await updateDoc(gameDocRef, updatePayload);

        toast({ title: 'Tiles Exchanged', description: `You exchanged ${tilesToExchange.length} tiles. It's now your opponent's turn.` });
        setExchangeSelection([]);
        setIsExchanging(false);
     } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not exchange tiles.' });
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

        if (gameDocRef) {
          await updateDoc(gameDocRef, {
             [`playerData.${user.uid}.hintUsed`]: true
          });
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
    if (!gameDocRef || !game || !user) return;

    const newMessage: ChatMessage = {
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      text: text,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...(game.messages || []), newMessage];

    try {
      await updateDoc(gameDocRef, { messages: updatedMessages });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Send Error', description: 'Could not send message.' });
        if(gameDocRef) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
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
  const opponentPlayerData = game.playerData[opponentUid];


  return (
    <AppLayout>
      <div className="flex h-full flex-col items-center p-4">
        <div className="w-full max-w-4xl flex flex-col gap-4">
          <Scoreboard
            players={[
              { displayName: userPlayerData.displayName, score: userPlayerData.score, avatarId: userPlayerData.avatarId, photoURL: userPlayerData.photoURL },
              { displayName: opponentPlayerData.displayName, score: opponentPlayerData.score, avatarId: opponentPlayerData.avatarId, photoURL: opponentPlayerData.photoURL },
            ]}
            isPlayerTurn={isPlayerTurn}
            currentPlayerName={userPlayerData.displayName}
            gameStatus={game.status}
          />

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
            hintUsed={userPlayerData.hintUsed || false}
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
