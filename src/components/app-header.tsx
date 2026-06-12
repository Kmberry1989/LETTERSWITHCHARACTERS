'use client';

import Image from 'next/image';
import { Cherry } from 'lucide-react';
import { UserNav } from '@/components/user-nav';
import { useBerries } from '@/hooks/use-berries';
import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';

function BerryDisplay() {
  const { berries, level } = useBerries();
  return (
    <Button variant="glass" className="h-11 gap-2 rounded-[1.15rem] px-3 sm:px-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
        <Cherry className="h-4 w-4 text-rose-500" />
      </span>
      <span className="font-black tabular-nums">{berries.toLocaleString()}</span>
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-black text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]">Lv {level}</span>
      <span className="sr-only">Berries</span>
    </Button>
  );
}

export function AppHeader() {
  return (
    <div className="sticky top-0 z-30 flex h-[4.25rem] w-full shrink-0 items-center justify-between border-b border-white/70 bg-[#f6faef]/78 px-3 backdrop-blur-xl sm:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-10 w-10 rounded-2xl border border-white/70 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,.8),0_8px_18px_rgba(35,50,80,.08)] md:h-9 md:w-9" />
        <div className="flex items-center gap-2 md:hidden">
          <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white shadow-sm ring-2 ring-emerald-500/10">
            <Image src="/interface/logo.png" alt="Letters with Characters" fill className="object-cover" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-black tracking-tight font-headline">LWC</h1>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-400">Word Arcade</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <BerryDisplay />
        <UserNav />
      </div>
    </div>
  );
}
