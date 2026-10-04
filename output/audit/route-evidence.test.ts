import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ token: 'attacker-session' as string | undefined, profiles: {} as Record<string, any> }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => state.token ? { value: state.token } : undefined }) }));
vi.mock('@/lib/prisma', () => ({ prisma: { appSession: { findUnique: async () => ({ userId: 'attacker', expiresAt: new Date(Date.now() + 60000) }) } } }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: async () => ({ data: { user: null }, error: null }) } }) }));
vi.mock('@/lib/server/document-store', () => ({
 getDocument: vi.fn(async (_collection: string, id: string) => state.profiles[id]),
 setDocument: vi.fn(async (_collection: string, id: string, data: any) => state.profiles[id] = data),
 updateDocument: vi.fn(async (_collection: string, id: string, patch: any) => Object.assign(state.profiles[id], patch)),
 toDocumentStoreError: (error: unknown) => error,
}));
import { getCurrentUser } from '@/lib/server/auth';
import { GET, PATCH, PUT } from '@/app/api/documents/[collection]/[documentId]/route';
const params = (collection: string, documentId: string) => ({ params: Promise.resolve({ collection, documentId }) });
beforeEach(() => { state.token = 'attacker-session'; state.profiles = { attacker: { uid: 'attacker', berries: 0 }, victim: { uid: 'victim', email: 'private@example.test' } }; });
it('audit evidence: unauthenticated document read returns private data', async () => {
 state.token = undefined;
 const response = await GET(new Request('http://localhost/api/documents/users/victim'), params('users', 'victim'));
 expect(response.status).toBe(200);
 expect((await response.json()).document.email).toBe('private@example.test');
});
it('audit evidence: unauthenticated non-user document write succeeds', async () => {
 state.token = undefined;
 const response = await PUT(new Request('http://localhost/api/documents/games/game1', { method: 'PUT', body: JSON.stringify({ data: { score: 999 } }) }), params('games', 'game1'));
 expect(response.status).toBe(200);
 expect(state.profiles.game1.score).toBe(999);
});
it('audit evidence: own-profile patch changes subsequent session identity', async () => {
 expect((await getCurrentUser())?.uid).toBe('attacker');
 const response = await PATCH(new Request('http://localhost/api/documents/users/attacker', { method: 'PATCH', body: JSON.stringify({ patch: { uid: 'victim', berries: 999999 } }) }), params('users', 'attacker'));
 expect(response.status).toBe(200);
 expect((await getCurrentUser())?.uid).toBe('victim');
 expect(state.profiles.attacker.berries).toBe(999999);
});
