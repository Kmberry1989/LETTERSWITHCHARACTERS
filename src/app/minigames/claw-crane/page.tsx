import AppLayout from '@/components/app-layout';
import ClawCraneGame from '@/app/minigames/claw-crane/client';

export default function ClawCranePage() {
  return (
    <AppLayout mode="play">
      <ClawCraneGame />
    </AppLayout>
  );
}
