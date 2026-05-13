'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { createTileBag, drawTiles } from '@/lib/game-logic';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import type { UserProfile } from '@/firebase/firestore/use-users';
import type { Tile } from '@/lib/game/types';

interface BotGameDialogProps {
    disabled?: boolean;
    existingGames: any[];
    children?: React.ReactNode;
}

export function BotGameDialog({ disabled, existingGames, children }: BotGameDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [isCreating, setIsCreating] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleNewBotGame = async () => {
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Unable to start new game",
                description: "You must be logged in to start a new game.",
            });
            return;
        }

        setIsCreating(true);

        const opponent = {
            uid: 'bitty-botty-001',
            displayName: 'Bitty Botty',
            avatarId: 'avatar-base',
        };

        // Check for existing game with bot
        const hasBotGame = existingGames.some(game => game.players.includes(opponent.uid) && game.status === 'active');
        if (hasBotGame) {
            toast({
                variant: "destructive",
                title: "Bot Game Limit Reached",
                description: "You can only have one active game against Bitty Botty at a time.",
            });
            setIsCreating(false);
            setIsOpen(false);
            return;
        }


        const userDocRef = doc(firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userProfile = userDocSnap.data() as UserProfile | undefined;

        if (!userProfile) {
            toast({
                variant: "destructive",
                title: "Could not start game",
                description: "Your user profile could not be found.",
            });
            setIsCreating(false);
            return;
        }


        let tileBag = createTileBag();
        const [player1Tiles, tileBagAfterP1] = drawTiles(tileBag, 7);
        const [player2Tiles, finalTileBag] = drawTiles(tileBagAfterP1, 7);
        tileBag = finalTileBag;


        const newGame = {
            players: [user.uid, opponent.uid],
            playerData: {
                [user.uid]: {
                    displayName: userProfile.displayName || 'You',
                    score: 0,
                    avatarId: userProfile.avatarId || 'user-1',
                    photoURL: userProfile.photoURL || null,
                    tiles: player1Tiles,
                    hintUsed: false,
                },
                [opponent.uid]: {
                    displayName: opponent.displayName,
                    score: 0,
                    avatarId: opponent.avatarId,
                    photoURL: PlaceHolderImages.find(p => p.id === opponent.avatarId)?.imageUrl || null,
                    tiles: player2Tiles,
                    hintUsed: false,
                }
            },
            board: {},
            tileBag: tileBag,
            currentTurn: user.uid,
            status: 'active',
            consecutivePasses: 0,
            messages: [],
            difficulty: selectedDifficulty,
        };

        try {
            const gamesCol = collection(firestore, 'games');
            const gameDocRef = await addDoc(gamesCol, newGame);

            // Now update the user's profile with the new game ID
            await updateDoc(userDocRef, {
                gameIds: arrayUnion(gameDocRef.id)
            });

            toast({
                title: "Game created!",
                description: `You've started a new ${selectedDifficulty} game against ${opponent.displayName}.`,
            });
            setIsOpen(false);
            // Redirect or let the dashboard update
            window.location.href = `/game?game=${gameDocRef.id}`;

        } catch (error: any) {
            console.error("Error creating bot game:", error);

            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: 'games or users',
                    operation: 'create',
                    requestResourceData: newGame,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error creating game",
                    description: error.message || "An unexpected error occurred.",
                });
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled}>
                    {children || (
                        <>
                            <Bot className="mr-2 h-4 w-4" />
                            Play vs. Bot
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Start a Bot Game</DialogTitle>
                    <DialogDescription>
                        Choose your difficulty level for Bitty Botty.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="difficulty" className="text-right">
                            Difficulty
                        </Label>
                        <Select value={selectedDifficulty} onValueChange={(val: any) => setSelectedDifficulty(val)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleNewBotGame} disabled={isCreating}>
                        {isCreating ? 'Starting...' : 'Start Game'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
