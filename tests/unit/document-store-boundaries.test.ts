import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { appDocument: mocks } }));
import { getDocument, listDocuments } from '@/lib/server/document-store';
beforeEach(() => vi.resetAllMocks());
it('uses the storage key even if legacy JSON contains an injected id', async () => {
  mocks.findUnique.mockResolvedValue({ collection: 'users', documentId: 'owner', data: { id: 'victim', uid: 'victim' } });
  expect((await getDocument('users', 'owner'))?.id).toBe('owner');
});
it('applies participant filtering in the database before the page limit', async () => {
  mocks.findMany.mockResolvedValue([]);
  await listDocuments('games', { limit: 25, participant: { field: 'players', uid: 'owner' } });
  expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { collection: 'games', data: { path: ['players'], array_contains: ['owner'] } }, take: 25 }));
});
