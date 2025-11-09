'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '../ui/badge';

type Player = {
  displayName: string;
  score: number;
  avatarId: string;
  photoURL?: string | null;
};

type ScoreboardProps = {
  players: Player[];
  isPlayerTurn: boolean;
  currentPlayerName: string;
  gameStatus: 'active' | 'pending' | 'finished';
};

const defaultPlayers: Player[] = [
  { displayName: 'WordWizard', score: 125, avatarId: 'user-1' },
  { displayName: 'Alex', score: 98, avatarId: 'user-2' },
];

export default function Scoreboard({ players = defaultPlayers, isPlayerTurn, currentPlayerName, gameStatus }: ScoreboardProps) {
  const player1 = players.find(p => p.displayName === currentPlayerName) || players[0];
  const player2 = players.find(p => p.displayName !== currentPlayerName) || players[1];

  const player1AvatarImage = player1.photoURL || PlaceHolderImages.find(p => p.id === player1.avatarId)?.imageUrl;
  const player2AvatarImage = player2.photoURL || PlaceHolderImages.find(p => p.id === player2.avatarId)?.imageUrl;


  let statusText, statusVariant;
  if (gameStatus === 'finished') {
    statusText = 'Game Over';
    statusVariant = 'destructive' as const;
  } else {
    statusText = isPlayerTurn ? 'Your Turn' : "Opponent's Turn";
    statusVariant = isPlayerTurn ? 'default' : 'secondary';
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="relative flex items-center justify-between gap-4 p-2 sm:p-4">
          <div className="flex flex-1 items-center justify-start gap-3 text-left">
            <Avatar>
              {player1AvatarImage && <AvatarImage src={player1AvatarImage} alt={player1.displayName} />}
              <AvatarFallback>{player1.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{player1.displayName}</div>
              <div className="font-bold text-lg text-primary">{player1.score}</div>
            </div>
          </div>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="font-bold text-2xl text-muted-foreground">VS</div>
            <Badge variant={statusVariant}>
                {statusText}
            </Badge>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 text-right">
            <div>
              <div className="font-medium">{player2.displayName}</div>
              <div className="font-bold text-lg text-primary">{player2.score}</div>
            </div>
             <Avatar>
              {player2AvatarImage && <AvatarImage src={player2AvatarImage} alt={player2.displayName} />}
              <AvatarFallback>{player2.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
      </CardContent>
    </Card>
  );
}
