import AppLayout from '@/components/app-layout';
import GameActions from '@/components/game/game-actions';
import GameBoard from '@/components/game/game-board';
import Scoreboard from '@/components/game/scoreboard';
import TileRack from '@/components/game/tile-rack';
import { Card, CardContent } from '@/components/ui/card';

export default function GamePage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-2 sm:p-4">
                <GameBoard />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Scoreboard />
            <GameActions />
          </div>
        </div>
        <TileRack />
      </div>
    </AppLayout>
  );
}
