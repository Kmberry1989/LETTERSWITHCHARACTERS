import { Cat, Chrome } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Cat className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Letters with Characters</CardTitle>
          <CardDescription>Sign in to start playing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Button asChild>
              <Link href="/">
                <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/" className="underline hover:text-primary">
              Continue as guest
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
