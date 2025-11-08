import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type Player = {
  name: string;
  score: number;
  avatarId: string;
};

type ScoreboardProps = {
  players: Player[];
};

const defaultPlayers: Player[] = [
  { name: 'You', score: 125, avatarId: 'user-1' },
  { name: 'Alex', score: 98, avatarId: 'user-2' },
  { name: 'Foxy', score: 153, avatarId: 'avatar-base' },
];

export default function Scoreboard({ players = defaultPlayers }: ScoreboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoreboard</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {players.map((player) => {
            const avatarImage = PlaceHolderImages.find(p => p.id === player.avatarId);
            return (
              <li key={player.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={player.name} data-ai-hint={avatarImage.imageHint} />}
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="font-bold text-lg text-primary">{player.score}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
