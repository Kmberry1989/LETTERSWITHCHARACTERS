import AppLayout from '@/components/app-layout';
import { ArcadeSessionButton } from '@/components/retention/arcade-session-button';
import WordSearchGrid from '@/components/minigames/word-search-grid';

export default function WordSearchPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between gap-3 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Word Search</h1>
          <ArcadeSessionButton modeId="word-search" score={80} label="Bank a completed grid" />
        </div>
        <WordSearchGrid />
      </div>
    </AppLayout>
  );
}
