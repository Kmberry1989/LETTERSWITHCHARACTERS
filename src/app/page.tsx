'use client';

import { useEffect, useState } from 'react';
import { PenSquare, UserPlus, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, type AppUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getPostLoginRoute } from '@/lib/auth-flow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      router.replace(getPostLoginRoute(user));
    }
  }, [router, user]);

  const handleAuthSuccess = (signedInUser: AppUser) => {
    toast({
      title: 'Welcome!',
      description: 'You are signed in and ready to play.',
    });
    router.push(getPostLoginRoute(signedInUser));
    setIsLoading(false);
  };

  const handleAuthError = (error: any) => {
    console.error('Authentication Error', error);
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: error.message || 'An unexpected error occurred.',
    });
    setIsLoading(false);
  };

  const handlePasswordAuth = async (action: 'signin' | 'signup') => {
    setIsLoading(true);
    try {
      const signedInUser = await auth.signIn({
        mode: 'email',
        action,
        username,
        password,
        displayName: username,
      });
      handleAuthSuccess(signedInUser);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleGuestAuth = async () => {
    setIsLoading(true);
    try {
      const signedInUser = await auth.signIn({
        mode: 'guest',
        displayName: username.trim() || 'Guest Player',
      });
      handleAuthSuccess(signedInUser);
    } catch (error) {
      handleAuthError(error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] p-4">
      <Card className="w-full max-w-md border-slate-200/80 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <PenSquare className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Letters with Characters</CardTitle>
          <CardDescription>
            Sign in or create an account, then jump straight into the lobby. You can add a profile picture from settings any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handlePasswordAuth('signin');
            }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="wordplayer"
                autoComplete="username"
                minLength={3}
                maxLength={24}
                pattern="[a-z0-9_]+"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                <UserRound className="mr-2 h-4 w-4" /> Sign In
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading}
                className="w-full"
                onClick={() => void handlePasswordAuth('signup')}
              >
                <UserPlus className="mr-2 h-4 w-4" /> Create Account
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                className="w-full"
                onClick={() => void handleGuestAuth()}
              >
                Continue as Guest
              </Button>
            </div>
            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              Usernames use lowercase letters, numbers, and underscores. Google sign-in uses your account picture automatically when available. Guest mode is available for quick local play.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
