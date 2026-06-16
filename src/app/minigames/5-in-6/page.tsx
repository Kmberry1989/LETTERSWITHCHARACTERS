import AppLayout from '@/components/app-layout';
import FiveInSixGame from '@/components/minigames/five-in-six-game';

export default function FiveInSixPage() {
  return (
    <AppLayout mode="play">
      <FiveInSixGame />
    </AppLayout>
  );
}
