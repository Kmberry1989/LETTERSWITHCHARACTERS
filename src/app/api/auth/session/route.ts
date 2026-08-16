import { createSession, destroySession, getCurrentSessionToken, getCurrentUser, makeUser, revokeAllSessions, upsertUserProfile } from '@/lib/server/auth';
import { toDocumentStoreError } from '@/lib/server/document-store';
import { signInWithPassword, signUpWithPassword } from '@/lib/server/password-auth';
import { ApiRequestError, assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk, parseJson } from '@/lib/server/api';
import { authSessionSchema } from '@/lib/server/request-schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    const token = await getCurrentSessionToken();

    return jsonOk({
      user: user
        ? {
            ...user,
            token,
          }
        : null,
    });
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    return jsonError(asApiError(normalized, 'Authentication storage is unavailable.'), undefined, normalized.message);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, 'auth-session', 12, 60_000);
    const body = await parseJson(request, authSessionSchema);
    const mode = body.mode;
    const action = body.action;

    let user;

    if (mode === 'guest') {
      user = makeUser({
        uid: `guest-${crypto.randomUUID()}`,
        email: null,
        displayName: body.displayName || 'Guest Player',
        photoURL: null,
        isAnonymous: true,
        providerId: 'guest',
      });
      await upsertUserProfile(user);
    } else if (mode === 'email') {
      const username = body.username || '';
      const password = body.password || '';
      const displayName = body.displayName;

      user =
        action === 'signup'
          ? await signUpWithPassword({ username, password, displayName })
          : await signInWithPassword({ username, password });
    } else {
      throw new ApiRequestError('CLIENT_AUTH_REQUIRED', 'This sign-in method must be handled client-side.', 405);
    }

    const token = await createSession(user);

    return jsonOk({
      user: {
        ...user,
        token,
      },
    }, request);
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    return jsonError(asApiError(error instanceof Error && error.name === 'ApiRequestError' ? error : normalized, 'Could not sign in.', 400), request, normalized.message);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, 'auth-signout', 20, 60_000);
    if (new URL(request.url).searchParams.get('all') === '1') {
      const user = await getCurrentUser();
      if (user) await revokeAllSessions(user.uid);
    } else {
      await destroySession();
    }
    return jsonOk({}, request);
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    return jsonError(asApiError(error instanceof Error && error.name === 'ApiRequestError' ? error : normalized, normalized.message), request, normalized.message);
  }
}
