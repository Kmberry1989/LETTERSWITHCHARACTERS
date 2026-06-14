import AppLayout from '@/components/app-layout';
import WordConnectGame from '@/components/minigames/word-connect-game';

export default function WordConnectPage() {
  return (
    <AppLayout mode="play">
      <WordConnectGame />
    </AppLayout>
  );
}
