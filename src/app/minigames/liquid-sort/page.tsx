import AppLayout from '@/components/app-layout';
import LiquidSortGame from '@/components/minigames/liquid-sort-game';

export default function LiquidSortPage() {
  return (
    <AppLayout mode="play">
      <LiquidSortGame />
    </AppLayout>
  );
}
