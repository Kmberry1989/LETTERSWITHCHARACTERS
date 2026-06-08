import AppLayout from '@/components/app-layout';
import WheelGame from '@/components/minigames/wheel-game';

export default function WheelPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <WheelGame />
      </div>
    </AppLayout>
  );
}
