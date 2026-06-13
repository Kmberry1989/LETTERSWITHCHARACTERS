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
          <div className="glass-panel overflow-hidden rounded-[1.65rem] p-2 group-data-[collapsible=icon]:hidden">
            <Image
              src="/interface/sidebar.png"
              alt="Letters with Characters"
              width={782}
              height={1774}
              className="h-auto w-full rounded-[1.15rem] object-cover"
              priority
            />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-3">
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-transparent">
        <AppHeader />
        <MusicPlayer />
        <main className="min-w-0 max-w-full overflow-x-clip pb-28 md:pb-0">{children}</main>
        <FloatingDirectMessages />
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
