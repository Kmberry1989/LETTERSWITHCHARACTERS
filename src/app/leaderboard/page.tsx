import AppLayout from '@/components/app-layout';
import LeaderboardTable from '@/components/leaderboard/leaderboard-table';

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Leaderboard</h1>
        </div>
        <LeaderboardTable />
      </div>
    </AppLayout>
  );
}
