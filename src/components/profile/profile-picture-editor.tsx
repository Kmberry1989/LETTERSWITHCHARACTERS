'use client';

import { useEffect, useState } from 'react';
import { useAuth, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { resolveAvatarImage } from '@/lib/avatar-catalog';

export default function ProfilePictureEditor() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPhotoURL(userProfile?.photoURL || user?.photoURL || '');
  }, [user?.photoURL, userProfile?.photoURL]);

  const handleSave = async () => {
    if (!userDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(userDocRef, {
        photoURL: photoURL.trim() || null,
        updatedAt: new Date().toISOString(),
      });
      await auth.refresh();
      toast({
        title: 'Profile picture updated',
        description: 'Your account image will be used across the app.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Could not save profile picture',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const avatarImage = resolveAvatarImage({ photoURL });
  const fallback = (userProfile?.displayName || user?.displayName || 'P').slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Use a direct image URL, or sign in with Google to automatically use your Google profile photo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {avatarImage && <AvatarImage src={avatarImage} alt={userProfile?.displayName || user?.displayName || 'Profile picture'} />}
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className="text-sm text-muted-foreground">
            This image is associated with your account and appears in navigation, the lobby, scoreboard, and leaderboard.
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="photo-url">Image URL</Label>
          <Input
            id="photo-url"
            value={photoURL}
            onChange={(event) => setPhotoURL(event.target.value)}
            placeholder="https://example.com/me.png"
            disabled={isLoading || isSaving}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void handleSave()} disabled={isLoading || isSaving}>
            {isSaving ? 'Saving...' : 'Save Picture'}
          </Button>
          <Button
            variant="outline"
            disabled={isLoading || isSaving || !photoURL}
            onClick={() => setPhotoURL('')}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
