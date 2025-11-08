import AppLayout from '@/components/app-layout';
import WordSearchGrid from '@/components/minigames/word-search-grid';

export default function WordSearchPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Word Search</h1>
        </div>
        <WordSearchGrid />
      </div>
    </AppLayout>
  );
}
