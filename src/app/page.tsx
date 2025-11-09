'use client';

import { useState } from 'react';
import { PenSquare, Chrome, Mail, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useFirestore } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// Function to create or update user profile in Firestore
const updateUserProfile = (firestore: any, user: User) => {
  const userDocRef = doc(firestore, 'users', user.uid);
  const profileData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    // Initialize other fields if necessary
    totalScore: 0,
    avatarId: 'user-1', // Default avatar
  };
  
  setDoc(userDocRef, profileData, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'write',
        requestResourceData: profileData,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
  });
};

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = (user: User) => {
    if (firestore) {
      updateUserProfile(firestore, user);
    }
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
    if (!auth) return;
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      handleAuthSuccess(result.user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const result = await signInAnonymously(auth);
       const userWithDisplayName = { ...result.user, displayName: "Anonymous Player" } as User;
      handleAuthSuccess(userWithDisplayName);
    } catch (error) {
      handleAuthError(error);
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      handleAuthSuccess(result.user);
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      handleAuthSuccess(result.user);
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
                  <Chrome className="mr-2 h-4 w-4" /> Sign in with Google
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
