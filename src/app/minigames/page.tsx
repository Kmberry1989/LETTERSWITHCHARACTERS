import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';

const arcadeModes = ['word-search', 'five-in-six', 'word-connect', 'liquid-sort', 'match-sort', 'solitaire', 'wheel'] as const satisfies readonly RetentionModeId[];

export default function MinigamesPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-2 p-3 sm:p-6">
        <h1 className="sr-only">Arcade</h1>
        <div className="mx-auto grid max-w-2xl gap-2">
          {arcadeModes.map((modeId) => {
            const mode = MODE_METADATA[modeId];
            return (
              <Card key={modeId} className="soft-card overflow-hidden rounded-2xl">
                <CardContent className="flex h-16 items-center gap-3 p-2.5">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${mode.accent}`}>
                    <img src={mode.iconPath} alt="" className="h-7 w-7" />
                  </span>
                  <CardTitle className="min-w-0 flex-1 truncate font-headline text-xl font-black text-slate-950">{mode.title}</CardTitle>
                  <Button asChild size="icon" className="shrink-0 rounded-full" aria-label={`Play ${mode.title}`}>
                    <Link href={mode.href}><ArrowRight className="h-4 w-4" /></Link>
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
