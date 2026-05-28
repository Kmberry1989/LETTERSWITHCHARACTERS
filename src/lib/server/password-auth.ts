import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';
import { makeUser, upsertUserProfile, type AppUser } from '@/lib/server/auth';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

function assertDatabaseConfigured() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      'Username/password auth is unavailable until DATABASE_URL is configured and the dev server is restarted.'
    );
  }
}

function normalizeUsername(rawUsername: string) {
  return rawUsername.trim().toLowerCase();
}

function validateUsername(rawUsername: string) {
  const username = normalizeUsername(rawUsername);

  if (username.length < 3 || username.length > 24) {
    throw new Error('Username must be between 3 and 24 characters.');
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    throw new Error('Username can only contain lowercase letters, numbers, and underscores.');
  }

  return username;
}

function validatePassword(password: string) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.');
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(password: string, encodedHash: string) {
  const [salt, storedHash] = encodedHash.split(':');
  if (!salt || !storedHash) return false;

  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (derivedKey.length !== storedBuffer.length) return false;

  return timingSafeEqual(derivedKey, storedBuffer);
}

export async function signUpWithPassword(input: {
  username: string;
  password: string;
  displayName?: string;
}): Promise<AppUser> {
  assertDatabaseConfigured();
  const username = validateUsername(input.username);
  validatePassword(input.password);

  const existingCredential = await prisma.appCredential.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingCredential) {
    throw new Error('That username is already taken.');
  }

  const userId = `user-${username}`;
  const passwordHash = await hashPassword(input.password);
  const displayName = input.displayName?.trim() || username;

  await prisma.appCredential.create({
    data: {
      userId,
      username,
      passwordHash,
    },
  });

  const user = makeUser({
    uid: userId,
    email: null,
    displayName,
    photoURL: null,
    providerId: 'password',
  });

  await upsertUserProfile(user);
  return user;
}

export async function signInWithPassword(input: {
  username: string;
  password: string;
}): Promise<AppUser> {
  assertDatabaseConfigured();
  const username = validateUsername(input.username);
  validatePassword(input.password);

  const credential = await prisma.appCredential.findUnique({
    where: { username },
  });

  if (!credential) {
    throw new Error('Invalid username or password.');
  }

  const isValid = await verifyPassword(input.password, credential.passwordHash);
  if (!isValid) {
    throw new Error('Invalid username or password.');
  }

  const profile = await prisma.appDocument.findUnique({
    where: {
      collection_documentId: {
        collection: 'users',
        documentId: credential.userId,
      },
    },
  });

  const profileData = (profile?.data as Record<string, unknown> | null) || null;
  const user = makeUser({
    uid: credential.userId,
    email: null,
    displayName: typeof profileData?.displayName === 'string' ? profileData.displayName : username,
    photoURL: typeof profileData?.photoURL === 'string' ? profileData.photoURL : null,
    providerId: 'password',
  });

  await upsertUserProfile(user);
  return user;
}
