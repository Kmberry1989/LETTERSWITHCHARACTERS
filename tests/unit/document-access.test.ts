import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), getDocument: vi.fn(), listDocuments: vi.fn(), addDocument: vi.fn(), mutateDocumentAtomically: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock('@/lib/server/document-store', () => mocks);
import { GET, PUT, PATCH } from '@/app/api/documents/[collection]/[documentId]/route';
import { GET as LIST, POST } from '@/app/api/documents/[collection]/route';
import { editableProfilePatch } from '@/lib/server/document-access';
const context = (collection = 'users', documentId = 'alice') => ({ params: Promise.resolve({ collection, documentId }) });
const request = (method = 'GET', body?: unknown, path = '/api/documents/users/alice') => new Request(`http://localhost${path}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ uid: 'alice', displayName: 'Alice' });
  mocks.getDocument.mockResolvedValue({ id: 'alice', uid: 'alice', berries: 70, displayName: 'Alice' });
  mocks.listDocuments.mockResolvedValue([]);
  mocks.addDocument.mockImplementation(async (_collection, data) => ({ id: 'new', ...data }));
  mocks.mutateDocumentAtomically.mockImplementation(async (_collection, id, mutate) => {
    const current = { id, uid: id, berries: 70, ownedTileSetIds: ['starter'] };
    const mutation = mutate(current);
    return { document: { ...current, ...mutation.patch }, result: mutation.result };
  });
});
describe('document authorization', () => {
  it('rejects anonymous reads, listings and every mutation before reaching storage', async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    for (const [method, handler] of [['GET', GET], ['PUT', PUT], ['PATCH', PATCH], ['POST', POST], ['GET', LIST]] as const) {
      expect((await handler(request(method, method === 'GET' ? undefined : { data: {} }), context('games', 'game'))).status).toBe(401);
    }
    expect(mocks.getDocument).not.toHaveBeenCalled();
    expect(mocks.listDocuments).not.toHaveBeenCalled();
    expect(mocks.addDocument).not.toHaveBeenCalled();
    expect(mocks.mutateDocumentAtomically).not.toHaveBeenCalled();
  });
  it.each(['games', 'directThreads', 'lobbyChallenges', 'lobbyMessages', 'unknown', '%75sers'])('rejects generic writes to %s', async (collection) => {
    expect((await PATCH(request('PATCH', { patch: { status: 'finished' } }), context(collection))).status).toBe(403);
    expect((await PUT(request('PUT', { merge: true, data: { status: 'finished' } }), context(collection))).status).toBe(403);
    expect(mocks.mutateDocumentAtomically).not.toHaveBeenCalled();
  });
  it('rejects other-profile edits and destructive profile replacement', async () => {
    expect((await PATCH(request('PATCH', { patch: { displayName: 'Eve' } }), context('users', 'bob'))).status).toBe(403);
    expect((await PUT(request('PUT', { data: { displayName: 'Alice' } }), context())).status).toBe(403);
  });
  it.each(['uid', 'id', 'berries', 'level', 'experience', 'ownedTileSetIds', 'equippedTileSetId', 'clawCredits', 'gameIds', 'retention', 'stats', 'notificationPreferences.uid', '__proto__', 'constructor'])('rejects protected or alternate patch key %s', async (key) => {
    const patch = JSON.parse(`{"${key}":123}`);
    expect((await PATCH(request('PATCH', { patch }), context())).status).toBe(400);
    expect((await PUT(request('PUT', { data: patch, merge: true }), context())).status).toBe(400);
    expect(mocks.mutateDocumentAtomically).not.toHaveBeenCalled();
  });
  it('preserves allowed appearance edits and server-owned balances through atomic mutation', async () => {
    const response = await PATCH(request('PATCH', { patch: { themeId: 'forest', boardThemeId: 'board-green', boardColor: '#aabbcc', boardTintId: null, notificationPreferences: { emailTurnNotifications: false } } }), context());
    expect(response.status).toBe(200);
    expect((await response.json()).document).toMatchObject({ uid: 'alice', berries: 70, themeId: 'forest', ownedTileSetIds: ['starter'] });
    expect(mocks.mutateDocumentAtomically).toHaveBeenCalledOnce();
  });
  it('preserves merge-only profile updates', async () => {
    const response = await PUT(request('PUT', { merge: true, data: { photoURL: '/avatars/test.png' } }), context());
    expect(response.status).toBe(200);
    expect((await response.json()).document.berries).toBe(70);
  });
  it('rejects cross-origin edits', async () => {
    const req = new Request('http://localhost/api/documents/users/alice', { method: 'PATCH', headers: { origin: 'https://other.test' }, body: JSON.stringify({ patch: { themeId: 'forest' } }) });
    expect((await PATCH(req, context())).status).toBe(403);
    expect(mocks.mutateDocumentAtomically).not.toHaveBeenCalled();
  });
  it.each([['games', 'players'], ['directThreads', 'participantIds']])('requires membership in %s for reads and filters before pagination', async (collection, field) => {
    mocks.getDocument.mockResolvedValue({ id: 'private', [field]: ['bob', 'charlie'], messages: ['private'] });
    expect((await GET(request(), context(collection, 'private'))).status).toBe(404);
    mocks.getDocument.mockResolvedValue({ id: 'private', [field]: ['bob', 'alice'] });
    expect((await GET(request(), context(collection, 'private'))).status).toBe(200);
    await LIST(request(), context(collection));
    expect(mocks.listDocuments).toHaveBeenCalledWith(collection, expect.objectContaining({ participant: { field, uid: 'alice' }, limit: 50 }));
  });
  it('projects other users without email, push subscriptions, economy or private state', async () => {
    const bob = { id: 'bob', uid: 'forged', displayName: 'Bob', email: 'private@example.test', berries: 999, pushSubscriptions: ['secret'], gameIds: ['private'], stats: { wins: 1 } };
    mocks.getDocument.mockResolvedValue(bob);
    const response = await GET(request(), context('users', 'bob'));
    expect((await response.json()).document).toEqual({ id: 'bob', uid: 'bob', displayName: 'Bob', stats: { wins: 1 } });
    mocks.listDocuments.mockResolvedValue([bob]);
    expect((await (await LIST(request(), context())).json()).documents).toEqual([{ id: 'bob', uid: 'bob', displayName: 'Bob', stats: { wins: 1 } }]);
  });
  it('rejects unsupported collection reads and oversized/zero queries', async () => {
    expect((await GET(request(), context('secrets'))).status).toBe(403);
    expect((await LIST(request('GET', undefined, '/api/documents/users?limit=0'), context())).status).toBe(400);
    expect((await LIST(request('GET', undefined, '/api/documents/users?limit=101'), context())).status).toBe(400);
  });
  it('reconstructs lobby sender identity and ignores supplied authority fields', async () => {
    const response = await POST(request('POST', { data: { text: ' Hello ', senderId: 'bob', timestamp: 'forged', berries: 1000 } }), context('lobbyMessages'));
    expect(response.status).toBe(200);
    const { document } = await response.json();
    expect(document).toMatchObject({ text: 'Hello', senderId: 'alice', senderName: 'Alice' });
    expect(document).not.toHaveProperty('berries');
    expect(document.timestamp).not.toBe('forged');
  });
  it('creates an open challenge for the session owner and rejects generic game creation', async () => {
    const response = await POST(request('POST', { data: { creatorUid: 'bob', status: 'accepted', gameId: 'forged' } }), context('lobbyChallenges'));
    expect((await response.json()).document).toMatchObject({ creatorUid: 'alice', status: 'open' });
    for (const collection of ['games', 'users', 'directThreads']) expect((await POST(request('POST', { data: {} }), context(collection))).status).toBe(403);
  });
  it('validates messages and canonicalizes avatar metadata', async () => {
    expect((await POST(request('POST', { data: { text: '' } }), context('lobbyMessages'))).status).toBe(400);
    expect(editableProfilePatch({ avatarPresetId: 'ember-scribe', avatarModelUrl: 'https://other.test/a.gltf' }).avatarModelUrl).toBe('/avatars/models/ember-scribe.gltf');
    expect(() => editableProfilePatch({ notificationPreferences: { uid: 'bob' } })).toThrow();
    expect(() => editableProfilePatch({ photoURL: 'javascript:alert(1)' })).toThrow();
  });
});
