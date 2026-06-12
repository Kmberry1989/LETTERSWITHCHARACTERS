'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc } from '@/lib/client/document-client';
import { useToast } from '@/hooks/use-toast';
import { useAudio } from '@/hooks/use-audio';
import { Tile, PlacedTile } from '@/lib/game/types';
import { ChatMessage } from '@/components/game/chat-window';

export function useGameState(gameId: string | null, user: any, game: any, equippedTileSetId?: string | null) {
    const { toast } = useToast();
    const { playSfx } = useAudio();

    const gameDocRef = useMemo(() => {
        return gameId ? doc(null, 'games', gameId) : null;
    }, [gameId]);

    const [playerTiles, setPlayerTiles] = useState<(Tile | null)[]>([]);
    const [pendingTiles, setPendingTiles] = useState<PlacedTile[]>([]);
    const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExchanging, setIsExchanging] = useState(false);
    const [exchangeSelection, setExchangeSelection] = useState<number[]>([]);
    const [blankTileDialog, setBlankTileDialog] = useState<{ isOpen: boolean, pendingTileIndex: number | null }>({ isOpen: false, pendingTileIndex: null });
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [optimisticBoard, setOptimisticBoard] = useState<Record<string, Tile> | null>(null);
    const [draggedTileIndex, setDraggedTileIndex] = useState<number | null>(null);
    const [selectedPendingTileKey, setSelectedPendingTileKey] = useState<string | null>(null);
    const [shuffleTick, setShuffleTick] = useState(0);
    const [replenishedTileIndexes, setReplenishedTileIndexes] = useState<number[]>([]);

    const isPlayerTurn = user && game ? game.currentTurn === user.uid : false;
    const opponentUid = useMemo(() => game?.players.find((p: string) => p !== user?.uid), [game, user]);
    const serverBoardSignature = useMemo(() => JSON.stringify(game?.board || {}), [game?.board]);
    const optimisticBoardSignature = useMemo(() => JSON.stringify(optimisticBoard || {}), [optimisticBoard]);
    const localPlacementActive = pendingTiles.length > 0 || blankTileDialog.isOpen || draggedTileIndex !== null || selectedTileIndex !== null;
    const activeTileSetId = equippedTileSetId || (user && game?.playerData?.[user.uid]?.equippedTileSetId ? game.playerData[user.uid].equippedTileSetId : undefined);

    useEffect(() => {
        if (!game || !user) {
            return;
        }

        const userPlayerData = game.playerData[user.uid];
        if (!userPlayerData) {
            return;
        }

        const serverTiles = userPlayerData.tiles.slice(0, 7);
        const optimisticSettled = !optimisticBoard || optimisticBoardSignature === serverBoardSignature;

        if (!localPlacementActive && optimisticSettled) {
            setPlayerTiles(serverTiles);
            setPendingTiles([]);
            setSelectedTileIndex(null);
            setSelectedPendingTileKey(null);
            setDraggedTileIndex(null);
            setOptimisticBoard(null);
            return;
        }

        if (!localPlacementActive && optimisticBoard && optimisticSettled) {
            setOptimisticBoard(null);
        }

    }, [
        game,
        user,
        gameId,
        localPlacementActive,
        optimisticBoard,
        optimisticBoardSignature,
        serverBoardSignature,
        blankTileDialog.isOpen,
        draggedTileIndex,
    ]);

    const placeTileAt = (tileIndex: number, row: number, col: number) => {
        if (!isPlayerTurn) return;

        const tile = playerTiles[tileIndex];
        if (!tile) return;

        playSfx('click');

        if (pendingTiles.some((pendingTile) => pendingTile.row === row && pendingTile.col === col)) {
            return;
        }

        if (tile.letter === ' ') {
            setPendingTiles((prev: PlacedTile[]) => [...prev, { ...tile, row, col, letter: '', tileSetId: activeTileSetId, ownerUid: user?.uid }]);
            setPlayerTiles((prev: (Tile | null)[]) => {
                const newTiles = [...prev];
                newTiles[tileIndex] = null;
                return newTiles;
            });
            setSelectedTileIndex(null);
            setSelectedPendingTileKey(null);
            setDraggedTileIndex(null);
            setBlankTileDialog({ isOpen: true, pendingTileIndex: pendingTiles.length });
            return;
        }

        setPendingTiles((prev: PlacedTile[]) => [...prev, { ...tile, row, col, tileSetId: activeTileSetId, ownerUid: user?.uid }]);
        setPlayerTiles((prev: (Tile | null)[]) => {
            const newTiles = [...prev];
            newTiles[tileIndex] = null;
            return newTiles;
        });
        setSelectedTileIndex(null);
        setSelectedPendingTileKey(null);
        setDraggedTileIndex(null);
    };

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
        if (selectedPendingTileKey) {
            const [fromRow, fromCol] = selectedPendingTileKey.split('-').map(Number);
            setPendingTiles((prev: PlacedTile[]) =>
                prev.map((tile) =>
                    tile.row === fromRow && tile.col === fromCol
                        ? { ...tile, row, col }
                        : tile
                )
            );
            setSelectedPendingTileKey(`${row}-${col}`);
            playSfx('click');
            return;
        }

        if (selectedTileIndex === null) return;
        placeTileAt(selectedTileIndex, row, col);
    };

    const handlePendingTileSelect = (tileToSelect: PlacedTile) => {
        if (!isPlayerTurn) return;
        setSelectedTileIndex(null);
        setSelectedPendingTileKey((current) => current === `${tileToSelect.row}-${tileToSelect.col}` ? null : `${tileToSelect.row}-${tileToSelect.col}`);
        playSfx('click');
    };

    const handleRecallAll = () => {
        if (!isPlayerTurn) return;
        playSfx('swoosh');
        let newPlayerTiles = [...playerTiles];
        for (const tile of pendingTiles) {
            const firstEmptyIndex = newPlayerTiles.findIndex(t => t === null);
            if (firstEmptyIndex !== -1) {
                newPlayerTiles[firstEmptyIndex] = tile.isBlank ? { letter: ' ', score: 0 } : { letter: tile.letter, score: tile.score };
            }
        }
        setPlayerTiles(newPlayerTiles);
        setPendingTiles([]);
        setSelectedPendingTileKey(null);
    };

    const handleShuffle = () => {
        if (!isPlayerTurn) return;
        playSfx('click');
        const shuffled = [...playerTiles];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setPlayerTiles(shuffled);
        setShuffleTick((current) => current + 1);
    };

    const handlePlay = async () => {
        if (pendingTiles.length === 0 || !gameDocRef || !game || !user || !opponentUid) return;

        setIsSubmitting(true);
        const previousPlayerTiles = [...playerTiles];

        const newBoard = { ...game.board };
        pendingTiles.forEach(tile => {
            newBoard[`${tile.row}-${tile.col}`] = { letter: tile.letter, score: tile.score, isBlank: tile.isBlank };
        });
        setOptimisticBoard(newBoard);
        const tilesToSubmit = [...pendingTiles];
        const playedTileCount = tilesToSubmit.length;
        setPendingTiles([]);

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
            const confirmedBoard = result?.board && typeof result.board === 'object' ? (result.board as Record<string, Tile>) : null;
            if (confirmedBoard) {
                setOptimisticBoard(confirmedBoard);
            }

            const replenishedTiles = Array.isArray(result?.tiles) ? (result.tiles.slice(0, 7) as Tile[]) : null;
            if (replenishedTiles) {
                setPlayerTiles(replenishedTiles);
                setReplenishedTileIndexes(
                    replenishedTiles
                        .map((_, index) => index)
                        .slice(Math.max(replenishedTiles.length - playedTileCount, 0))
                );
                setShuffleTick((current) => current + 1);
            }
            const scoredPoints = typeof result?.score === 'number' ? result.score : null;
            const berriesEarned = typeof result?.berriesEarned === 'number' ? result.berriesEarned : null;
            playSfx(scoredPoints !== null && scoredPoints > 0 ? 'success' : 'place');

            toast({
                title: 'Word Played!',
                description: scoredPoints !== null
                  ? `${berriesEarned ? `+${berriesEarned} berries, ` : ''}you scored ${scoredPoints} points!`
                  : 'Move submitted successfully.',
            });

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not process your move.' });
            playSfx('error');
            setOptimisticBoard(null);
            setPendingTiles(tilesToSubmit);
            setPlayerTiles(previousPlayerTiles);
<<<<<<< ours
<<<<<<< ours
            setSelectedPendingTileKey(null);
=======
>>>>>>> theirs
=======
>>>>>>> theirs
            setReplenishedTileIndexes([]);
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
            playSfx('swoosh');

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not pass turn.' });
            playSfx('error');
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
            playSfx('swoosh');
            setExchangeSelection([]);
            setIsExchanging(false);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not exchange tiles.' });
            playSfx('error');
        } finally {
            setIsSubmitting(false);
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
        playSfx('click');
        setBlankTileDialog({ isOpen: false, pendingTileIndex: null });
    };

    const handleSendMessage = async (text: string) => {
        if (!gameId || !game || !user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/games/${gameId}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text, senderName: user.displayName || 'Anonymous' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Could not send message.');
            }
            playSfx('click');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Send Error', description: e.message || 'Could not send message.' });
            playSfx('error');
        }
    };

    const handleDragStart = (tile: Tile | null, index: number) => {
        if (isExchanging || !tile || !isPlayerTurn) return;
        setSelectedTileIndex(index);
        setDraggedTileIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedTileIndex(null);
    };

    const handleDrop = (targetIndex: number) => {
        if (draggedTileIndex !== null) {
            const newTiles = [...playerTiles];
            [newTiles[targetIndex], newTiles[draggedTileIndex]] = [newTiles[draggedTileIndex], newTiles[targetIndex]];
            setPlayerTiles(newTiles);
            setSelectedTileIndex(targetIndex);
            setSelectedPendingTileKey(null);
            setDraggedTileIndex(null);
        }
    };

    const handleBoardDrop = (row: number, col: number, tileIndex?: number | null) => {
        const sourceIndex = typeof tileIndex === 'number' ? tileIndex : draggedTileIndex;
        if (sourceIndex === null || sourceIndex === undefined) return;
        placeTileAt(sourceIndex, row, col);
    };

    return {
        board: optimisticBoard || game?.board || {},
        playerTiles,
        setPlayerTiles,
        pendingTiles,
        setPendingTiles,
        selectedTileIndex,
        setSelectedTileIndex,
        selectedPendingTileKey,
        isSubmitting,
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
        handlePendingTileSelect,
        handleRecallAll,
        handleShuffle,
        handlePlay,
        handlePass,
        handleExchange,
        handleBlankTileSelect,
        handleSendMessage,
        handleDragStart,
        handleDragEnd,
        handleDrop,
        handleBoardDrop,
        shuffleTick,
        replenishedTileIndexes,
    };
}
