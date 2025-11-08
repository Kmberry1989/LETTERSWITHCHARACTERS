'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { User } from 'firebase/auth';

export type ChatMessage = {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date | { toDate: () => Date }; // Support Firestore Timestamps
};

type ChatWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: User | null;
};

export default function ChatWindow({ isOpen, onClose, messages, onSendMessage, currentUser }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };
  
  const sortedMessages = messages.map(msg => ({
    ...msg,
    // Convert Firestore Timestamp to Date if necessary
    timestamp: msg.timestamp && 'toDate' in msg.timestamp ? msg.timestamp.toDate() : msg.timestamp as Date,
  })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="rounded-b-none rounded-t-lg border-x-0 border-b-0">
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
                <CardTitle className="text-lg">In-Game Chat</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                  <X />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64" viewportRef={scrollAreaRef}>
                   <div className="space-y-4 p-4">
                    {sortedMessages.map((msg, index) => {
                      const isCurrentUser = msg.senderId === currentUser?.uid;
                      return (
                        <div
                          key={index}
                          className={cn(
                            'flex flex-col',
                            isCurrentUser ? 'items-end' : 'items-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-xs rounded-lg p-3 text-sm',
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground'
                            )}
                          >
                            <p className="font-bold">{isCurrentUser ? 'You' : msg.senderName}</p>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <ScrollBar />
                </ScrollArea>
                <div className="mt-auto flex gap-2 p-4 border-t bg-muted/40">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="bg-background"
                  />
                  <Button onClick={handleSend} size="icon" aria-label="Send Message">
                    <Send />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
