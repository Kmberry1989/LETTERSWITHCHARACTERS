import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';

export default function MinigamesPage() {
  const arcadeModes: RetentionModeId[] = ['word-search', 'word-connect', 'liquid-sort', 'match-sort', 'solitaire', 'wheel'];

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em]">
            Quick Play
          </Badge>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Arcade</h1>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {arcadeModes.map((modeId) => {
            const mode = MODE_METADATA[modeId];
            return (
              <Link key={modeId} href={mode.href}>
                <Card className={`h-full overflow-hidden border-white/70 bg-gradient-to-br ${mode.accent} transition-all hover:-translate-y-1 hover:shadow-lg`}>
                  <CardHeader className="min-h-[168px] justify-between">
                    <div className="space-y-4">
                      <img src={mode.iconPath} alt="" className="h-16 w-16" />
                      <CardTitle className="font-headline text-2xl text-slate-950">{mode.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                      Play now
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
