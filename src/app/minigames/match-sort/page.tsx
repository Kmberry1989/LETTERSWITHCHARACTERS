import AppLayout from '@/components/app-layout';
import MatchSortGame from '@/components/minigames/match-sort-game';

export default function MatchSortPage() {
  return (
    <AppLayout mode="play">
      <MatchSortGame />
    </AppLayout>
  );
}
