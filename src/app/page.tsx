'use client';

import { useEffect, useState } from 'react';
import { PenSquare, Chrome } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, type AppUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { getPostLoginRoute } from '@/lib/auth-flow';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      router.replace(getPostLoginRoute(user));
    }
  }, [router, user]);

  const handleAuthSuccess = (signedInUser: AppUser) => {
    toast({
      title: 'Welcome!',
      description: 'You are signed in. Finish avatar setup to start playing.',
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await auth.signIn({
        mode: 'google',
      });
      handleAuthSuccess(user);
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
            Sign in with Google, then choose your playable 3D character before entering the lobby.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 py-4">
            <Button onClick={handleGoogleSignIn} disabled={isLoading} className="h-11 w-full shadow-sm">
              <Chrome className="mr-2 h-4 w-4" /> Continue with Google
            </Button>
            <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
              Every playable account now completes one avatar setup step after sign-in. Your chosen character appears in the lobby, profile, and game UI.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
