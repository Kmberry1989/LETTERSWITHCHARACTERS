export type DirectInviteStatus = 'pending' | 'accepted' | 'expired';

export type DirectInvitePayload = {
  id: string;
  senderId: string;
  recipientId: string;
  status: DirectInviteStatus;
  createdAt: string;
  acceptedAt?: string | null;
  gameId?: string | null;
};

export type DirectMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  invite?: DirectInvitePayload | null;
};

export type DirectThread = {
  id: string;
  participantIds: [string, string] | string[];
  participantMeta: Record<
    string,
    {
      displayName: string;
      photoURL?: string | null;
      avatarPosterUrl?: string | null;
    }
  >;
  messages: DirectMessage[];
  unreadCounts: Record<string, number>;
  lastMessagePreview: string;
  updatedAt: string;
  createdAt: string;
};

export function buildDirectThreadId(leftUserId: string, rightUserId: string) {
  return [leftUserId, rightUserId].sort().join('__');
}

export function getThreadCounterpartId(thread: DirectThread, currentUserId: string) {
  return thread.participantIds.find((participantId) => participantId !== currentUserId) || currentUserId;
}

export function getThreadUnreadCount(thread: DirectThread, currentUserId: string) {
  return thread.unreadCounts[currentUserId] || 0;
}

export function normalizeDirectThreads(threads: DirectThread[]) {
  return [...threads].sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}
