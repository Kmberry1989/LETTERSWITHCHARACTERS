import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ token: 'local-token', session: vi.fn(), getDocument: vi.fn(), setDocument: vi.fn(), oauthUser: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => mocks.token ? { value: mocks.token } : undefined }) }));
vi.mock('@/lib/prisma', () => ({ prisma: { appSession: { findUnique: mocks.session } } }));
vi.mock('@/lib/server/document-store', () => ({ getDocument: mocks.getDocument, setDocument: mocks.setDocument }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser: mocks.oauthUser, getSession: async () => ({ data: { session: { access_token: 'oauth' } } }) } }) }));
import { getCurrentUser } from '@/lib/server/auth';
beforeEach(() => {
  vi.resetAllMocks(); mocks.token = 'local-token';
  mocks.session.mockResolvedValue({ userId: 'owner', expiresAt: new Date(Date.now() + 60000) });
  mocks.getDocument.mockResolvedValue({ id: 'owner', uid: 'victim', displayName: 'Owner' });
  mocks.setDocument.mockResolvedValue({ id: 'owner', uid: 'victim' });
});
it('uses the verified local session owner even when stored profile uid is poisoned', async () => {
  expect((await getCurrentUser())?.uid).toBe('owner');
});
it('uses the verified OAuth subject even when profile writes return a poisoned uid', async () => {
  mocks.token = '';
  mocks.oauthUser.mockResolvedValue({ data: { user: { id: 'oauth-owner', email: 'owner@example.test', app_metadata: { provider: 'google' }, user_metadata: {} } }, error: null });
  expect((await getCurrentUser())?.uid).toBe('oauth-owner');
});
