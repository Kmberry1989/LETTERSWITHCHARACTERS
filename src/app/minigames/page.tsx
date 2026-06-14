import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';

const arcadeModes = ['word-search', 'word-connect', 'liquid-sort', 'match-sort', 'solitaire', 'wheel'] as const satisfies readonly RetentionModeId[];

export default function MinigamesPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <h1 className="sr-only">Arcade</h1>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {arcadeModes.map((modeId) => {
            const mode = MODE_METADATA[modeId];
            return (
              <Card key={modeId} className="soft-card group overflow-hidden rounded-[1.75rem] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(35,50,80,0.12)]">
                <CardHeader className={`min-h-[9rem] justify-between bg-gradient-to-br ${mode.accent}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="icon-badge">
                      <img src={mode.iconPath} alt="" className="h-10 w-10" />
                    </span>
                  </div>
                  <CardTitle className="font-headline text-2xl font-black text-slate-950">{mode.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <Badge variant="outline" className="rounded-full bg-white/[.68]">Play</Badge>
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
