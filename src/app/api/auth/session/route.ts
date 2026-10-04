import { getAdminAuth } from '@/firebase/admin';
import {
  createSession,
  destroySession,
  getCurrentUser,
  makeUser,
  revokeAllSessions,
  upsertUserProfile,
} from '@/lib/server/auth';
import { toDocumentStoreError } from '@/lib/server/document-store';
import { ApiRequestError, assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk, parseJson } from '@/lib/server/api';
import { authSessionSchema } from '@/lib/server/request-schemas';
import { isGeneratedAuthEmail } from '@/lib/auth-identity';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    return jsonOk({ user: await getCurrentUser() }, request);
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    return jsonError(asApiError(normalized, normalized.message), request);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, 'auth-session', 20, 60_000);
    const { idToken } = await parseJson(request, authSessionSchema);
    if (!idToken) throw new ApiRequestError('FIREBASE_TOKEN_REQUIRED', 'A Firebase ID token is required.', 400);
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const authUser = await getAdminAuth().getUser(decoded.uid);
    const provider = decoded.firebase.sign_in_provider;
    const user = makeUser({
      uid: decoded.uid,
      email: authUser.email && !isGeneratedAuthEmail(authUser.email) ? authUser.email : null,
      displayName: authUser.displayName || decoded.name || 'Player',
      photoURL: authUser.photoURL || decoded.picture || null,
      isAnonymous: provider === 'anonymous',
      providerId: provider === 'anonymous' ? 'guest' : provider === 'google.com' ? 'google.com' : provider === 'apple.com' ? 'apple.com' : 'password',
    });
    const profile = await upsertUserProfile(user);
    await createSession(idToken);
    return jsonOk({ user: { ...user, ...profile, uid: decoded.uid, id: undefined } }, request);
  } catch (error) {
    const normalized = toDocumentStoreError(error, 'Authentication storage is unavailable.');
    const apiError = error instanceof ApiRequestError
      ? error
      : new ApiRequestError('INVALID_FIREBASE_SESSION', 'Could not verify the Firebase sign-in.', 401);
    return jsonError(asApiError(apiError, apiError.message), request, normalized.message);
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
    return jsonError(asApiError(error, 'Could not sign out.'), request);
  }
}
