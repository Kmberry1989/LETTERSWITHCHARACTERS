import AppLayout from '@/components/app-layout';
import SolitaireSprintGame from '@/components/minigames/solitaire-sprint-game';

export default function SolitairePage() {
  return (
    <AppLayout mode="play">
      <SolitaireSprintGame />
    </AppLayout>
  );
}
