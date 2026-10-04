import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ doc: vi.fn(), get: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(), queryGet: vi.fn() }));
vi.mock('@/firebase/admin', () => ({
  getAdminFirestore: () => ({ collection: () => ({ doc: mocks.doc, where: mocks.where, orderBy: mocks.orderBy }) }),
}));
import { getDocument, listDocuments } from '@/lib/server/document-store';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.doc.mockReturnValue({ get: mocks.get });
  mocks.where.mockReturnValue({ orderBy: mocks.orderBy });
  mocks.orderBy.mockReturnValue({ limit: mocks.limit, get: mocks.queryGet });
  mocks.limit.mockReturnValue({ get: mocks.queryGet });
  mocks.queryGet.mockResolvedValue({ docs: [] });
});
it('uses the Firestore key even if stored JSON contains an injected id', async () => {
  mocks.get.mockResolvedValue({ id: 'owner', exists: true, data: () => ({ id: 'victim', uid: 'victim' }) });
  expect((await getDocument('users', 'owner'))?.id).toBe('owner');
});
it('applies participant filtering before the page limit', async () => {
  await listDocuments('games', { limit: 25, participant: { field: 'players', uid: 'owner' } });
  expect(mocks.where).toHaveBeenCalledWith('players', 'array-contains', 'owner');
  expect(mocks.limit).toHaveBeenCalledWith(25);
});
