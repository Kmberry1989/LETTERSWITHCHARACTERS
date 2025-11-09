'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '../ui/card';
import { useEffect, useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Skeleton } from '../ui/skeleton';

const themes = [
  { id: 'default', name: 'Classic Red', primary: '231 48% 48%', accent: '55 100% 61.2%' },
  { id: 'forest', name: 'Forest Green', primary: '142 76% 36%', accent: '45 80% 60%' },
  { id: 'cosmic', name: 'Cosmic Purple', primary: '262 84% 59%', accent: '280 80% 70%' },
  { id: 'ocean', name: 'Ocean Blue', primary: '210 80% 50%', accent: '190 70% 60%' },
  { id: 'sunset', name: 'Sunset Orange', primary: '25 95% 53%', accent: '40 90% 65%' },
  { id: 'mono', name: 'Monochrome', primary: '240 10% 3.9%', accent: '240 5% 65%' },
];

function ThemeSelectorSkeleton() {
    return (
        <div>
            <h2 className="mb-4 text-xl font-bold font-headline">UI Themes</h2>
             <p className="mb-6 text-muted-foreground">
                Choose a theme for the application UI. This will change colors throughout the app.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
        </div>
    )
}

export default function ThemeSelector() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    return user && firestore ? doc(firestore, `users/${user.uid}`) : null;
  }, [user, firestore]);
  
  const { data: userProfile, loading } = useDoc<UserProfile>(userDocRef);
  const [selectedTheme, setSelectedTheme] = useState('default');

  useEffect(() => {
    if (userProfile?.themeId) {
      const root = document.documentElement;
      const theme = themes.find(t => t.id === userProfile.themeId);
      if (theme) {
        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--accent', theme.accent);
        setSelectedTheme(theme.id);
      }
    }
  }, [userProfile]);

  const handleThemeChange = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme || !user || !userDocRef) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--accent', theme.accent);
    setSelectedTheme(themeId);

    const updatePayload = { themeId };
    updateDoc(userDocRef, updatePayload)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updatePayload,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error Saving Theme',
                description: 'Could not save your theme preference.',
            });
        });
  };
  
  if (loading) {
    return <ThemeSelectorSkeleton />;
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold font-headline">UI Themes</h2>
      <p className="mb-6 text-muted-foreground">
        Choose a theme for the application UI. This will change colors throughout the app.
      </p>
      <RadioGroup value={selectedTheme} onValueChange={handleThemeChange} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {themes.map((theme) => (
          <Card key={theme.id}>
            <Label
              htmlFor={theme.id}
              className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
            >
              <div className="flex items-center gap-4 w-full">
                <RadioGroupItem value={theme.id} id={theme.id} />
                <div className="flex items-center gap-2">
                  <div style={{ backgroundColor: `hsl(${theme.primary})` }} className="w-6 h-6 rounded-full" />
                  <span className="font-semibold">{theme.name}</span>
                </div>
              </div>
            </Label>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}
