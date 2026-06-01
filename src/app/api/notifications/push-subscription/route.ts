import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';
import { getDocument, updateDocument } from '@/lib/server/document-store';
import type { StoredPushSubscription } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

type UserDoc = {
  pushSubscriptions?: StoredPushSubscription[];
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subscription = body?.subscription;
  if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
    return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
  }

  const userDoc = await getDocument<UserDoc>('users', user.uid);
  const existing = userDoc?.pushSubscriptions || [];
  const filtered = existing.filter((item) => item.endpoint !== subscription.endpoint);
  const nextSubscription: StoredPushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.keys.auth,
      p256dh: subscription.keys.p256dh,
    },
    createdAt: new Date().toISOString(),
    userAgent: body?.userAgent || null,
  };

  await updateDocument('users', user.uid, {
    pushSubscriptions: [...filtered, nextSubscription],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : null;
  const userDoc = await getDocument<UserDoc>('users', user.uid);
  const existing = userDoc?.pushSubscriptions || [];

  await updateDocument('users', user.uid, {
    pushSubscriptions: endpoint ? existing.filter((item) => item.endpoint !== endpoint) : [],
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
