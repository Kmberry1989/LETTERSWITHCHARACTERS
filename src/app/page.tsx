'use client';

import { useEffect, useState } from 'react';
import { Apple, Chrome, PenSquare, UserPlus, UserRound } from 'lucide-react';
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
    if (error?.message?.startsWith('Redirecting to')) {
      toast({
        title: 'Redirecting',
        description: error.message,
      });
      return;
    }

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

  const handleSocialAuth = async (mode: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      const signedInUser = await auth.signIn({ mode });
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
                onChange={(event) => setUsername(event.target.value.toLowerCase())}
                placeholder="wordplayer"
                autoComplete="username"
                minLength={3}
                maxLength={24}
                autoCapitalize="none"
                autoCorrect="off"
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
            <div className="space-y-2">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Or continue with
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  disabled={isLoading}
                  className="h-12 w-full justify-center gap-3 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-900 hover:shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
                  onClick={() => void handleSocialAuth('google')}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Chrome className="h-4 w-4 text-emerald-600" />
                  </span>
                  <span className="font-medium">Continue with Google</span>
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  className="h-12 w-full justify-center gap-3 rounded-xl border border-slate-950 bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-black hover:text-white hover:shadow-[0_18px_34px_rgba(15,23,42,0.28)]"
                  onClick={() => void handleSocialAuth('apple')}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                    <Apple className="h-4 w-4" />
                  </span>
                  <span className="font-medium">Continue with Apple</span>
                </Button>
              </div>
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
              Usernames use lowercase letters, numbers, and underscores. Google and Apple sign-in use the connected provider profile when available, and will fall back to a full-page redirect if your browser blocks popups. Guest mode is available for quick local play.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
