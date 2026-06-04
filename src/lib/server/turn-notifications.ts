import webpush from 'web-push';
import type * as WebPushTypes from 'web-push';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import {
  normalizeNotificationPreferences,
  notificationPreferenceKey,
  type NotificationChannel,
  type NotificationEventKind,
  type StoredPushSubscription,
} from '@/lib/notifications';

type NotifyArgs = {
  userId: string;
  title: string;
  body: string;
  url: string;
  kind: NotificationEventKind;
};

type UserNotificationProfile = {
  displayName?: string | null;
  email?: string | null;
  notificationPreferences?: Record<string, boolean | undefined>;
  pushSubscriptions?: StoredPushSubscription[];
};

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function sendEmail(to: string, title: string, body: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return;
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: title,
      html: `<div><h2>${title}</h2><p>${body}</p><p><a href="${url}">Open</a></p></div>`,
    }),
  }).catch(() => null);
}

async function sendPush(
  userId: string,
  subscriptions: StoredPushSubscription[],
  payload: { title: string; body: string; url: string }
) {
  if (!configureWebPush()) {
    return;
  }

  const survivingSubscriptions: StoredPushSubscription[] = [];

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription as WebPushTypes.PushSubscription, JSON.stringify(payload));
      survivingSubscriptions.push(subscription);
    } catch (error: any) {
      const statusCode = error?.statusCode;
      if (statusCode !== 404 && statusCode !== 410) {
        survivingSubscriptions.push(subscription);
      }
    }
  }

  if (survivingSubscriptions.length !== subscriptions.length) {
    await updateDocument('users', userId, {
      pushSubscriptions: survivingSubscriptions,
    }).catch(() => null);
  }
}

export async function notifyUser({ userId, title, body, url, kind }: NotifyArgs) {
  if (!userId) return;

  const profile = await getDocument<UserNotificationProfile>('users', userId);
  if (!profile) return;

  const preferences = normalizeNotificationPreferences(profile.notificationPreferences);
  const emailKey = notificationPreferenceKey(kind, 'email');
  const pushKey = notificationPreferenceKey(kind, 'webPush');

  if (preferences[emailKey] && profile.email) {
    await sendEmail(profile.email, title, body, url);
  }

  if (preferences[pushKey] && Array.isArray(profile.pushSubscriptions) && profile.pushSubscriptions.length > 0) {
    await sendPush(userId, profile.pushSubscriptions, {
      title,
      body,
      url,
    });
  }
}

export async function notifyUserTurn(args: Omit<NotifyArgs, 'kind' | 'url'> & { gameUrl: string }) {
  return notifyUser({ userId: args.userId, title: args.title, body: args.body, url: args.gameUrl, kind: 'turn' });
}

export async function notifyUserChallenge(args: Omit<NotifyArgs, 'kind' | 'url'> & { challengeUrl: string }) {
  return notifyUser({ userId: args.userId, title: args.title, body: args.body, url: args.challengeUrl, kind: 'challenge' });
}

export async function notifyUserGame(args: Omit<NotifyArgs, 'kind' | 'url'> & { gameUrl: string }) {
  return notifyUser({ userId: args.userId, title: args.title, body: args.body, url: args.gameUrl, kind: 'game' });
}

export async function notifyUserChat(args: Omit<NotifyArgs, 'kind' | 'url'> & { gameUrl: string }) {
  return notifyUser({ userId: args.userId, title: args.title, body: args.body, url: args.gameUrl, kind: 'chat' });
}
