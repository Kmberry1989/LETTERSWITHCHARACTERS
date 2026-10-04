import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const DEFAULT_AMOUNT = 100;
const DEFAULT_GRANT_ID = '2026-07-25-all-profiles-100-berries';
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credential = serviceAccount
  ? cert(JSON.parse(serviceAccount.startsWith('{') ? serviceAccount : Buffer.from(serviceAccount, 'base64').toString('utf8')))
  : process.env.FIRESTORE_EMULATOR_HOST ? undefined : applicationDefault();
const app = getApps()[0] || initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-1704097120-f2816',
  credential,
});
const db = getFirestore(app);

function readArgument(name) {
  const prefix = '--' + name + '=';
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

const amount = Number(readArgument('amount') ?? DEFAULT_AMOUNT);
const grantId = readArgument('grant-id') ?? DEFAULT_GRANT_ID;
const dryRun = process.argv.includes('--dry-run');
if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('--amount must be a positive whole number.');
if (!grantId.trim()) throw new Error('--grant-id must not be empty.');

const profiles = await db.collection('users').get();
const eligible = profiles.docs.filter((profile) => !((profile.data().currencyGrantIds || []).includes(grantId)));
const beforeTotal = profiles.docs.reduce((sum, profile) => sum + (Number(profile.data().berries) || 0), 0);
if (!dryRun) {
  for (let start = 0; start < eligible.length; start += 400) {
    const batch = db.batch();
    for (const profile of eligible.slice(start, start + 400)) {
      batch.update(profile.ref, {
        berries: FieldValue.increment(amount),
        currencyGrantIds: FieldValue.arrayUnion(grantId),
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  }
}
console.log(JSON.stringify({
  dryRun,
  profiles: profiles.size,
  grantedProfiles: eligible.length,
  skippedProfiles: profiles.size - eligible.length,
  amountPerProfile: amount,
  beforeTotal,
  expectedAfterTotal: beforeTotal + eligible.length * amount,
  grantId,
}, null, 2));
