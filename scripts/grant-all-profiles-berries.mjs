import { Prisma, PrismaClient } from '@prisma/client';

const DEFAULT_AMOUNT = 100;
const DEFAULT_GRANT_ID = '2026-07-25-all-profiles-100-berries';
const prisma = new PrismaClient();

function readArgument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const amount = Number(readArgument('amount') ?? DEFAULT_AMOUNT);
const grantId = readArgument('grant-id') ?? DEFAULT_GRANT_ID;
const dryRun = process.argv.includes('--dry-run');

if (!Number.isSafeInteger(amount) || amount <= 0) {
  throw new Error('--amount must be a positive whole number.');
}

if (!grantId.trim()) {
  throw new Error('--grant-id must not be empty.');
}

async function applyGrant() {
  return prisma.$transaction(
    async (transaction) => {
      const profiles = await transaction.appDocument.findMany({
        where: { collection: 'users' },
        select: { documentId: true, data: true },
      });

      const eligible = profiles.filter(({ data }) => {
        const grantIds = Array.isArray(data?.currencyGrantIds) ? data.currencyGrantIds : [];
        return !grantIds.includes(grantId);
      });

      const beforeTotal = profiles.reduce(
        (total, { data }) =>
          total + (typeof data?.berries === 'number' && Number.isFinite(data.berries) ? data.berries : 0),
        0
      );

      if (!dryRun) {
        for (const profile of eligible) {
          const data =
            profile.data && typeof profile.data === 'object' && !Array.isArray(profile.data)
              ? profile.data
              : {};
          const currentBerries =
            typeof data.berries === 'number' && Number.isFinite(data.berries) ? data.berries : 0;
          const currencyGrantIds = Array.isArray(data.currencyGrantIds)
            ? data.currencyGrantIds.filter((value) => typeof value === 'string')
            : [];

          await transaction.appDocument.update({
            where: {
              collection_documentId: {
                collection: 'users',
                documentId: profile.documentId,
              },
            },
            data: {
              data: {
                ...data,
                berries: currentBerries + amount,
                currencyGrantIds: [...new Set([...currencyGrantIds, grantId])],
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }
      }

      return {
        dryRun,
        profiles: profiles.length,
        grantedProfiles: eligible.length,
        skippedProfiles: profiles.length - eligible.length,
        amountPerProfile: amount,
        beforeTotal,
        expectedAfterTotal: beforeTotal + eligible.length * amount,
        grantId,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

try {
  console.log(JSON.stringify(await applyGrant(), null, 2));
} finally {
  await prisma.$disconnect();
}
