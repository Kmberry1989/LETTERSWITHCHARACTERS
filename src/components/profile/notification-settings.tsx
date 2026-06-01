'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from '@/lib/client/document-client';
import type { UserProfile } from '@/firebase/firestore/use-users';
import {
  notificationPreferenceKey,
  normalizeNotificationPreferences,
  type NotificationChannel,
  type NotificationEventKind,
  type NotificationPreferences,
} from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function ensurePushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Web push is not supported in this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const ready = await navigator.serviceWorker.ready;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error('Missing web push public key.');
  }

  const existing = await ready.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  const key = decodeBase64Url(publicKey);
  return ready.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key,
  });
}

async function removePushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const ready = await navigator.serviceWorker.ready;
  const existing = await ready.pushManager.getSubscription();
  const endpoint = existing?.endpoint;

  if (existing) {
    await existing.unsubscribe().catch(() => null);
  }

  await fetch('/api/notifications/push-subscription', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });
}

export default function NotificationSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const userDocRef = useMemoFirebase(() => (user ? doc(null, 'users', user.uid) : null), [user]);
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);
  const prefs = useMemo(() => normalizeNotificationPreferences(userProfile?.notificationPreferences), [userProfile]);
  const [isSaving, setIsSaving] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(prefs);

  useEffect(() => {
    setLocalPrefs(prefs);
  }, [prefs]);

  const savePreferences = async (next: Required<NotificationPreferences>) => {
    if (!userDocRef) return;
    setIsSaving(true);
    try {
      await updateDoc(userDocRef, {
        notificationPreferences: next,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (kind: NotificationEventKind, channel: NotificationChannel, checked: boolean) => {
    if (!user || !userDocRef) return;
    const key = notificationPreferenceKey(kind, channel);
    const next = { ...localPrefs, [key]: checked };

    try {
      if (channel === 'webPush' && checked) {
        const subscription = await ensurePushSubscription();
        await fetch('/api/notifications/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription,
            userAgent: navigator.userAgent,
          }),
        });
      } else if (channel === 'webPush' && !checked) {
        await removePushSubscription();
      }

      setLocalPrefs(next);
      await savePreferences(next);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Notification setup failed',
        description: error?.message || 'Could not update notification preferences.',
      });
    }
  };

  const notificationRows: Array<{ kind: NotificationEventKind; label: string; description: string }> = [
    { kind: 'turn', label: 'Turn alerts', description: 'When it becomes your turn.' },
    { kind: 'challenge', label: 'Challenge alerts', description: 'When someone accepts your open challenge.' },
    { kind: 'game', label: 'Game finished', description: 'When a game ends and final results are available.' },
    { kind: 'chat', label: 'Chat messages', description: 'When your opponent sends a game message.' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          <span>Event</span>
          <span>Email</span>
          <span>Push</span>
        </div>
        {notificationRows.map((row) => {
          const emailKey = notificationPreferenceKey(row.kind, 'email');
          const pushKey = notificationPreferenceKey(row.kind, 'webPush');
          return (
            <div key={row.kind} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div>
                <Label htmlFor={`${row.kind}-email`}>{row.label}</Label>
                <p className="text-sm text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                id={`${row.kind}-email`}
                checked={localPrefs[emailKey]}
                disabled={isSaving}
                onCheckedChange={(checked) => handleToggle(row.kind, 'email', checked)}
              />
              <Switch
                id={`${row.kind}-push`}
                checked={localPrefs[pushKey]}
                disabled={isSaving}
                onCheckedChange={(checked) => handleToggle(row.kind, 'webPush', checked)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
