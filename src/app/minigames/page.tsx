import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { ArrowRight } from 'lucide-react';
import { ArcadeStatusPanel } from '@/components/retention/arcade-status-panel';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';

export default function MinigamesPage() {
  const arcadeModes: RetentionModeId[] = ['word-search', 'word-connect', 'liquid-sort', 'match-sort', 'solitaire'];

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Arcade</h1>
        </div>
        <ArcadeStatusPanel />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {arcadeModes.map((modeId) => {
            const mode = MODE_METADATA[modeId];
            return (
              <Link key={modeId} href={mode.href}>
                <Card className={`h-full overflow-hidden border-white/70 bg-gradient-to-br ${mode.accent} transition-all hover:-translate-y-1 hover:shadow-xl`}>
                  <CardHeader className="min-h-[220px] justify-between">
                    <div className="space-y-3">
                      <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-600">Permanent Mode</div>
                      <CardTitle className="font-headline text-3xl text-slate-950">{mode.title}</CardTitle>
                      <CardDescription className="max-w-sm text-base text-slate-700">{mode.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-700">
                      Open lane
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
