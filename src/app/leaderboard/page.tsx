import AppLayout from '@/components/app-layout';
import LeaderboardTable from '@/components/leaderboard/leaderboard-table';

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-3 p-3 sm:p-6">
        <h1 className="sr-only">Leaderboard</h1>
        <LeaderboardTable />
      </div>
    </AppLayout>
  );
}
