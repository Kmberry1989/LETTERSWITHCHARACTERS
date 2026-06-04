import AppLayout from '@/components/app-layout';
import MatchSortGame from '@/components/minigames/match-sort-game';

export default function MatchSortPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <MatchSortGame />
      </div>
    </AppLayout>
  );
}
