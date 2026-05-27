'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import AvatarViewer from '@/components/profile/avatar-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from '@/lib/client/document-client';
import { avatarCatalog, getAvatarPresetById, hasCompletedAvatarOnboarding, isAvatarMetadataComplete } from '@/lib/avatar-catalog';
import type { UserProfile } from '@/firebase/firestore/use-users';
import { cn } from '@/lib/utils';

type AvatarSelectionPanelProps = {
  title: string;
  description: string;
  ctaLabel: string;
  onCompleteRoute?: string;
};

function AvatarSelectionSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Skeleton className="min-h-[420px] rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
    </div>
  );
}

export default function AvatarSelectionPanel({
  title,
  description,
  ctaLabel,
  onCompleteRoute = '/dashboard',
}: AvatarSelectionPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile, isLoading } = useDoc<UserProfile>(userDocRef);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(avatarCatalog[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    if (userProfile?.avatarPresetId) {
      setSelectedPresetId(userProfile.avatarPresetId);
    }
  }, [userProfile?.avatarPresetId]);

  const selectedPreset = useMemo(() => getAvatarPresetById(selectedPresetId) ?? avatarCatalog[0], [selectedPresetId]);
  const metadataValid = isAvatarMetadataComplete(selectedPreset);
  const canSave = Boolean(user && userDocRef && selectedPreset && metadataValid && !isSaving);
  const onboardingComplete = hasCompletedAvatarOnboarding(userProfile);

  useEffect(() => {
    if (userProfile && onboardingComplete && onCompleteRoute === '/dashboard') {
      setSelectedPresetId(userProfile.avatarPresetId || selectedPresetId);
    }
  }, [onboardingComplete, onCompleteRoute, selectedPresetId, userProfile]);

  const handleSave = async () => {
    if (!user || !userDocRef || !selectedPreset || !metadataValid) {
      toast({
        variant: 'destructive',
        title: 'Avatar unavailable',
        description: 'This avatar preset is missing required metadata and cannot be saved yet.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await updateDoc(userDocRef, {
        avatarId: null,
        avatarPresetId: selectedPreset.id,
        avatarModelUrl: selectedPreset.modelUrl,
        avatarPosterUrl: selectedPreset.posterUrl,
        avatarConfiguredAt: now,
        onboardingCompletedAt: now,
      });

      toast({
        title: onboardingComplete ? 'Avatar updated' : 'Avatar ready',
        description: onboardingComplete
          ? `${selectedPreset.name} is now your active player avatar.`
          : `${selectedPreset.name} is now ready for play.`,
      });

      await auth.refresh();
      router.push(onCompleteRoute);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Could not save avatar',
        description: error?.message || 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !userProfile) {
    return <AvatarSelectionSkeleton />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <div>
          <h2 className="font-headline text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>

        {!metadataValid && (
          <Alert variant="destructive">
            <AlertTitle>Avatar metadata is incomplete</AlertTitle>
            <AlertDescription>
              This preset is missing its model or poster path. Select a different preset before continuing.
            </AlertDescription>
          </Alert>
        )}

        <AvatarViewer
          name={selectedPreset.name}
          modelUrl={selectedPreset.modelUrl}
          posterUrl={selectedPreset.posterUrl}
          accentClassName={selectedPreset.accentClassName}
          onModelError={setModelFailed}
          className="min-h-[420px]"
        />

        {modelFailed && (
          <Alert>
            <AlertTitle>3D preview fallback active</AlertTitle>
            <AlertDescription>
              The live model preview could not load, so the poster image is being shown instead. You can still save this preset as long as its metadata is valid.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Choose your character</CardTitle>
          <CardDescription>
            This avatar becomes your player identity in the lobby, scoreboard, leaderboard, and profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {avatarCatalog.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                type="button"
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border/70 bg-card hover:border-primary/40 hover:bg-accent/40'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{preset.name}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{preset.tagline}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{preset.description}</div>
                  </div>
                  {isSelected && (
                    <div className="rounded-full bg-primary p-1 text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <Button onClick={handleSave} disabled={!canSave} className="mt-4 w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ctaLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
