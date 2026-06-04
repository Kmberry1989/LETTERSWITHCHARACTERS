import AppLayout from '@/components/app-layout';
import LiquidSortGame from '@/components/minigames/liquid-sort-game';

export default function LiquidSortPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <LiquidSortGame />
      </div>
    </AppLayout>
  );
}
