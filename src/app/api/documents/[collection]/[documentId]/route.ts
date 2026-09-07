import { getDocument, mutateDocumentAtomically } from '@/lib/server/document-store';
import { getCurrentUser } from '@/lib/server/auth';
import { ApiRequestError, assertSameOrigin, asApiError, jsonError, jsonOk } from '@/lib/server/api';
import { assertReadableCollection, editableProfilePatch, visibleDocument } from '@/lib/server/document-access';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ collection: string; documentId: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    const { collection, documentId } = await params;
    assertReadableCollection(collection);
    const stored = await getDocument(collection, documentId);
    const document = stored && visibleDocument(collection, stored, user.uid);
    if (!document) throw new ApiRequestError('NOT_FOUND', 'Document not found.', 404);
    return jsonOk({ document }, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not load document.'), request);
  }
}

async function updateProfile(request: Request, { params }: Context, replace: boolean) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new ApiRequestError('UNAUTHORIZED', 'Unauthorized', 401);
    const { collection, documentId } = await params;
    if (collection !== 'users' || documentId !== user.uid) throw new ApiRequestError('FORBIDDEN', 'Document mutation denied.', 403);
    const body = await request.json().catch(() => null);
    // Replacement could erase server-managed identity, ownership, and balances.
    if (replace && body?.merge !== true) throw new ApiRequestError('FORBIDDEN', 'Profile replacement is not allowed.', 403);
    const patch = editableProfilePatch(replace ? body?.data : body?.patch);
    const mutation = await mutateDocumentAtomically('users', user.uid, () => ({ patch, result: {} }));
    return jsonOk({ document: { ...mutation.document, uid: user.uid } }, request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not update document.'), request);
  }
}

export async function PUT(request: Request, context: Context) { return updateProfile(request, context, true); }
export async function PATCH(request: Request, context: Context) { return updateProfile(request, context, false); }
