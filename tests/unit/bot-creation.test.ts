import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: vi.fn(), runTransaction: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), doc: vi.fn(), where: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ getCurrentUser: mocks.user }));
vi.mock('@/firebase/admin', () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => ({
      doc: (id?: string) => mocks.doc(name, id),
      where: (...args: unknown[]) => mocks.where(name, ...args),
    }),
    runTransaction: mocks.runTransaction,
  }),
}));
import { POST } from '@/app/api/games/bot/route';
const request = (body: unknown) => new Request('http://localhost/api/games/bot', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ uid: 'alice' });
  mocks.doc.mockImplementation((collection: string, id?: string) => ({ collection, id: id || 'new-game' }));
  mocks.where.mockReturnValue({ kind: 'games-query' });
  mocks.get.mockImplementation(async (ref) => ref.kind === 'games-query'
    ? { docs: [] }
    : { exists: true, data: () => ({ uid: 'alice', displayName: 'Alice', berries: 100, gameIds: ['human-game'] }) });
  mocks.runTransaction.mockImplementation(async (callback) => callback({ get: mocks.get, create: mocks.create, update: mocks.update }));
});
it('denies anonymous creation before starting a transaction', async () => {
  mocks.user.mockResolvedValue(null);
  expect((await POST(request({ difficulty: 'Easy' }))).status).toBe(401);
  expect(mocks.runTransaction).not.toHaveBeenCalled();
});
it('rejects caller-supplied players, scores, racks and unsupported difficulty', async () => {
  for (const body of [{ difficulty: 'Cheat' }, { difficulty: 'Easy', players: ['victim'] }, { difficulty: 'Easy', board: {} }, { difficulty: 'Easy', berries: 999 }]) {
    expect((await POST(request(body))).status).toBe(400);
  }
  expect(mocks.runTransaction).not.toHaveBeenCalled();
});
it('creates the game and attaches it to the owner in one Firestore transaction', async () => {
  const response = await POST(request({ difficulty: 'Medium' }));
  expect(response.status).toBe(200);
  const { gameId } = await response.json();
  expect(gameId).toBe('new-game');
  expect(mocks.create.mock.calls[0][1]).toMatchObject({ players: ['alice', 'bitty-botty-001'], currentTurn: 'alice', status: 'active', board: {}, difficulty: 'Medium' });
  expect(mocks.update.mock.calls[0][1]).toEqual({ gameIds: ['human-game', 'new-game'] });
});
it('rejects an existing active bot game without writing anything', async () => {
  mocks.get.mockImplementation(async (ref) => ref.kind === 'games-query'
    ? { docs: [{ data: () => ({ players: ['alice', 'bitty-botty-001'], status: 'active' }) }] }
    : { exists: true, data: () => ({ uid: 'alice', displayName: 'Alice', gameIds: [] }) });
  expect((await POST(request({ difficulty: 'Hard' }))).status).toBe(409);
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});
