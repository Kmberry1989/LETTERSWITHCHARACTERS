'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GameBoard, { PlacedTile, Tile } from '@/components/game/game-board';
import Scoreboard from '@/components/game/scoreboard';
import TileRack from '@/components/game/tile-rack';
import ChatWindow, { ChatMessage } from '@/components/game/chat-window';
import BlankTileDialog from '@/components/game/blank-tile-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useAudio } from '@/hooks/use-audio';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cat, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useDoc, useUser, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { drawTiles } from '@/lib/game-logic';
import { calculateScore, getWordsFromPlacedTiles } from '@/lib/scoring';
import { validateWord } from '@/ai/validate-word';
import { suggestWord } from '@/ai/ai-suggest-word';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
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
} from "@/components/ui/alert-dialog"

interface PlayerData {
  displayName: string;
  score: number;
  avatarId: string;
  tiles: (Tile | null)[];
  hintUsed: boolean;
}

interface Game {
  id: string;
  players: string[];
  playerData: { [uid: string]: PlayerData };
  board: { [key: string]: Tile };
  tileBag: Tile[];
  currentTurn: string;
  status: 'active' | 'pending' | 'finished';
  consecutivePasses?: number;
  winner?: string;
  messages?: ChatMessage[];
}


function GameInstance({ game }: { game: Game }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);
  const [draggedTile, setDraggedTile] = useState<{ tile: Tile; index: number } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { playSfx } = useAudio();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingHint, setIsGettingHint] = useState(false);
  const [blankTileData, setBlankTileData] = useState<{ row: number; col: number; index: number | null } | null>(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeSelection, setExchangeSelection] = useState<number[]>([]);


  useEffect(() => {
    if (user && game) {
      const userTiles = game.playerData[user.uid]?.tiles || [];
       // Ensure the rack has 7 slots, filling empty ones with null
      const rackTiles = Array(7).fill(null).map((_, i) => userTiles[i] || null);
      setPlayerTiles(rackTiles);
    }
  }, [game, user]);


  if (!user) return <GameLoadingSkeleton />;

  const isPlayerTurn = game.currentTurn === user.uid && game.status === 'active';
  const opponentUid = game.players.find(p => p !== user.uid) || '';
  const currentPlayer = game.playerData[user.uid];
  const opponentPlayer = game.playerData[opponentUid];
  const players = [currentPlayer, opponentPlayer];
  const isGameOver = game.status === 'finished';
  const winner = isGameOver && game.winner ? game.playerData[game.winner] : null;


  const handleTileSelect = (index: number) => {
    if (isGameOver) return;
    if (isExchanging) {
      setExchangeSelection(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
      playSfx('click');
      return;
    }

    if (playerTiles[index]) {
      if (selectedTileIndex === index) {
        setSelectedTileIndex(null);
      } else {
        setSelectedTileIndex(index);
        playSfx('click');
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (isGameOver) return;
    if (selectedTileIndex !== null) {
      const tileToPlace = playerTiles[selectedTileIndex];
      if (tileToPlace) {
        if (tileToPlace.letter === ' ') {
          setBlankTileData({ row, col, index: selectedTileIndex });
          return;
        }
        setPendingTiles([...pendingTiles, { ...tileToPlace, row, col }]);
        const newPlayerTiles = [...playerTiles];
        newPlayerTiles[selectedTileIndex] = null;
        setPlayerTiles(newPlayerTiles);
        setSelectedTileIndex(null);
        playSfx('place');
      }
    }
  };

  const handleDragStart = (tile: Tile, index: number) => {
    if (isGameOver || isExchanging) return;
    setDraggedTile({ tile, index });
    if (selectedTileIndex !== null) {
      setSelectedTileIndex(null);
    }
  };

  const handleDropOnBoard = (row: number, col: number) => {
    if (isGameOver || isExchanging) return;
    if (draggedTile) {
      const isOccupied =
        pendingTiles.some((t) => t.row === row && t.col === col) ||
        game.board[`${row}-${col}`];

      if (!isOccupied) {
        if (draggedTile.tile.letter === ' ') {
          setBlankTileData({ row, col, index: draggedTile.index });
          setDraggedTile(null);
          return;
        }
        setPendingTiles([...pendingTiles, { ...draggedTile.tile, row, col }]);
        const newPlayerTiles = [...playerTiles];
        newPlayerTiles[draggedTile.index] = null;
        setPlayerTiles(newPlayerTiles);
        playSfx('place');
      }
    }
    setDraggedTile(null);
  };

  const handleBlankTileSelect = (letter: string) => {
    if (blankTileData) {
      const { row, col, index } = blankTileData;
      const blankTile: PlacedTile = { letter, score: 0, isBlank: true, row, col };
      setPendingTiles([...pendingTiles, blankTile]);

      if (index !== null) {
        const newPlayerTiles = [...playerTiles];
        newPlayerTiles[index] = null;
        setPlayerTiles(newPlayerTiles);
      }
      setBlankTileData(null);
      setSelectedTileIndex(null);
      playSfx('place');
    }
  };

  const handleDropOnRack = (dropIndex: number) => {
    if (isGameOver || isExchanging || draggedTile === null) return;

    const newPlayerTiles = [...playerTiles];
    if (newPlayerTiles[dropIndex] === null) {
      newPlayerTiles[dropIndex] = draggedTile.tile;
      newPlayerTiles[draggedTile.index] = null;
    } else {
      const tileAtDropIndex = newPlayerTiles[dropIndex];
      newPlayerTiles[dropIndex] = draggedTile.tile;
      newPlayerTiles[draggedTile.index] = tileAtDropIndex;
    }

    setPlayerTiles(newPlayerTiles);
    setDraggedTile(null);
    playSfx('click');
  };

  const handleRecallAll = () => {
    if (pendingTiles.length === 0) return;
    const newPlayerTiles = [...playerTiles];
    pendingTiles.forEach((pendingTile) => {
      const emptyIndex = newPlayerTiles.findIndex((t) => t === null);
      if (emptyIndex !== -1) {
        // When recalling a blank, it becomes a blank again
        const originalTile = pendingTile.isBlank ? { letter: ' ', score: 0 } : { letter: pendingTile.letter, score: pendingTile.score };
        newPlayerTiles[emptyIndex] = originalTile;
      }
    });
    setPlayerTiles(newPlayerTiles);
    setPendingTiles([]);
    playSfx('swoosh');
  };

  const handleRecallTile = (tileToRecall: PlacedTile) => {
    const newPlayerTiles = [...playerTiles];
    const emptyIndex = newPlayerTiles.findIndex((t) => t === null);
    if (emptyIndex !== -1) {
      const originalTile = tileToRecall.isBlank ? { letter: ' ', score: 0 } : { letter: tileToRecall.letter, score: tileToRecall.score };
      newPlayerTiles[emptyIndex] = originalTile;
    }
    const newPendingTiles = pendingTiles.filter(
      (pt) => !(pt.row === tileToRecall.row && pt.col === tileToRecall.col)
    );
    setPlayerTiles(newPlayerTiles);
    setPendingTiles(newPendingTiles);
    playSfx('swoosh');
  };

  const handleShuffle = () => {
    const shuffledTiles = [...playerTiles].filter((t) => t !== null) as Tile[];
    for (let i = shuffledTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTiles[i], shuffledTiles[j]] = [shuffledTiles[j], shuffledTiles[i]];
    }
    const newPlayerTiles = [...playerTiles];
    let tileIndex = 0;
    for (let i = 0; i < newPlayerTiles.length; i++) {
      if (newPlayerTiles[i] !== null) {
        newPlayerTiles[i] = shuffledTiles[tileIndex++];
      }
    }
    setPlayerTiles(newPlayerTiles);
    playSfx('swoosh');
  };
  
  const handleSendMessage = (text: string) => {
    if (!firestore || !user) return;
    const gameDocRef = doc(firestore, 'games', game.id);
    const newMessage: ChatMessage = {
      senderId: user.uid,
      senderName: user.displayName || 'Player',
      text: text,
      timestamp: new Date(),
    };

    updateDoc(gameDocRef, {
        messages: arrayUnion(newMessage)
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: gameDocRef.path,
            operation: 'update',
            requestResourceData: { messages: [newMessage] },
          } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
    });
  };
  
  const endGame = async (finishingPlayerId: string | null) => {
    if (!firestore) return;

    let finalPlayer1Score = currentPlayer.score;
    let finalPlayer2Score = opponentPlayer.score;
    let winnerId = '';
    
    // Calculate final score adjustments based on remaining tiles
    if (finishingPlayerId) {
      const p1Tiles = playerTiles.filter(t => t !== null) as Tile[];
      const p2Tiles = opponentPlayer.tiles.filter(t => t !== null) as Tile[];
      
      const p1RemainingValue = p1Tiles.reduce((sum, tile) => sum + tile.score, 0);
      const p2RemainingValue = p2Tiles.reduce((sum, tile) => sum + tile.score, 0);

      if (user.uid === finishingPlayerId) { // Player 1 finished
        finalPlayer1Score += p2RemainingValue;
        finalPlayer2Score -= p2RemainingValue;
      } else { // Player 2 finished
        finalPlayer2Score += p1RemainingValue;
        finalPlayer1Score -= p1RemainingValue;
      }
    }

    if (finalPlayer1Score > finalPlayer2Score) {
        winnerId = user.uid;
    } else if (finalPlayer2Score > finalPlayer1Score) {
        winnerId = opponentUid;
    } // If scores are equal, it's a draw, winnerId remains empty

    const gameDocRef = doc(firestore, 'games', game.id);
    const updatePayload = {
      status: 'finished' as const,
      [`playerData.${user.uid}.score`]: finalPlayer1Score,
      [`playerData.${opponentUid}.score`]: finalPlayer2Score,
      winner: winnerId,
    };
    updateDoc(gameDocRef, updatePayload).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
          path: gameDocRef.path,
          operation: 'update',
          requestResourceData: updatePayload,
        } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
  };


  const handlePlayWord = async () => {
    if (pendingTiles.length === 0 || !isPlayerTurn || !firestore || isSubmitting) return;

    setIsSubmitting(true);

    const words = getWordsFromPlacedTiles(pendingTiles, game.board);
    if (words.length === 0) {
      toast({ variant: 'destructive', title: 'Invalid placement', description: 'Tiles must form a word.' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Validate all words found
      for (const word of words) {
        const validation = await validateWord({ word: word.word });
        if (!validation.isValid) {
          toast({
            variant: 'destructive',
            title: 'Invalid Word',
            description: `"${word.word.toUpperCase()}" is not a valid word. ${validation.reason}`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate score
      const score = calculateScore(pendingTiles, game.board);
      
      const newBoard = { ...game.board };
      pendingTiles.forEach(tile => {
        newBoard[`${tile.row}-${tile.col}`] = { letter: tile.letter, score: tile.score, isBlank: tile.isBlank };
      });
  
      const tilesToDraw = pendingTiles.length;
      const remainingPlayerTiles = playerTiles.filter(t => t !== null) as Tile[];
      const [newTiles, updatedTileBag] = drawTiles(game.tileBag, tilesToDraw);
      const updatedPlayerTiles = [...remainingPlayerTiles, ...newTiles];
      const newScore = (currentPlayer.score || 0) + score;
  
      // Check for game end condition (player uses last tile and bag is empty)
      if (updatedPlayerTiles.length === 0 && updatedTileBag.length === 0) {
        await endGame(user.uid);
        setIsSubmitting(false);
        return; // End the function here
      }

      const gameDocRef = doc(firestore, 'games', game.id);
      const updatePayload = {
        board: newBoard,
        tileBag: updatedTileBag,
        [`playerData.${user.uid}.tiles`]: updatedPlayerTiles,
        [`playerData.${user.uid}.score`]: newScore,
        currentTurn: opponentUid,
        consecutivePasses: 0,
      };
  
      updateDoc(gameDocRef, updatePayload)
        .then(() => {
            setPendingTiles([]);
            playSfx('place');
            toast({ title: 'Word Played!', description: `You scored ${score} points!` });
        })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: gameDocRef.path,
                operation: 'update',
                requestResourceData: updatePayload,
              } satisfies SecurityRuleContext);
    
            errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not play word.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    if (!isPlayerTurn || isGettingHint || !firestore) return;
    if (currentPlayer.hintUsed) {
        toast({
            variant: "destructive",
            title: "Hint Already Used",
            description: "You can only use one hint per game.",
        });
        return;
    }

    setIsGettingHint(true);
    try {
      const currentTiles = playerTiles.map(t => t?.letter || '').join('');
      // This is a simplified representation. A more complex one could include positions.
      const boardState = Object.keys(game.board).length > 0
        ? `Board has tiles: ${Object.values(game.board).map(t => t.letter).join(', ')}`
        : "The board is empty.";

      const result = await suggestWord({ tiles: currentTiles, boardState });
      
      if (result.suggestions && result.suggestions.length > 0) {
        toast({
          title: 'AI Word Suggestions',
          description: `How about: ${result.suggestions.slice(0, 3).join(', ')}?`,
        });
        // Mark hint as used
        const gameDocRef = doc(firestore, 'games', game.id);
        const updatePayload = { [`playerData.${user.uid}.hintUsed`]: true };
        updateDoc(gameDocRef, updatePayload).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: gameDocRef.path,
                operation: 'update',
                requestResourceData: updatePayload,
              } satisfies SecurityRuleContext);
    
            errorEmitter.emit('permission-error', permissionError);
        });

      } else {
        toast({
          title: 'No suggestions found',
          description: 'The AI could not find any words with your current tiles.',
        });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not get a hint.' });
    } finally {
      setIsGettingHint(false);
    }
  };

  const handleToggleExchange = () => {
    if (!isPlayerTurn) return;
    handleRecallAll(); // Recall any pending tiles
    setIsExchanging(!isExchanging);
    setExchangeSelection([]); // Clear selection on toggle
    setSelectedTileIndex(null); // Deselect any tile
  };

  const handlePassTurn = async () => {
    if (!isPlayerTurn || !firestore || isSubmitting) return;
    
    // Game end condition: 2 consecutive passes
    const newConsecutivePasses = (game.consecutivePasses || 0) + 1;
    if (newConsecutivePasses >= 2) {
      await endGame(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const gameDocRef = doc(firestore, 'games', game.id);
      const updatePayload = {
        currentTurn: opponentUid,
        consecutivePasses: newConsecutivePasses,
      };
      await updateDoc(gameDocRef, updatePayload);
      toast({ title: 'Turn Passed', description: "It's now your opponent's turn." });
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: doc(firestore, 'games', game.id).path,
        operation: 'update',
        requestResourceData: { currentTurn: opponentUid },
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not pass turn.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExchangeTiles = async () => {
    if (!isPlayerTurn || !firestore || isSubmitting || exchangeSelection.length === 0) return;
    if (game.tileBag.length < exchangeSelection.length) {
      toast({ variant: 'destructive', title: 'Not enough tiles in bag', description: `There are only ${game.tileBag.length} tiles left.`});
      return;
    }

    setIsSubmitting(true);
    try {
      // Tiles to return to the bag
      const tilesToReturn = exchangeSelection.map(index => playerTiles[index]!).filter(Boolean) as Tile[];
      
      // New tiles to draw
      const [newTiles, bagAfterDraw] = drawTiles(game.tileBag, tilesToReturn.length);

      // Return old tiles to bag and shuffle
      const newBag = [...bagAfterDraw, ...tilesToReturn];
      for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
      }

      // Create updated player tiles
      const updatedPlayerTiles = playerTiles
        .filter((_, index) => !exchangeSelection.includes(index))
        .concat(newTiles);
      
      // Fill remaining slots with null if any
      while(updatedPlayerTiles.length < 7) {
        updatedPlayerTiles.push(null);
      }

      const gameDocRef = doc(firestore, 'games', game.id);
      const updatePayload = {
        tileBag: newBag,
        [`playerData.${user.uid}.tiles`]: updatedPlayerTiles,
        currentTurn: opponentUid,
        consecutivePasses: 0, // Reset passes on exchange
      };

      await updateDoc(gameDocRef, updatePayload);

      toast({ title: 'Tiles Exchanged', description: `You exchanged ${tilesToReturn.length} tiles.` });
      setIsExchanging(false);
      setExchangeSelection([]);

    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: doc(firestore, 'games', game.id).path,
        operation: 'update',
        requestResourceData: { info: "Tile exchange action" },
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not exchange tiles.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full p-4 sm:p-8 pt-24 sm:pt-24">
       <BlankTileDialog
        isOpen={!!blankTileData}
        onClose={() => setBlankTileData(null)}
        onSelect={handleBlankTileSelect}
      />
      <AlertDialog open={isGameOver}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center">
            <Trophy className="w-16 h-16 text-yellow-500" />
            <AlertDialogTitle className="text-3xl font-bold">
              {winner ? `${winner.displayName} Wins!` : "It's a Draw!"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              The game has ended. Here are the final scores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-around items-center py-4">
             <div className="text-center">
                <p className="font-bold text-lg">{currentPlayer.displayName}</p>
                <p className="text-2xl font-bold text-primary">{currentPlayer.score}</p>
             </div>
             <div className="text-2xl font-bold text-muted-foreground">VS</div>
              <div className="text-center">
                <p className="font-bold text-lg">{opponentPlayer.displayName}</p>
                <p className="text-2xl font-bold text-primary">{opponentPlayer.score}</p>
             </div>
          </div>
          <AlertDialogFooter>
            <Button asChild className="w-full">
                <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
            <div id="pass-turn-trigger" className="hidden"></div>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Pass Turn?</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to pass your turn? If both players pass consecutively, the game will end.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePassTurn}>Pass</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
       <AlertDialog>
        <AlertDialogTrigger asChild>
            <div id="exchange-tiles-trigger" className="hidden"></div>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Exchange {exchangeSelection.length} Tiles?</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to exchange these tiles? This will end your turn.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExchangeTiles}>Exchange</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>

       <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg px-4">
        <Scoreboard players={players} isPlayerTurn={isPlayerTurn} currentPlayerName={game.playerData[user.uid].displayName} gameStatus={game.status} />
      </div>

      <div className="flex-grow">
        <Card className="h-full shadow-sm">
          <CardContent className="p-2 sm:p-4 h-full flex items-center justify-center">
            <GameBoard
              placedTiles={game.board}
              pendingTiles={pendingTiles}
              onCellClick={isPlayerTurn ? handleCellClick : undefined}
              onDrop={isPlayerTurn ? handleDropOnBoard : undefined}
              onRecallTile={isPlayerTurn ? handleRecallTile : undefined}
            />
          </CardContent>
        </Card>
      </div>
      <div className="relative">
        <TileRack
          tiles={playerTiles}
          selectedTileIndex={selectedTileIndex}
          onTileSelect={handleTileSelect}
          onRecall={handleRecallAll}
          onShuffle={handleShuffle}
          onDragStart={handleDragStart}
          onDrop={handleDropOnRack}
          onChatClick={() => setIsChatOpen(true)}
          onPlay={handlePlayWord}
          onHint={handleGetHint}
          isPlayerTurn={isPlayerTurn}
          isSubmitting={isSubmitting}
          isGettingHint={isGettingHint}
          hintUsed={currentPlayer?.hintUsed || false}
          isExchanging={isExchanging}
          onToggleExchange={handleToggleExchange}
          exchangeSelection={exchangeSelection}
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
  );
}

function GameLoadingSkeleton() {
    return (
        <div className="flex flex-col gap-4 h-full p-4 sm:p-8 pt-24 sm:pt-24 animate-pulse">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg px-4">
                <Card><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
            </div>
            <div className="flex-grow">
                <Card className="h-full shadow-sm">
                <CardContent className="p-2 sm:p-4 h-full flex items-center justify-center">
                   <Skeleton className="w-full aspect-square max-w-full" />
                </CardContent>
                </Card>
            </div>
             <div className="relative">
                 <Card><CardContent className="p-4"><Skeleton className="h-28" /></CardContent></Card>
            </div>
        </div>
    )
}

function NoGameSelected() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <Cat className="w-24 h-24 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Game Selected</h2>
            <p className="mt-2 text-muted-foreground">Please select a game from your dashboard to begin.</p>
            <Button asChild className="mt-6">
                <Link href="/dashboard">
                    Go to Dashboard
                </Link>
            </Button>
        </div>
    );
}

function GamePageContent() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('game');

  if (!gameId) {
    return <NoGameSelected />;
  }

  const { data: game, loading, error } = useDoc<Game>(`games/${gameId}`);

  if (loading) {
    return <GameLoadingSkeleton />;
  }

  if (error || !game) {
    return <div>Error loading game or game not found.</div>;
  }
  
  return <GameInstance game={game} />;
}


export default function GamePage() {
  return (
    <main className="min-h-screen bg-background relative">
       <div className="absolute top-4 left-4 z-20">
          <Button asChild variant="outline" className="shadow-sm bg-white">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="w-full h-screen">
            <Suspense fallback={<GameLoadingSkeleton />}>
                <GamePageContent />
            </Suspense>
        </div>
    </main>
  );
}
