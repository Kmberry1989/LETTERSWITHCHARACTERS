'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { suggestWord } from '@/ai/ai-suggest-word';
import { Tile, PlacedTile } from '@/lib/game/types';
import { ChatMessage } from '@/components/game/chat-window';

export function useGameState(gameId: string | null, user: any, game: any) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const gameDocRef = useMemoFirebase(() => {
        return firestore && gameId ? doc(firestore, 'games', gameId) : null;
    }, [firestore, gameId]);

    const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>([]);
    const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);
    const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGettingHint, setIsGettingHint] = useState(false);
    const [isExchanging, setIsExchanging] = useState(false);
    const [exchangeSelection, setExchangeSelection] = useState<number[]>([]);
    const [blankTileDialog, setBlankTileDialog] = useState<{ isOpen: boolean, pendingTileIndex: number | null }>({ isOpen: false, pendingTileIndex: null });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [optimisticBoard, setOptimisticBoard] = useState<Record<string, Tile> | null>(null);

    const isPlayerTurn = user && game ? game.currentTurn === user.uid : false;
    const opponentUid = useMemo(() => game?.players.find((p: string) => p !== user?.uid), [game, user]);

    useEffect(() => {
        if (game && user) {
            const userPlayerData = game.playerData[user.uid];
            if (userPlayerData) {
                setPlayerTiles(userPlayerData.tiles.slice(0, 7));
            }
            // Reset optimistic board when game updates (server sync)
            setOptimisticBoard(null);
        }

        // Bot Trigger Logic
        if (game && game.currentTurn === 'bitty-botty-001' && game.status === 'active') {
            // Only trigger if we are the user playing against the bot (to avoid double triggers if we had 2 real players, but here it's fine)
            // Ideally, this should be server-side or handled by a cloud function, but for this MVP client-side trigger is acceptable.
            // We check if the *current user* is the opponent of the bot, to ensure only one client triggers it.
            const isUserOpponent = game.players.includes(user?.uid) && user?.uid !== 'bitty-botty-001';

            if (isUserOpponent) {
                const triggerBot = async () => {
                    try {
                        await fetch(`/api/games/${gameId}/bot-move`, {
                            method: 'POST',
                            body: JSON.stringify({ difficulty: game.difficulty || 'Medium' }),
                        });
                    } catch (e) {
                        console.error("Failed to trigger bot move", e);
                    }
                };
                triggerBot();
            }
        }
    }, [game, user, gameId]);

    const handleTileSelect = (index: number) => {
        if (isExchanging) {
            setExchangeSelection((current: number[]) => {
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
                setPendingTiles((prev: PlacedTile[]) => [...prev, { ...tile, row, col, letter: '' }]);
                setPlayerTiles((prev: (Tile | null)[]) => {
                    const newTiles = [...prev];
                    newTiles[selectedTileIndex] = null;
                    return newTiles;
                });
                setSelectedTileIndex(null);
                setBlankTileDialog({ isOpen: true, pendingTileIndex: pendingTiles.length });

            } else {
                setPendingTiles((prev: PlacedTile[]) => [...prev, { ...tile, row, col }]);
                setPlayerTiles((prev: (Tile | null)[]) => {
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
            setPlayerTiles((prev: (Tile | null)[]) => {
                const newTiles = [...prev];
                // If it was a blank, recall it as a blank
                newTiles[firstEmptyIndex] = tileToRecall.isBlank ? { letter: ' ', score: 0 } : { letter: tileToRecall.letter, score: tileToRecall.score };
                return newTiles;
            });
            setPendingTiles((prev: PlacedTile[]) => prev.filter(t => !(t.row === tileToRecall.row && t.col === tileToRecall.col)));
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

    const handlePlay = async () => {
        if (pendingTiles.length === 0 || !gameDocRef || !game || !user || !opponentUid) return;

        setIsSubmitting(true);

        // Optimistic Update
        const newBoard = { ...game.board };
        pendingTiles.forEach(tile => {
            newBoard[`${tile.row},${tile.col}`] = { letter: tile.letter, score: tile.score, isBlank: tile.isBlank };
        });
        setOptimisticBoard(newBoard);
        const tilesToSubmit = [...pendingTiles]; // Copy for submission
        setPendingTiles([]); // Clear pending immediately

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/games/${gameId}/play`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ pendingTiles: tilesToSubmit }),
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
            // pendingTiles is already cleared
            // optimisticBoard will be cleared/replaced when the game doc updates via the listener

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not process your move.' });
            // Revert Optimistic Update
            setOptimisticBoard(null);
            setPendingTiles(tilesToSubmit); // Restore pending tiles so user can try again or fix

            if (gameDocRef) {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: gameDocRef.path,
                    operation: 'update',
                    requestResourceData: { pendingTiles: tilesToSubmit },
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
            if (gameDocRef) {
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
            if (gameDocRef) {
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
            setPendingTiles((prev: PlacedTile[]) => {
                const newTiles = [...prev];
                const tileToUpdate = newTiles[tileToUpdateIndex];
                if (tileToUpdate) {
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
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Send Error', description: e.message || 'Could not send message.' });
            if (gameDocRef) {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: gameDocRef.path,
                    operation: 'update',
                    requestResourceData: { message: newMessage.text },
                }));
            }
        }
    };

    const handleDragStart = (tile: Tile | null, index: number) => {
        if (!isExchanging) {
            setSelectedTileIndex(index);
        }
    };

    const handleDrop = (targetIndex: number) => {
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
    };

    return {
        board: optimisticBoard || game?.board || {},
        playerTiles,
        setPlayerTiles,
        pendingTiles,
        setPendingTiles,
        selectedTileIndex,
        setSelectedTileIndex,
        isSubmitting,
        isGettingHint,
        isExchanging,
        setIsExchanging,
        exchangeSelection,
        setExchangeSelection,
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
        handleDrop
    };
}
