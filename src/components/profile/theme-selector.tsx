'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '../ui/card';
import { useEffect, useState } from 'react';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Skeleton } from '../ui/skeleton';
import { getInterfaceTheme, INTERFACE_THEMES } from '@/lib/interface-themes';

function applyTheme(themeId: string) {
  const root = document.documentElement;
  const theme = getInterfaceTheme(themeId);
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--background', theme.background);
  root.style.setProperty('--sidebar-background', theme.sidebar);
  root.style.setProperty('--sidebar-accent', theme.sidebarAccent);
}

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
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    return user ? doc(null, 'users', user.uid) : null;
  }, [user]);
  
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);
  const [selectedTheme, setSelectedTheme] = useState('default');

  useEffect(() => {
    const themeId = userProfile?.themeId || 'default';
    applyTheme(themeId);
    setSelectedTheme(themeId);
  }, [userProfile]);

  const handleThemeChange = (themeId: string) => {
    if (!user || !userDocRef) return;
    applyTheme(themeId);
    setSelectedTheme(themeId);

    const updatePayload = { themeId };
    updateDoc(userDocRef, updatePayload)
        .catch(() => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updatePayload,
                user,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
            toast({
                variant: 'destructive',
                title: 'Error Saving Theme',
                description: 'Could not save your theme preference.',
            });
        });
  };
  
  if (isLoading) {
    return <ThemeSelectorSkeleton />;
  }

  return (
    <div>
      <h2 className="mb-3 text-xl font-bold font-headline">Interface Themes</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Choose one saved interface theme. Board colors are handled separately in Board and Tile Style.
      </p>
      <RadioGroup value={selectedTheme} onValueChange={handleThemeChange} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {INTERFACE_THEMES.map((theme) => (
          <Card key={theme.id} className="overflow-hidden">
            <Label
              htmlFor={theme.id}
              className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent/60 [&:has([data-state=checked])]:border-primary"
            >
              <div className="flex w-full items-center gap-4">
                <RadioGroupItem value={theme.id} id={theme.id} />
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex gap-1">
                    <div style={{ backgroundColor: `hsl(${theme.primary})` }} className="h-5 w-5 rounded-md" />
                    <div style={{ backgroundColor: `hsl(${theme.accent})` }} className="h-5 w-5 rounded-md" />
                  </div>
                  <span className="font-semibold">{theme.name}</span>
                </div>
              </div>
              <div
                className="mt-3 h-10 w-full rounded-xl border border-black/5"
                style={{
                  background: `linear-gradient(135deg, hsl(${theme.background}) 0%, hsl(${theme.sidebar}) 50%, hsl(${theme.sidebarAccent}) 100%)`,
                }}
              />
            </Label>
          </Card>
        ))}
      </RadioGroup>
    </div>
  );
}
