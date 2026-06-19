'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type GameScreenProps = {
  children: ReactNode;
  className?: string;
};

export function GameScreen({ children, className }: GameScreenProps) {
  return (
    <div
      className={cn(
        'mx-auto flex h-[100svh] w-full max-w-7xl min-w-0 flex-col overflow-hidden px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] md:px-6 md:py-5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function PlayModeDocumentLock() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add('play-mode-locked');
    body.classList.add('play-mode-locked');

    return () => {
      html.classList.remove('play-mode-locked');
      body.classList.remove('play-mode-locked');
    };
  }, []);

  return null;
}

export function GameBackButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className="fixed left-2 top-[max(0.5rem,env(safe-area-inset-top))] z-50 h-10 w-10 rounded-full bg-white/88 shadow-lg backdrop-blur md:hidden"
      aria-label="Go back"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/minigames');
        }
      }}
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
