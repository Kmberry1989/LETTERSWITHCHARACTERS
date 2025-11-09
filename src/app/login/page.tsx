'use client';

import { PenSquare, Chrome } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <PenSquare className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Letters with Characters</CardTitle>
          <CardDescription>Sign in to start playing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <Button onClick={handleSignIn} className="shadow-sm">
              <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
