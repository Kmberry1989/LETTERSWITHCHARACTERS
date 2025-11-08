'use client';

import { Bot, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const stickers = ['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '🎉', '💡', '🔥', '💯'];
const suggestedWords = [
  { word: 'QUERY', score: 28 },
  { word: 'ZEPHYR', score: 45 },
  { word: 'PHENOM', score: 31 },
  { word: 'DRIVEN', score: 22 },
  { word: 'EXAM', score: 18 },
  { word: 'CHUMP', score: 26 },
  { word: 'LOVER', score: 21 },
  { word: 'QUICK', score: 35 },
  { word: 'GLOW♥' },
  { word: 'PIXELS', score: 32 },
  { word: 'JOKING', score: 38 },
];

export default function GameActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ word: string; score: number }[]>([]);

  const handleGetSuggestions = () => {
    setIsLoading(true);
    setSuggestions([]);
    // This would be a call to the GenAI flow
    setTimeout(() => {
      setSuggestions(suggestedWords);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="ai_assistant" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-t-lg rounded-b-none">
            <TabsTrigger value="ai_assistant">
              <Bot className="mr-2 h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="stickers">
              <Smile className="mr-2 h-4 w-4" />
              Stickers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="ai_assistant" className="p-4">
            <CardDescription className="mb-4">
              Stuck? Let our AI assistant help you find the best words to play.
            </CardDescription>
            <Button onClick={handleGetSuggestions} disabled={isLoading} className="w-full">
              {isLoading ? 'Thinking...' : 'Get Suggestions'}
            </Button>
            {suggestions.length > 0 && (
              <ScrollArea className="h-32 mt-4">
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 rounded-md bg-secondary">
                      <span className="font-mono font-bold tracking-widest">{s.word}</span>
                      <span className="font-semibold text-primary">{s.score} pts</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          <TabsContent value="stickers" className="p-4">
            <CardDescription className="mb-4">React to moves with fun stickers!</CardDescription>
            <div className="grid grid-cols-4 gap-2">
              {stickers.map((sticker, i) => (
                <Button key={i} variant="ghost" className="text-2xl h-12 w-12 hover:bg-accent transition-transform hover:scale-110">
                  {sticker}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
