export type NotificationPreferences = {
  emailTurnNotifications?: boolean;
  webPushTurnNotifications?: boolean;
  emailChallengeNotifications?: boolean;
  webPushChallengeNotifications?: boolean;
  emailGameNotifications?: boolean;
  webPushGameNotifications?: boolean;
  emailChatNotifications?: boolean;
  webPushChatNotifications?: boolean;
};

export type NotificationEventKind = 'turn' | 'challenge' | 'game' | 'chat';
export type NotificationChannel = 'email' | 'webPush';

export type StoredPushSubscription = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
  createdAt: string;
  userAgent?: string | null;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: Required<NotificationPreferences> = {
  emailTurnNotifications: true,
  webPushTurnNotifications: false,
  emailChallengeNotifications: true,
  webPushChallengeNotifications: false,
  emailGameNotifications: true,
  webPushGameNotifications: false,
  emailChatNotifications: false,
  webPushChatNotifications: false,
};

export function normalizeNotificationPreferences(
  value?: NotificationPreferences | null
): Required<NotificationPreferences> {
  return {
    emailTurnNotifications:
      typeof value?.emailTurnNotifications === 'boolean'
        ? value.emailTurnNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.emailTurnNotifications,
    webPushTurnNotifications:
      typeof value?.webPushTurnNotifications === 'boolean'
        ? value.webPushTurnNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.webPushTurnNotifications,
    emailChallengeNotifications:
      typeof value?.emailChallengeNotifications === 'boolean'
        ? value.emailChallengeNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.emailChallengeNotifications,
    webPushChallengeNotifications:
      typeof value?.webPushChallengeNotifications === 'boolean'
        ? value.webPushChallengeNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.webPushChallengeNotifications,
    emailGameNotifications:
      typeof value?.emailGameNotifications === 'boolean'
        ? value.emailGameNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.emailGameNotifications,
    webPushGameNotifications:
      typeof value?.webPushGameNotifications === 'boolean'
        ? value.webPushGameNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.webPushGameNotifications,
    emailChatNotifications:
      typeof value?.emailChatNotifications === 'boolean'
        ? value.emailChatNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.emailChatNotifications,
    webPushChatNotifications:
      typeof value?.webPushChatNotifications === 'boolean'
        ? value.webPushChatNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.webPushChatNotifications,
  };
}

export function notificationPreferenceKey(kind: NotificationEventKind, channel: NotificationChannel) {
  if (kind === 'turn') return channel === 'email' ? 'emailTurnNotifications' : 'webPushTurnNotifications';
  if (kind === 'challenge') return channel === 'email' ? 'emailChallengeNotifications' : 'webPushChallengeNotifications';
  if (kind === 'game') return channel === 'email' ? 'emailGameNotifications' : 'webPushGameNotifications';
  return channel === 'email' ? 'emailChatNotifications' : 'webPushChatNotifications';
}
