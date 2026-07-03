'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { UserPlus, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InterfaceOrnament } from '@/components/interface-ornament';
import { useAuth, useUser, type AppUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getPostLoginRoute } from '@/lib/auth-flow';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, userError } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
      setIsLoading(false);
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
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#fff7eb] p-3 sm:p-5">
      <div className="pointer-events-none absolute inset-0">
        <Image src="/interface/backgrounds/login-burst.png" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_30%),linear-gradient(180deg,rgba(255,252,245,0.1),rgba(255,238,224,0.2)_60%,rgba(255,243,235,0.58)_100%)]" />
        <InterfaceOrnament src="/interface/ornaments/floating-star-large.svg" className="float-orbit left-[4%] top-[10%] hidden h-24 w-24 md:block lg:h-32 lg:w-32" priority />
        <InterfaceOrnament src="/interface/ornaments/floating-star-small.svg" className="glimmer-soft right-[7%] top-[14%] h-16 w-16 md:h-20 md:w-20" priority />
        <InterfaceOrnament src="/interface/ornaments/floating-star-small.svg" className="float-slow bottom-[11%] left-[10%] h-12 w-12 opacity-80 md:h-16 md:w-16" />
        <InterfaceOrnament src="/interface/ornaments/spark-swish.svg" className="drift-swish -right-[12%] bottom-[8%] h-20 w-[22rem] opacity-75 md:bottom-[10%] md:h-28 md:w-[30rem]" />
      </div>

      <Card className="relative w-full max-w-[44rem] overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/68 shadow-[0_24px_70px_rgba(120,53,15,0.18)] backdrop-blur-xl">
        <div className="grid items-stretch md:grid-cols-[0.72fr_1fr]">
          <div className="relative hidden min-h-[26rem] overflow-hidden border-r border-white/50 bg-gradient-to-br from-white/45 via-white/25 to-orange-100/35 md:block">
            <div className="absolute inset-0 rounded-none ring-1 ring-inset ring-white/55" />
            <InterfaceOrnament src="/interface/ornaments/spark-swish.svg" className="drift-swish left-[-8%] top-[16%] h-20 w-[17rem] opacity-80" />
            <InterfaceOrnament src="/interface/ornaments/floating-star-large.svg" className="float-orbit right-[6%] top-[12%] h-24 w-24" />
            <InterfaceOrnament src="/interface/ornaments/floating-star-small.svg" className="glimmer-soft bottom-[16%] left-[12%] h-16 w-16" />
            <div className="relative z-10 flex h-full flex-col justify-between p-6">
              <div className="max-w-xs rounded-[1.5rem] border border-white/60 bg-white/32 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-[#b75d26]">Storybook Lobby</p>
                <p className="mt-2 text-sm leading-6 text-[#7f4a2a]">Sign in to jump into matches, chat in the lobby, and keep building your character collection.</p>
              </div>
              <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-[2rem] bg-white/88 shadow-[0_24px_42px_rgba(202,111,39,0.2)] ring-4 ring-white/70">
                <Image src="/interface/logo.png" alt="Letters with Characters logo" fill className="object-cover" priority />
              </div>
            </div>
          </div>

          <div className="p-2 md:p-3">
            <Card className="w-full rounded-[1.4rem] border border-white/70 bg-white/50 shadow-none backdrop-blur-xl md:bg-white/35">
              <CardHeader className="px-5 pb-2 pt-5 text-center sm:px-6">
                <div className="mb-3 flex justify-center md:hidden">
                  <div className="relative h-16 w-16 overflow-hidden rounded-[1.25rem] shadow-lg ring-4 ring-white/70">
                    <Image src="/interface/logo.png" alt="Letters with Characters logo" fill className="object-cover" priority />
                  </div>
                </div>
                <CardTitle className="text-xl font-headline sm:text-2xl">Letters with Characters</CardTitle>
                <p className="text-xs text-muted-foreground sm:text-sm">Pick a sign-in method and head straight into the clubhouse.</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 sm:px-6">
                {userError ? (
                  <Alert variant="destructive" className="mb-4 border-destructive/40 bg-destructive/5">
                    <AlertTitle>Authentication unavailable</AlertTitle>
                    <AlertDescription>{userError.message || 'Could not load the sign-in service.'}</AlertDescription>
                  </Alert>
                ) : null}
                <form onSubmit={(event) => { event.preventDefault(); void handlePasswordAuth('signin'); }} className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="wordplayer" autoComplete="username" minLength={3} maxLength={24} autoCapitalize="none" autoCorrect="off" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="current-password" required />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading} className="w-full"><UserRound className="mr-2 h-4 w-4" /> Sign In</Button>
                    <Button type="button" variant="secondary" disabled={isLoading} className="w-full" onClick={() => void handlePasswordAuth('signup')}><UserPlus className="mr-2 h-4 w-4" /> Create Account</Button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-center text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Or continue with</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button type="button" disabled={isLoading} className="h-11 w-full rounded-xl border border-[#dadce0] bg-white text-[#1f1f1f] shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:bg-white hover:text-[#1f1f1f]" onClick={() => void handleSocialAuth('google')}>Sign in with Google</Button>
                      <Button type="button" disabled={isLoading} className="h-11 w-full rounded-xl border border-black bg-black text-white shadow-[0_14px_28px_rgba(15,23,42,0.22)] hover:bg-[#111] hover:text-white" onClick={() => void handleSocialAuth('apple')}>Sign in with Apple</Button>
                    </div>
                  </div>
                  <Button type="button" variant="outline" disabled={isLoading} className="w-full" onClick={() => void handleGuestAuth()}>Continue as Guest</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
