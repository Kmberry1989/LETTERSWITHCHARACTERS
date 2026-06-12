import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app-header';
import { MainNav } from '@/components/main-nav';
import MusicPlayer from '@/components/profile/music-player';
import Image from 'next/image';
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
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border/80">
          <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,239,220,0.88))] p-3 shadow-sm">
             <div className="relative h-11 w-11 overflow-hidden rounded-2xl ring-2 ring-primary/15">
               <Image src="/interface/logo.png" alt="Letters with Characters" fill className="object-cover" />
             </div>
             <div className="group-data-[collapsible=icon]:hidden">
               <h2 className="text-lg font-semibold tracking-tight font-headline">Letters with Characters</h2>
             </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <MusicPlayer />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
