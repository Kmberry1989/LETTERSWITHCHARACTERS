import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { ArrowRight, Clock, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';

const arcadeModes = ['word-search', 'word-connect', 'liquid-sort', 'match-sort', 'solitaire', 'wheel'] as const satisfies readonly RetentionModeId[];
type ArcadeModeId = (typeof arcadeModes)[number];

const descriptions: Record<ArcadeModeId, string> = {
  'word-search': 'Find hidden words before the board glows out.',
  'word-connect': 'Trace letter paths and stack quick combo clears.',
  'liquid-sort': 'Pour glossy color stacks into perfect order.',
  'match-sort': 'Sort playful goods into the right lanes.',
  solitaire: 'Race through a fast card sprint.',
  wheel: 'Spin a carnival wheel for a quick reward rush.',
};

export default function MinigamesPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-8">
        <div className="glass-panel rounded-[2rem] p-5 sm:p-6">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em]">
            Quick Play
          </Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight font-headline">Arcade</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Mobile-first mini games with sticker-like icons, reward chips, and tactile play buttons.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {arcadeModes.map((modeId) => {
            const mode = MODE_METADATA[modeId];
            return (
              <Card key={modeId} className="soft-card group overflow-hidden rounded-[1.75rem] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(35,50,80,0.12)]">
                <CardHeader className={`min-h-[11rem] justify-between bg-gradient-to-br ${mode.accent}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="icon-badge">
                      <img src={mode.iconPath} alt="" className="h-10 w-10" />
                    </span>
                    <Badge variant="secondary" className="rounded-full bg-white/[.72]">Daily XP</Badge>
                  </div>
                  <div>
                    <CardTitle className="font-headline text-2xl font-black text-slate-950">{mode.title}</CardTitle>
                    <p className="mt-2 text-sm font-medium text-slate-600">{descriptions[modeId]}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full bg-white/[.68]"><Clock className="mr-1 h-3 w-3" />Quick</Badge>
                    <Badge variant="outline" className="rounded-full bg-white/[.68]"><Gift className="mr-1 h-3 w-3" />Berries</Badge>
                  </div>
                  <Button asChild size="sm" className="rounded-full">
                    <Link href={mode.href}>Play <ArrowRight className="h-4 w-4" /></Link>
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
