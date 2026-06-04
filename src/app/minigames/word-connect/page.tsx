import AppLayout from '@/components/app-layout';
import WordConnectGame from '@/components/minigames/word-connect-game';

export default function WordConnectPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <WordConnectGame />
      </div>
    </AppLayout>
  );
}
