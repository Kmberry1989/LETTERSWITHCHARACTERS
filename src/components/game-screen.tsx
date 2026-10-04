'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CircleHelp, RotateCcw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MODE_METADATA, type RetentionModeId } from '@/lib/retention';
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

type GameModeHeaderProps = {
  modeId: RetentionModeId;
  statLabel: string;
  statValue: string | number;
  onRestart: () => void;
  hasProgress?: boolean;
};

export function GameModeHeader({ modeId, statLabel, statValue, onRestart, hasProgress = false }: GameModeHeaderProps) {
  const mode = MODE_METADATA[modeId];
  const restartButton = (
    <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/85 sm:w-auto sm:px-3" onClick={hasProgress ? undefined : onRestart} aria-label="Restart">
      <RotateCcw className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Restart</span>
    </Button>
  );

  return (
    <header className="ml-11 flex min-h-12 items-center gap-2 rounded-2xl border border-white/70 bg-white/78 px-3 py-2 shadow-sm backdrop-blur md:ml-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate font-headline text-lg font-black text-slate-950 md:text-xl">{mode.title}</h1>
          <Badge variant="secondary" className="hidden rounded-full text-[0.65rem] min-[430px]:inline-flex">{statLabel}: {statValue}</Badge>
        </div>
        <p className="hidden truncate text-xs font-semibold text-slate-600 sm:block">{mode.objective}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="hidden rounded-full bg-white/70 lg:inline-flex"><Volume2 className="mr-1.5 h-3.5 w-3.5" />Sound in Profile</Badge>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/85 sm:w-auto sm:px-3" aria-label="How to play"><CircleHelp className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">How to play</span></Button>
          </DialogTrigger>
          <DialogContent className="rounded-[1.75rem]">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">How to play {mode.title}</DialogTitle>
              <DialogDescription>{mode.objective}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-slate-700">
              <p>{mode.instructions}</p>
              <p><strong>Finish:</strong> {mode.completionRule}</p>
              <p><strong>Accessible controls:</strong> {mode.accessibilityInstructions}</p>
            </div>
          </DialogContent>
        </Dialog>
        {hasProgress ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>{restartButton}</AlertDialogTrigger>
            <AlertDialogContent className="rounded-[1.75rem]">
              <AlertDialogHeader>
                <AlertDialogTitle>Restart this run?</AlertDialogTitle>
                <AlertDialogDescription>Your current progress will be discarded. Abandoned runs do not earn rewards.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep playing</AlertDialogCancel>
                <AlertDialogAction onClick={onRestart}>Restart run</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : restartButton}
        <Button asChild variant="secondary" size="sm" className="hidden rounded-full md:inline-flex">
          <Link href="/minigames"><ArrowLeft className="mr-2 h-4 w-4" />Arcade</Link>
        </Button>
      </div>
    </header>
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
