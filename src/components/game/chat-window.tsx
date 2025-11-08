'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Message = {
  sender: string;
  text: string;
};

type ChatWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (text: string) => void;
};

export default function ChatWindow({ isOpen, onClose, messages, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 bg-black/30"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-[#e0d6c4] border-2 border-[#a07e56] rounded-b-none">
              <CardHeader className="flex flex-row items-center justify-between p-4 bg-[#c4a27a] border-b-2 border-[#a07e56]">
                <CardTitle className="text-lg">Chat</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                  <X />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ScrollArea className="h-48 w-full pr-4">
                  <div className="space-y-4 py-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex flex-col',
                          msg.sender === 'You' ? 'items-end' : 'items-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-xs rounded-lg p-3 text-sm',
                            msg.sender === 'You'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          )}
                        >
                          <p className="font-bold">{msg.sender}</p>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 flex gap-2 p-4 -mx-4 -mb-4 bg-[#c4a27a] border-t-2 border-[#a07e56]">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="bg-background"
                  />
                  <Button onClick={handleSend}>Send</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
