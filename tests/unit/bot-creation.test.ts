import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ user: vi.fn(), transaction: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock('@/lib/server/auth', () => ({ getCurrentUser: mocks.user }));
vi.mock('@/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }));
import { POST } from '@/app/api/games/bot/route';
const request = (body: unknown) => new Request('http://localhost/api/games/bot', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ uid: 'alice' });
  mocks.findUnique.mockResolvedValue({ id: 'row-alice', data: { uid: 'alice', displayName: 'Alice', berries: 100, gameIds: ['human-game'] } });
  mocks.findFirst.mockResolvedValue(null);
  mocks.transaction.mockImplementation(async (callback) => callback({ appDocument: { findUnique: mocks.findUnique, findFirst: mocks.findFirst, create: mocks.create, update: mocks.update } }));
});
it('denies anonymous creation before starting a transaction', async () => {
  mocks.user.mockResolvedValue(null);
  expect((await POST(request({ difficulty: 'Easy' }))).status).toBe(401);
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it('rejects caller-supplied players, scores, racks and unsupported difficulty', async () => {
  for (const body of [{ difficulty: 'Cheat' }, { difficulty: 'Easy', players: ['victim'] }, { difficulty: 'Easy', board: {} }, { difficulty: 'Easy', berries: 999 }]) {
    expect((await POST(request(body))).status).toBe(400);
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it('creates the game and attaches it to the owner in the same serializable transaction', async () => {
  const response = await POST(request({ difficulty: 'Medium' }));
  expect(response.status).toBe(200);
  const { gameId } = await response.json();
  const game = mocks.create.mock.calls[0][0].data;
  expect(game.documentId).toBe(gameId);
  expect(game.data).toMatchObject({ players: ['alice', 'bitty-botty-001'], currentTurn: 'alice', status: 'active', board: {}, difficulty: 'Medium' });
  expect(game.data.playerData.alice.tiles).toHaveLength(7);
  expect(game.data.playerData.alice.score).toBe(0);
  expect(game.data.playerData['bitty-botty-001'].tiles).toHaveLength(7);
  expect(mocks.update.mock.calls[0][0]).toMatchObject({ where: { id: 'row-alice' }, data: { data: { berries: 100, gameIds: ['human-game', gameId] } } });
  expect(mocks.transaction.mock.calls[0][1]).toEqual({ isolationLevel: 'Serializable' });
});
it('rejects an existing active bot game without writing anything', async () => {
  mocks.findFirst.mockResolvedValue({ id: 'existing' });
  expect((await POST(request({ difficulty: 'Hard' }))).status).toBe(409);
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});
