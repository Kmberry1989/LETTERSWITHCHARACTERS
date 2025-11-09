'use client';
import AppLayout from '@/components/app-layout';
import LobbyChat, { type LobbyMessage } from '@/components/lobby/lobby-chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';

export default function LobbyPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'lobbyMessages'), orderBy('timestamp', 'desc'), limit(50));
    }, [firestore]);
    
    const { data: messages, isLoading } = useCollection<LobbyMessage>(messagesQuery);
    const sortedMessages = useMemo(() => messages?.slice().reverse() || [], [messages]);


    const handleSendMessage = async (text: string) => {
        if (!firestore || !user) return;
        
        const lobbyMessagesCol = collection(firestore, 'lobbyMessages');

        const newMessage = {
            senderId: user.uid,
            senderName: user.displayName || 'Anonymous',
            senderPhotoURL: user.photoURL || null,
            text,
            timestamp: serverTimestamp(),
        };

        addDoc(lobbyMessagesCol, newMessage).catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: lobbyMessagesCol.path,
                operation: 'create',
                requestResourceData: newMessage,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };


    return (
        <AppLayout>
             <div className="flex-1 space-y-4 p-4 sm:p-8">
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Game Lobby</h1>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <LobbyChat 
                            messages={sortedMessages} 
                            onSendMessage={handleSendMessage} 
                            currentUser={user}
                            isLoading={isLoading}
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Find a Game</CardTitle>
                                <CardDescription>Matchmaking is coming soon! For now, chat with other players while you wait.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" disabled>
                                    Find Random Opponent
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
             </div>
        </AppLayout>
    );
}
