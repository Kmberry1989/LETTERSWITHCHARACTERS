
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUsers } from '@/firebase';
import { Skeleton } from '../ui/skeleton';


export default function LeaderboardTable() {
  const { users, loading } = useUsers();
  
  // Create a sorted list of players for the leaderboard
  const leaderboardData = users
    .map(user => ({
      name: user.displayName || 'Anonymous',
      // For demo, if totalScore doesn't exist, generate a random one
      score: user.totalScore || Math.floor(Math.random() * 2500),
      avatarId: user.avatarId || 'user-1' 
    }))
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({ ...player, rank: index + 1 }));

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
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`} className="h-16">
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-6 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-6 w-32" />
                      </div>
                  </TableCell>
                  <TableCell className="text-right">
                       <Skeleton className="h-6 w-20 ml-auto" />
                  </TableCell>
              </TableRow>
            ))}
            {!loading && leaderboardData.map((player) => {
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
