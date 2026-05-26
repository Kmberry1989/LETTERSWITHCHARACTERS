import { prisma } from '@/lib/prisma';

export type JsonRecord = Record<string, any>;

export function newDocumentId() {
  return crypto.randomUUID();
}

export function serializeForJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function getDocument<T = JsonRecord>(collection: string, documentId: string) {
  const doc = await prisma.appDocument.findUnique({
    where: {
      collection_documentId: {
        collection,
        documentId,
      },
    },
  });

  if (!doc) return null;
  return { id: doc.documentId, ...(doc.data as T) } as T & { id: string };
}

export async function setDocument(collection: string, documentId: string, data: JsonRecord, merge = false) {
  const existing = merge ? await getDocument(collection, documentId) : null;
  const nextData = serializeForJson({ ...(merge && existing ? existing : {}), ...data });
  delete nextData.id;

  await prisma.appDocument.upsert({
    where: {
      collection_documentId: {
        collection,
        documentId,
      },
    },
    create: {
      collection,
      documentId,
      data: nextData,
    },
    update: {
      data: nextData,
    },
  });

  return { id: documentId, ...nextData };
}

export async function updateDocument(collection: string, documentId: string, patch: JsonRecord) {
  const existing = await getDocument(collection, documentId);
  if (!existing) {
    throw new Error(`${collection}/${documentId} does not exist.`);
  }

  const nextData = serializeForJson(applyDottedPatch(existing, patch));
  delete nextData.id;

  await prisma.appDocument.update({
    where: {
      collection_documentId: {
        collection,
        documentId,
      },
    },
    data: {
      data: nextData,
    },
  });

  return { id: documentId, ...nextData };
}

export async function addDocument(collection: string, data: JsonRecord) {
  const documentId = newDocumentId();
  return setDocument(collection, documentId, data, false);
}

export async function listDocuments<T = JsonRecord>(collection: string, options?: { limit?: number; orderBy?: string; direction?: 'asc' | 'desc' }) {
  const docs = await prisma.appDocument.findMany({
    where: { collection },
    orderBy: { updatedAt: options?.direction || 'desc' },
    take: options?.limit,
  });

  const results = docs.map((doc) => ({ id: doc.documentId, ...(doc.data as T) }));

  if (!options?.orderBy) return results;

  return results.sort((a: any, b: any) => {
    const av = normalizeSortValue(a[options.orderBy!]);
    const bv = normalizeSortValue(b[options.orderBy!]);
    const compare = av > bv ? 1 : av < bv ? -1 : 0;
    return options.direction === 'asc' ? compare : -compare;
  });
}

export function applyDottedPatch(source: JsonRecord, patch: JsonRecord) {
  const next = { ...source };

  for (const [key, value] of Object.entries(patch)) {
    if (!key.includes('.')) {
      next[key] = value;
      continue;
    }

    const parts = key.split('.');
    let cursor = next;
    for (const part of parts.slice(0, -1)) {
      if (!cursor[part] || typeof cursor[part] !== 'object') {
        cursor[part] = {};
      }
      cursor = cursor[part];
    }
    cursor[parts[parts.length - 1]] = value;
  }

  return next;
}

function normalizeSortValue(value: any) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'string') {
    const date = Date.parse(value);
    return Number.isNaN(date) ? value : date;
  }
  return value;
}
