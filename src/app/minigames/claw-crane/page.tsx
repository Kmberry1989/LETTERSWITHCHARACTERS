import AppLayout from '@/components/app-layout';
import ClawCraneGame from '@/components/minigames/claw-crane-game';

export default function ClawCranePage() {
  return (
    <AppLayout mode="play">
      <ClawCraneGame />
    </AppLayout>
  );
}
