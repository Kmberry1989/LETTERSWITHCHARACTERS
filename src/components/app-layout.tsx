import type { ReactNode } from 'react';
import Image from 'next/image';
import { AppHeader } from '@/components/app-header';
import { FloatingDirectMessages } from '@/components/floating-direct-messages';
import { GameBackButton, PlayModeDocumentLock } from '@/components/game-screen';
import { MainNav } from '@/components/main-nav';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import MusicPlayer from '@/components/profile/music-player';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

type AppLayoutProps = {
  children: ReactNode;
  mode?: 'default' | 'play';
};

export default function AppLayout({ children, mode = 'default' }: AppLayoutProps) {
  const isPlayMode = mode === 'play';

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-white/70 bg-transparent">
        <SidebarHeader className="hidden" />
        <SidebarContent className="relative px-2 py-3">
          <div className="absolute inset-2 hidden overflow-hidden rounded-[1.8rem] group-data-[collapsible=icon]:hidden md:block">
            <Image
              src="/interface/sidebar.png"
              alt=""
              fill
              className="object-cover"
              sizes="20rem"
              priority
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, hsl(var(--sidebar-accent) / 0.32), hsl(var(--sidebar-primary) / 0.18))',
              }}
            />
          </div>
          <div className="relative z-10 flex min-h-full items-center justify-center px-3 py-4 group-data-[collapsible=icon]:px-0">
            <div className="w-full max-w-[12.75rem] group-data-[collapsible=icon]:max-w-none">
              <MainNav />
            </div>
          </div>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-transparent">
        {isPlayMode ? <PlayModeDocumentLock /> : null}
        {isPlayMode ? null : <AppHeader />}
        <MusicPlayer />
        <main
          className={cn(
            'min-w-0 max-w-full overflow-x-clip',
            isPlayMode ? 'h-[100svh] overflow-hidden overscroll-none pb-0 select-none touch-none md:h-auto md:min-h-0' : 'pb-28 md:pb-0'
          )}
        >
          {children}
        </main>
        {isPlayMode ? <GameBackButton /> : null}
        {isPlayMode ? <div className="hidden md:block"><FloatingDirectMessages /></div> : <FloatingDirectMessages />}
        {!isPlayMode ? <MobileBottomNav /> : null}
      </SidebarInset>
    </SidebarProvider>
  );
}
