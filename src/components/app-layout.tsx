import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app-header';
import { MainNav } from '@/components/main-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Cat } from 'lucide-react';

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
             <Cat className="w-8 h-8 text-primary" />
             <h2 className="text-lg font-semibold tracking-tight font-headline group-data-[collapsible=icon]:hidden">Letters with Characters</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
