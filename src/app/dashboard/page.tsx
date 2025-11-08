import Link from 'next/link';
import AppLayout from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const games = [
  {
    id: 1,
    opponent: { name: 'Alex', avatarId: 'user-2' },
    status: "Your Turn",
    isPlayerTurn: true,
  },
  {
    id: 2,
    opponent: { name: 'Foxy', avatarId: 'avatar-base' },
    status: "Opponent's Turn",
    isPlayerTurn: false,
  },
  {
    id: 3,
    opponent: { name: 'PixelProwler', avatarId: 'user-3' },
    status: 'Your Turn',
    isPlayerTurn: true,
  },
  {
    id: 4,
    opponent: { name: 'CaptainQuip', avatarId: 'user-4' },
    status: 'Game Over',
    isPlayerTurn: false,
  }
];

function GameCard({ game }: { game: (typeof games)[0] }) {
  const opponentAvatar = PlaceHolderImages.find((p) => p.id === game.opponent.avatarId);
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          {opponentAvatar && (
            <AvatarImage
              src={opponentAvatar.imageUrl}
              alt={game.opponent.name}
              data-ai-hint={opponentAvatar.imageHint}
            />
          )}
          <AvatarFallback>{game.opponent.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>vs. {game.opponent.name}</CardTitle>
          <CardDescription>
             <Badge variant={game.isPlayerTurn ? 'default' : 'secondary'} className="mt-1">
                {game.status}
            </Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full">
          <Link href={`/?game=${game.id}`}>Open Game</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 sm:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight font-headline">Your Games</h1>
           <Button>New Game</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
           <Card className="flex flex-col items-center justify-center border-dashed text-center p-6">
            <CardHeader>
              <CardTitle>Create a New Game</CardTitle>
              <CardDescription>Challenge a friend or a random opponent.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>Find Match</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
