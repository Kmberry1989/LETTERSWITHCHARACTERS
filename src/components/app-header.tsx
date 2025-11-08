'use client';

import { UserNav } from '@/components/user-nav';
import { SidebarTrigger } from './ui/sidebar';
import { Button } from './ui/button';
import { Cherry } from 'lucide-react';
import { useBerries } from '@/hooks/use-berries';


function BerryDisplay() {
  const { berries } = useBerries();
  return (
    <Button variant="outline" className="flex items-center gap-2">
      <Cherry className="text-red-500" />
      <span className="font-bold">{berries.toLocaleString()}</span>
      <span className="sr-only">Berries</span>
    </Button>
  );
}

export function AppHeader() {
  return (
    <div className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-xl font-bold tracking-tight font-headline md:hidden">Letters with Characters</h1>
      </div>
      <div className="flex items-center gap-4">
        <BerryDisplay />
        <UserNav />
      </div>
    </div>
  );
}
