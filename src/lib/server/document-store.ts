import { FieldPath } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/firebase/admin';

export type JsonRecord = Record<string, any>;
export type EconomyLedgerMutation = {
  requestId: string;
  kind: string;
  currency: string;
  amount: number;
  balanceAfter?: number;
  metadata?: JsonRecord;
};

export class DocumentStoreUnavailableError extends Error {
  status = 503 as const;
  constructor(message: string) {
    super(message);
    this.name = 'DocumentStoreUnavailableError';
  }
}

function normalizeDatabaseError(error: { message?: string } | null | undefined, fallback: string) {
  const detail = error?.message || '';
  if (detail.includes('credential') || detail.includes('default credentials')) {
    return new DocumentStoreUnavailableError(fallback + ' Firebase Admin credentials are not configured.');
  }
  if (detail.includes('ECONNREFUSED') || detail.includes('ENOTFOUND') || detail.includes('timed out')) {
    return new DocumentStoreUnavailableError(fallback + ' Firestore could not be reached.');
  }
  return new DocumentStoreUnavailableError(fallback);
}

export function toDocumentStoreError(error: unknown, fallback = 'Document storage is unavailable.') {
  return error instanceof DocumentStoreUnavailableError ? error : normalizeDatabaseError(error as Error, fallback);
}

export function newDocumentId() {
  return getAdminFirestore().collection('_ids').doc().id;
}

export function serializeForJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function serializeDocumentRecord(value: JsonRecord): JsonRecord {
  const serialized = serializeForJson(value);
  if (!serialized || Array.isArray(serialized) || typeof serialized !== 'object') {
    throw new Error('Document store values must serialize to a JSON object.');
  }
  const next = { ...serialized };
  delete next.id;
  return next;
}

function mapSnapshot<T = JsonRecord>(snapshot: { id: string; exists: boolean; data(): unknown }) {
  return snapshot.exists ? ({ ...(snapshot.data() as T), id: snapshot.id } as T & { id: string }) : null;
}

export async function getDocument<T = JsonRecord>(collection: string, documentId: string) {
  try {
    return mapSnapshot<T>(await getAdminFirestore().collection(collection).doc(documentId).get());
  } catch (error) {
    throw normalizeDatabaseError(error as Error, 'Document storage is unavailable.');
  }
}

export async function setDocument(collection: string, documentId: string, data: JsonRecord, merge = false) {
  try {
    const ref = getAdminFirestore().collection(collection).doc(documentId);
    await ref.set(serializeDocumentRecord(data), { merge });
    return mapSnapshot((await ref.get()))!;
  } catch (error) {
    throw normalizeDatabaseError(error as Error, 'Document storage is unavailable.');
  }
}

export async function updateDocument(collection: string, documentId: string, patch: JsonRecord) {
  try {
    const db = getAdminFirestore();
    const ref = db.collection(collection).doc(documentId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error(collection + '/' + documentId + ' does not exist.');
      transaction.set(ref, serializeDocumentRecord(applyDottedPatch({ ...snapshot.data(), id: snapshot.id }, patch)));
    });
    return mapSnapshot((await ref.get()))!;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(collection + '/' + documentId + ' does not exist.')) throw error;
    throw normalizeDatabaseError(error as Error, 'Document storage is unavailable.');
  }
}

export async function mutateDocumentAtomically<T = JsonRecord>(
  collection: string,
  documentId: string,
  mutate: (document: JsonRecord & { id: string }) => { patch: JsonRecord; result: T; ledger?: EconomyLedgerMutation },
  options?: { requestId?: string }
) {
  try {
    const db = getAdminFirestore();
    const ref = db.collection(collection).doc(documentId);
    const ledgerRef = options?.requestId ? db.collection('economyTransactions').doc(documentId + ':' + options.requestId) : null;
    return await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const document = mapSnapshot(snapshot);
      if (!document) throw new Error(collection + '/' + documentId + ' does not exist.');
      if (ledgerRef) {
        const previous = await transaction.get(ledgerRef);
        if (previous.exists) return { document, result: previous.data()!.result as T, replayed: true };
      }
      const mutation = mutate(document);
      const next = serializeDocumentRecord(applyDottedPatch(document, mutation.patch));
      transaction.set(ref, next);
      if (mutation.ledger && ledgerRef) {
        transaction.create(ledgerRef, {
          userId: documentId,
          ...serializeForJson(mutation.ledger),
          result: serializeForJson(mutation.result),
          createdAt: new Date().toISOString(),
        });
      }
      return { document: { ...next, id: documentId }, result: mutation.result, replayed: false };
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(collection + '/' + documentId + ' does not exist.')) throw error;
    throw normalizeDatabaseError(error as Error, 'Document storage is unavailable.');
  }
}

export async function addDocument(collection: string, data: JsonRecord) {
  const ref = getAdminFirestore().collection(collection).doc();
  const serialized = serializeDocumentRecord(data);
  await ref.set(serialized);
  return { ...serialized, id: ref.id };
}

export async function listDocuments<T = JsonRecord>(collection: string, options?: {
  limit?: number;
  orderBy?: string;
  direction?: 'asc' | 'desc';
  participant?: { field: 'players' | 'participantIds'; uid: string };
}) {
  try {
    let query: FirebaseFirestore.Query = getAdminFirestore().collection(collection);
    if (options?.participant) query = query.where(options.participant.field, 'array-contains', options.participant.uid);
    query = options?.orderBy
      ? query.orderBy(new FieldPath(options.orderBy), options.direction || 'desc')
      : query.orderBy(FieldPath.documentId(), options?.direction || 'desc');
    if (options?.limit) query = query.limit(options.limit);
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => mapSnapshot<T>(doc)!);
  } catch (error) {
    throw normalizeDatabaseError(error as Error, 'Document storage is unavailable.');
  }
}

export function applyDottedPatch(source: JsonRecord, patch: JsonRecord) {
  const next = { ...source };
  delete next.id;
  for (const [key, value] of Object.entries(patch)) {
    if (!key.includes('.')) {
      next[key] = value;
      continue;
    }
    const parts = key.split('.');
    let cursor = next;
    for (const part of parts.slice(0, -1)) {
      if (!cursor[part] || typeof cursor[part] !== 'object') cursor[part] = {};
      cursor = cursor[part];
    }
    cursor[parts.at(-1)!] = value;
  }
  return next;
}
