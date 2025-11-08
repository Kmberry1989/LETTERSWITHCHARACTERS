import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '../ui/badge';

type Player = {
  name: string;
  score: number;
  avatarId: string;
};

type ScoreboardProps = {
  players: Player[];
  isPlayerTurn: boolean;
};

const defaultPlayers: Player[] = [
  { name: 'You', score: 125, avatarId: 'user-1' },
  { name: 'Alex', score: 98, avatarId: 'user-2' },
];

export default function Scoreboard({ players = defaultPlayers, isPlayerTurn }: ScoreboardProps) {
  const player1 = players.find(p => p.name === 'You') || players[0];
  const player2 = players.find(p => p.name !== 'You') || players[1];

  const player1Avatar = PlaceHolderImages.find(p => p.id === player1.avatarId);
  const player2Avatar = PlaceHolderImages.find(p => p.id === player2.avatarId);

  return (
    <Card>
      <CardContent className="relative p-2 sm:p-4">
        <div className="flex items-center justify-between gap-4 sm:gap-8">
          <div className="flex flex-1 items-center gap-3 justify-start">
            <Avatar>
              {player1Avatar && <AvatarImage src={player1Avatar.imageUrl} alt={player1.name} data-ai-hint={player1Avatar.imageHint} />}
              <AvatarFallback>{player1.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="font-medium">{player1.name}</div>
              <div className="font-bold text-lg text-primary">{player1.score}</div>
            </div>
          </div>
          
          <div className="font-bold text-2xl text-muted-foreground">VS</div>

          <div className="flex flex-1 items-center gap-3 justify-end">
            <div className="text-right">
              <div className="font-medium">{player2.name}</div>
              <div className="font-bold text-lg text-primary">{player2.score}</div>
            </div>
             <Avatar>
              {player2Avatar && <AvatarImage src={player2Avatar.imageUrl} alt={player2.name} data-ai-hint={player2Avatar.imageHint} />}
              <AvatarFallback>{player2.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pt-10">
            <Badge variant={isPlayerTurn ? 'default' : 'secondary'}>
                {isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}
            </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
