'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { UserPlus, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, type AppUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getPostLoginRoute } from '@/lib/auth-flow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-2 3l3.2 2.5c1.9-1.8 3-4.4 3-7.6 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="#34A853" d="M12 21c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.7-1.7-5.5-4H3.2v2.6C4.8 18.8 8.1 21 12 21z" />
      <path fill="#4A90E2" d="M6.5 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.4H3.2C2.4 8 2 9.5 2 11s.4 3 1.2 4.6L6.5 13z" />
      <path fill="#FBBC05" d="M12 5c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17 1.9 14.7 1 12 1 8.1 1 4.8 3.2 3.2 6.4L6.5 9c.8-2.3 2.9-4 5.5-4z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
      <path d="M16.72 12.62c.03 3.12 2.74 4.16 2.77 4.17-.02.07-.43 1.5-1.42 2.97-.86 1.27-1.75 2.53-3.16 2.56-1.39.03-1.84-.82-3.43-.82-1.6 0-2.09.8-3.4.85-1.36.05-2.4-1.36-3.27-2.62-1.77-2.56-3.12-7.24-1.3-10.4.9-1.57 2.52-2.57 4.28-2.6 1.33-.03 2.58.9 3.4.9.81 0 2.34-1.11 3.95-.95.67.03 2.56.27 3.78 2.06-.1.06-2.26 1.32-2.24 3.88ZM13.95 4.87c.72-.87 1.2-2.08 1.07-3.29-1.04.04-2.29.69-3.04 1.56-.66.76-1.24 1.98-1.09 3.15 1.16.09 2.34-.59 3.06-1.42Z" />
    </svg>
  );
}

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
      <Card className="relative w-full max-w-3xl overflow-hidden border-white/60 bg-white/82 shadow-[0_30px_80px_rgba(120,53,15,0.18)] backdrop-blur">
        <div className="grid items-stretch md:grid-cols-[0.8fr_1fr]">
          <div className="relative hidden overflow-hidden bg-[linear-gradient(180deg,rgba(255,244,214,0.9),rgba(255,226,214,0.96))] p-8 md:block">
            <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-rose-200/45 blur-3xl" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <div className="relative h-36 w-36 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-4 ring-white/60">
                <Image src="/interface/logo.png" alt="Letters with Characters logo" fill className="object-cover" priority />
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
                  className="h-12 w-full justify-center gap-3 rounded-xl border border-[#dadce0] bg-white text-[#1f1f1f] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#1f1f1f] hover:shadow-[0_16px_30px_rgba(15,23,42,0.12)]"
                  onClick={() => void handleSocialAuth('google')}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#dadce0] bg-white shadow-sm">
                    <GoogleMark />
                  </span>
                  <span className="font-medium">Sign in with Google</span>
                </Button>
                <Button
                  type="button"
                  disabled={isLoading}
                  className="h-12 w-full justify-center gap-3 rounded-xl border border-black bg-black text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-[#111] hover:text-white hover:shadow-[0_18px_34px_rgba(15,23,42,0.28)]"
                  onClick={() => void handleSocialAuth('apple')}
                >
                  <span className="flex h-5 w-5 items-center justify-center text-white">
                    <AppleMark />
                  </span>
                  <span className="font-medium">Sign in with Apple</span>
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
          </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
