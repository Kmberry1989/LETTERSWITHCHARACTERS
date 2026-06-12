import AppLayout from '@/components/app-layout';
import LeaderboardTable from '@/components/leaderboard/leaderboard-table';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-4 sm:p-8">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-7">
          <div className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="relative space-y-3">
            <Badge variant="outline" className="w-fit rounded-full bg-white/70 px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.18em]">
              <Trophy className="mr-1 h-3.5 w-3.5 text-amber-500" />
              Tournament Board
            </Badge>
            <div>
              <h1 className="text-3xl font-black tracking-tight font-headline sm:text-4xl">Leaderboard</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                Track top scores, best turns, wins, and word-play momentum.
              </p>
            </div>
          </div>
        </div>
        <LeaderboardTable />
      </div>
    </AppLayout>
  );
}
