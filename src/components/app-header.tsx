import { UserNav } from '@/components/user-nav';
import { SidebarTrigger } from './ui/sidebar';
import { Button } from './ui/button';
import { Cherry } from 'lucide-react';

function BerryDisplay() {
  return (
    <Button variant="outline" className="flex items-center gap-2">
      <Cherry className="text-red-500" />
      <span className="font-bold">1,250</span>
      <span className="sr-only">Berries</span>
    </Button>
  );
}

export function AppHeader() {
  return (
    <div className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-bold tracking-tight font-headline">Letters with Characters</h1>
      </div>
      <div className="flex items-center gap-4">
        <BerryDisplay />
        <UserNav />
      </div>
    </div>
  );
}
