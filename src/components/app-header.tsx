import { UserNav } from '@/components/user-nav';
import { SidebarTrigger } from './ui/sidebar';

export function AppHeader() {
  return (
    <div className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-bold tracking-tight font-headline">Letters with Characters</h1>
      </div>
      <UserNav />
    </div>
  );
}
