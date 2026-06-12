import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';

const modeDescriptions: Record<RetentionModeId, string> = {
  'word-search': 'Find hidden words fast, then bank berries from clean clears.',
  'word-connect': 'Link letters into satisfying chains with a quick-play rhythm.',
  'liquid-sort': 'Sort glossy color tubes while your brain cools down.',
  'match-sort': 'Group playful goods and patterns before the board fills up.',
  solitaire: 'A tight card sprint for solo score chasing.',
  wheel: 'Spin the carnival wheel for quick reward momentum.',
};

const modeTags: Record<RetentionModeId, string[]> = {
  'word-search': ['Quick', 'Letter hunt'],
  'word-connect': ['Combo', 'Daily'],
  'liquid-sort': ['Chill', 'Puzzle'],
  'match-sort': ['Sort', 'Pattern'],
  solitaire: ['Solo', 'Sprint'],
  wheel: ['Lucky', 'Rewards'],
};

export default function MinigamesPage() {
  const arcadeModes: RetentionModeId[] = ['word-search', 'word-connect', 'liquid-sort', 'match-sort', 'solitaire', 'wheel'];

  return (
    <AppLayout>
      <div className="page-shell space-y-6">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="relative space-y-3">
            <Badge variant="outline" className="rounded-full bg-white/70 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em]">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-amber-500" />
              Quick Play
            </Badge>
            <div>
              <h1 className="text-3xl font-black tracking-tight font-headline sm:text-4xl">Arcade</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                Compact mini-games with tactile cards, clear rewards, and thumb-first play actions.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {arcadeModes.map((modeId) => {
            const mode = MODE_METADATA[modeId];
            return (
              <Card
                key={modeId}
                className={`soft-card group relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${mode.accent} transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(35,50,80,.12)]`}
              >
                <CardHeader className="space-y-5 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="icon-badge h-16 w-16 rounded-[1.25rem] bg-white/76">
                      <img src={mode.iconPath} alt="" className="h-11 w-11 object-contain drop-shadow-sm" />
                    </span>
                    <div className="flex flex-wrap justify-end gap-2">
                      {modeTags[modeId].map((tag) => (
                        <Badge key={tag} variant="secondary" className="rounded-full bg-white/65 font-black text-slate-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="font-headline text-2xl font-black text-slate-950">{mode.title}</CardTitle>
                    <p className="mt-2 min-h-[2.5rem] text-sm leading-5 text-slate-600">{modeDescriptions[modeId]}</p>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
                  <Button asChild variant="outline" className="w-full justify-between rounded-[1.15rem] bg-white/78">
                    <Link href={mode.href}>
                      Play now
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
