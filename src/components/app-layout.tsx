import type { ReactNode } from 'react';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { FloatingDirectMessages } from '@/components/floating-direct-messages';
import { MainNav } from '@/components/main-nav';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import MusicPlayer from '@/components/profile/music-player';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-white/70 bg-transparent">
        <SidebarHeader className="border-b border-white/60 p-3">
          <div className="glass-panel flex items-center gap-3 rounded-[1.65rem] p-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_20px_rgba(35,50,80,.08)] ring-2 ring-emerald-500/12">
              <Image src="/interface/logo.png" alt="Letters with Characters" fill className="object-cover" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <h2 className="truncate text-lg font-black tracking-tight font-headline">Letters with Characters</h2>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Word Arcade</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <AppHeader />
        <MusicPlayer />
        <main className="pb-28 md:pb-0">{children}</main>
        <FloatingDirectMessages />
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
