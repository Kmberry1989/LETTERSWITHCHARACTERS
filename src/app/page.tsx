'use client';

import { useState } from 'react';
import { PenSquare, Chrome, Mail, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, type AppUser } from '@/firebase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = (_user: AppUser) => {
    toast({
      title: 'Welcome!',
      description: 'You have successfully signed in.',
    });
    router.push('/dashboard');
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
        email: email || undefined,
        displayName: email ? email.split('@')[0] : 'Google Player',
      });
      handleAuthSuccess(user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await auth.signIn({ mode: 'guest', displayName: 'Anonymous Player' });
      handleAuthSuccess(user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await auth.signIn({ mode: 'email', email, password, displayName: email.split('@')[0] });
      handleAuthSuccess(user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await auth.signIn({ mode: 'email', email, password, displayName: email.split('@')[0] });
      handleAuthSuccess(user);
    } catch (error) {
      handleAuthError(error);
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
          <Tabs defaultValue="social">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
            <TabsContent value="social">
              <div className="flex flex-col space-y-4 py-4">
                <Button onClick={handleGoogleSignIn} disabled={isLoading} className="shadow-sm">
                  <Chrome className="mr-2 h-4 w-4" /> Continue without Firebase
                </Button>
                <Button variant="secondary" onClick={handleAnonymousSignIn} disabled={isLoading} className="shadow-sm">
                  <UserIcon className="mr-2 h-4 w-4" /> Continue as Guest
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="email">
              <form onSubmit={handleEmailSignIn}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading} className="w-full">
                      <Mail className="mr-2 h-4 w-4" /> Login
                    </Button>
                    <Button type="button" onClick={handleEmailSignUp} variant="secondary" disabled={isLoading} className="w-full">
                      Sign Up
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
