import Link from 'next/link';
import Image from 'next/image';
import AppLayout from '@/components/app-layout';
import { CircleHelp, Coins, Gauge, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';

const arcadeModes = ['word-search', 'five-in-six', 'word-connect', 'liquid-sort', 'match-sort', 'solitaire', 'wheel', 'claw-crane'] as const satisfies readonly RetentionModeId[];

export default function MinigamesPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-5 p-3 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h1 className="font-headline text-3xl font-black text-slate-950 sm:text-4xl">Arcade</h1>
              <p className="mt-1 text-sm font-semibold text-slate-600">Choose a quick challenge, earn berries, and keep your streak moving.</p>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full bg-white/80 px-3 py-2 text-xs font-black text-slate-700 shadow-sm sm:flex">
              <Coins className="h-4 w-4 text-amber-500" />
              Daily challenges available
            </div>
          </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {arcadeModes.map((modeId) => {
            const mode = MODE_METADATA[modeId];
            return (
              <Card key={modeId} className="soft-card overflow-hidden rounded-2xl transition-shadow hover:shadow-lg">
                <CardContent className="flex min-h-36 items-start gap-3 p-3">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${mode.accent}`}>
                    <Image src={mode.iconPath} alt="" width={28} height={28} className="h-7 w-7" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="font-headline text-xl font-black text-slate-950">{mode.title}</CardTitle>
                    <p className="mt-1 text-sm font-semibold leading-snug text-slate-600">{mode.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-slate-500">
                      <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{mode.difficulty}</span>
                      <span className="inline-flex items-center gap-1"><CircleHelp className="h-3.5 w-3.5" />{mode.controls}</span>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-700">{mode.reward}</div>
                  </div>
                  <Button asChild size="icon" className="shrink-0 rounded-full" aria-label={`Play ${mode.title}`}>
                    <Link href={mode.href}><Play className="h-4 w-4 fill-current" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
