'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Apple, Chrome, Sparkles, Star, UserPlus, UserRound } from 'lucide-react';
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,193,7,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_26%),linear-gradient(180deg,#fff8ef_0%,#ffe6c7_45%,#ffd7d3_100%)] p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[12%] h-24 w-24 animate-bounce rounded-full bg-white/35 blur-2xl [animation-duration:5.5s]" />
        <div className="absolute right-[12%] top-[18%] h-32 w-32 animate-pulse rounded-full bg-pink-300/25 blur-3xl" />
        <div className="absolute bottom-[10%] left-[18%] h-28 w-28 animate-bounce rounded-full bg-sky-300/25 blur-3xl [animation-duration:7s]" />
      </div>
      <Card className="relative w-full max-w-5xl overflow-hidden border-white/60 bg-white/82 shadow-[0_30px_80px_rgba(120,53,15,0.18)] backdrop-blur">
        <div className="grid items-stretch md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden overflow-hidden bg-[linear-gradient(180deg,rgba(255,244,214,0.9),rgba(255,226,214,0.96))] p-10 md:block">
            <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-rose-200/45 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="space-y-6">
                <div className="relative h-28 w-28 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-4 ring-white/60">
                  <Image src="/interface/logo.png" alt="Letters with Characters logo" fill className="object-cover" priority />
                </div>
                <div className="space-y-3">
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-primary shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    Wordplay clubhouse
                  </p>
                  <h1 className="font-headline text-5xl font-black leading-none text-slate-900">Letters with Characters</h1>
                  <p className="max-w-md text-lg text-slate-700">
                    Build bright words, collect stylish tiles, and jump into lively matches with a more playful board game lobby.
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white/75 p-4 shadow-sm"><Star className="h-5 w-5 text-amber-500" /> Drag tiles straight onto the board</div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/75 p-4 shadow-sm"><Star className="h-5 w-5 text-rose-500" /> Track scores, wins, and best games</div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/75 p-4 shadow-sm"><Star className="h-5 w-5 text-sky-500" /> Pick your own interface color theme</div>
              </div>
            </div>
          </div>
          <div className="p-2">
            <Card className="w-full border-slate-200/70 shadow-none md:border-0">
              <CardHeader className="text-center">
                <div className="mb-4 flex justify-center md:hidden">
                  <div className="relative h-20 w-20 overflow-hidden rounded-[1.5rem] shadow-lg ring-4 ring-white/70">
                    <Image src="/interface/logo.png" alt="Letters with Characters logo" fill className="object-cover" priority />
                  </div>
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
        </div>
      </Card>
    </div>
  );
}
