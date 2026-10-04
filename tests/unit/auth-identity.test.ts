import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ token: 'session-cookie', verifySessionCookie: vi.fn(), getDocument: vi.fn(), setDocument: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => mocks.token ? { value: mocks.token } : undefined }) }));
vi.mock('@/firebase/admin', () => ({ getAdminAuth: () => ({ verifySessionCookie: mocks.verifySessionCookie }) }));
vi.mock('@/lib/server/document-store', () => ({ getDocument: mocks.getDocument, setDocument: mocks.setDocument }));
import { getCurrentUser } from '@/lib/server/auth';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.token = 'session-cookie';
  mocks.verifySessionCookie.mockResolvedValue({ uid: 'owner', firebase: { sign_in_provider: 'password' } });
  mocks.getDocument.mockResolvedValue({ id: 'owner', uid: 'victim', displayName: 'Owner' });
  mocks.setDocument.mockResolvedValue({ id: 'owner', uid: 'victim', displayName: 'Owner' });
});
it('uses the verified Firebase subject even when stored profile uid is poisoned', async () => {
  expect((await getCurrentUser())?.uid).toBe('owner');
});
it('returns null when the Firebase session cookie cannot be verified', async () => {
  mocks.verifySessionCookie.mockRejectedValue(new Error('expired'));
  expect(await getCurrentUser()).toBeNull();
});
