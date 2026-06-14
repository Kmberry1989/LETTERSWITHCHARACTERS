import AppLayout from '@/components/app-layout';
import WheelGame from '@/components/minigames/wheel-game';

export default function WheelPage() {
  return (
    <AppLayout mode="play">
      <WheelGame />
    </AppLayout>
  );
}
