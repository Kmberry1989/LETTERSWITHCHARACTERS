import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const leaderboardData = [
  { rank: 1, name: 'PixelProwler', score: 2450, avatarId: 'user-3' },
  { rank: 2, name: 'LexiLlama', score: 2310, avatarId: 'user-2' },
  { rank: 3, name: 'WordWizard', score: 2280, avatarId: 'user-1' },
  { rank: 4, name: 'FoxyScrabbler', score: 2150, avatarId: 'avatar-base' },
  { rank: 5, name: 'CaptainQuip', score: 2090, avatarId: 'user-4' },
  { rank: 6, name: 'SilentG', score: 1980, avatarId: 'user-1' },
  { rank: 7, name: 'VowelVortex', score: 1850, avatarId: 'user-2' },
];

export default function LeaderboardTable() {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboardData.map((player) => {
              const avatarImage = PlaceHolderImages.find(p => p.id === player.avatarId);
              return (
                <TableRow key={player.rank} className="h-16">
                  <TableCell className="text-center text-lg font-bold text-muted-foreground">{player.rank}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        {avatarImage && <AvatarImage src={avatarImage.imageUrl} alt={player.name} data-ai-hint={avatarImage.imageHint} />}
                        <AvatarFallback>{player.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold text-primary">{player.score.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
