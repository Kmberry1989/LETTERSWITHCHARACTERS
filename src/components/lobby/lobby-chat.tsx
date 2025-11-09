'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';

export type LobbyMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string | null;
  text: string;
  timestamp: Date | { toDate: () => Date }; // Support Firestore Timestamps
};

type LobbyChatProps = {
  messages: LobbyMessage[];
  onSendMessage: (text: string) => void;
  currentUser: User | null;
  isLoading: boolean;
};

export default function LobbyChat({ messages, onSendMessage, currentUser, isLoading }: LobbyChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
   const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change, but only if user is near the bottom
    if (viewportRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = viewportRef.current;
      if (scrollHeight - scrollTop < clientHeight + 100) {
        setTimeout(() => {
          viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim() && currentUser) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };
  
  const processedMessages = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      timestamp: msg.timestamp && 'toDate' in msg.timestamp ? msg.timestamp.toDate() : msg.timestamp as Date,
    }));
  }, [messages]);
  

  return (
     <Card className="flex h-[calc(100vh-10rem)] flex-col">
        <CardHeader className="border-b p-4">
            <CardTitle className="text-lg">Public Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
            <ScrollArea className="flex-1" viewportRef={viewportRef}>
                <div className="space-y-4 p-4">
                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-12 w-2/3 ml-auto" />
                        <Skeleton className="h-12 w-3/4" />
                    </div>
                )}
                {!isLoading && processedMessages.map((msg) => {
                    const isCurrentUser = msg.senderId === currentUser?.uid;
                    return (
                    <div
                        key={msg.id}
                        className={cn(
                        'flex items-end gap-2',
                        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                        )}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.senderPhotoURL || undefined} />
                            <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div
                        className={cn(
                            'max-w-xs rounded-lg p-3 text-sm shadow-sm',
                            isCurrentUser
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        )}
                        >
                        <p className="font-bold mb-1">{isCurrentUser ? 'You' : msg.senderName}</p>
                        <p>{msg.text}</p>
                        </div>
                    </div>
                    )
                })}
                </div>
            </ScrollArea>
            <div className="mt-auto flex gap-2 p-4 border-t bg-muted/40">
                <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="bg-background"
                disabled={!currentUser}
                />
                <Button onClick={handleSend} size="icon" aria-label="Send Message" disabled={!currentUser}>
                <Send />
                </Button>
            </div>
        </CardContent>
    </Card>
  );
}