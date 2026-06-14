import AppLayout from '@/components/app-layout';
import WordSearchGrid from '@/components/minigames/word-search-grid';

export default function WordSearchPage() {
  return (
    <AppLayout mode="play">
      <WordSearchGrid />
    </AppLayout>
  );
}
