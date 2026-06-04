import AppLayout from '@/components/app-layout';
import SolitaireSprintGame from '@/components/minigames/solitaire-sprint-game';

export default function SolitairePage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <SolitaireSprintGame />
      </div>
    </AppLayout>
  );
}
