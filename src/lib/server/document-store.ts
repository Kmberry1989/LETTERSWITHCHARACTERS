import { prisma } from '@/lib/prisma';

export type JsonRecord = Record<string, any>;

type AppDocumentRow = {
  collection: string;
  documentId: string;
  data: JsonRecord;
  updatedAt?: Date;
};

export class DocumentStoreUnavailableError extends Error {
  status = 503 as const;

  constructor(message: string) {
    super(message);
    this.name = 'DocumentStoreUnavailableError';
  }
}

function createDocumentStoreError(message: string) {
  return new DocumentStoreUnavailableError(message);
}

function normalizeDatabaseError(error: { message?: string; code?: string } | null | undefined, fallbackMessage: string) {
  const message = error?.message || fallbackMessage;

  if (message.includes('DATABASE_URL')) {
    return createDocumentStoreError(`${fallbackMessage} DATABASE_URL is missing or the server needs to be restarted after env changes.`);
  }

  if (
    message.includes("Can't reach database server") ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('timed out')
  ) {
    return createDocumentStoreError(`${fallbackMessage} The database could not be reached. Check the connection target and network access.`);
  }

  if (
    message.includes('Authentication failed against database server') ||
    message.includes('password authentication failed') ||
    message.includes('permission denied')
  ) {
    return createDocumentStoreError(`${fallbackMessage} The database rejected the configured credentials or permissions.`);
  }

  if (error?.code === 'P2021' || message.includes('does not exist')) {
    return createDocumentStoreError(`${fallbackMessage} The expected document storage tables are missing.`);
  }

  return createDocumentStoreError(fallbackMessage);
}

export function toDocumentStoreError(error: unknown, fallbackMessage = 'Document storage is unavailable.') {
  if (error instanceof DocumentStoreUnavailableError) {
    return error;
  }

  if (error instanceof Error) {
    return normalizeDatabaseError(error as Error & { code?: string }, fallbackMessage);
  }

  return createDocumentStoreError(fallbackMessage);
}

export function newDocumentId() {
  return crypto.randomUUID();
}

export function serializeForJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function serializeDocumentRecord(value: JsonRecord): JsonRecord {
  const serialized = serializeForJson(value);

  if (!serialized || Array.isArray(serialized) || typeof serialized !== 'object') {
    throw new Error('Document store values must serialize to a JSON object.');
  }

  const nextData = { ...(serialized as JsonRecord) };
  delete nextData.id;
  return nextData;
}

function mapDocumentRow<T = JsonRecord>(row: AppDocumentRow | null) {
  if (!row) return null;
  return { id: row.documentId, ...(row.data as T) } as T & { id: string };
}

export async function getDocument<T = JsonRecord>(collection: string, documentId: string) {
  try {
    const data = await prisma.appDocument.findUnique({
      where: {
        collection_documentId: {
          collection,
          documentId,
        },
      },
      select: {
        collection: true,
        documentId: true,
        data: true,
        updatedAt: true,
      },
    });

    return mapDocumentRow<T>((data as AppDocumentRow | null) ?? null);
  } catch (error) {
    throw normalizeDatabaseError(error as Error & { code?: string }, 'Document storage is unavailable.');
  }
}

export async function setDocument(collection: string, documentId: string, data: JsonRecord, merge = false) {
  try {
    const existing = merge ? await getDocument(collection, documentId) : null;
    const nextData = serializeDocumentRecord({ ...(merge && existing ? existing : {}), ...data });

    const saved = await prisma.appDocument.upsert({
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
      select: {
        collection: true,
        documentId: true,
        data: true,
        updatedAt: true,
      },
    });

    return mapDocumentRow(saved as AppDocumentRow)!;
  } catch (error) {
    throw normalizeDatabaseError(error as Error & { code?: string }, 'Document storage is unavailable.');
  }
}

export async function updateDocument(collection: string, documentId: string, patch: JsonRecord) {
  const existing = await getDocument(collection, documentId);
  if (!existing) {
    throw new Error(`${collection}/${documentId} does not exist.`);
  }

  const nextData = serializeDocumentRecord(applyDottedPatch(existing, patch));

  try {
    const data = await prisma.appDocument.update({
      where: {
        collection_documentId: {
          collection,
          documentId,
        },
      },
      data: {
        data: nextData,
      },
      select: {
        collection: true,
        documentId: true,
        data: true,
        updatedAt: true,
      },
    });

    return mapDocumentRow(data as AppDocumentRow)!;
  } catch (error) {
    throw normalizeDatabaseError(error as Error & { code?: string }, 'Document storage is unavailable.');
  }
}

export async function addDocument(collection: string, data: JsonRecord) {
  const documentId = newDocumentId();
  return setDocument(collection, documentId, data, false);
}

export async function listDocuments<T = JsonRecord>(collection: string, options?: { limit?: number; orderBy?: string; direction?: 'asc' | 'desc' }) {
  try {
    const data = await prisma.appDocument.findMany({
      where: {
        collection,
      },
      orderBy: {
        updatedAt: options?.direction === 'asc' ? 'asc' : 'desc',
      },
      take: options?.limit,
      select: {
        collection: true,
        documentId: true,
        data: true,
        updatedAt: true,
      },
    });

    const results = data.map((doc) => mapDocumentRow<T>(doc as AppDocumentRow)!);

    if (!options?.orderBy) {
      return results;
    }

    return results.sort((a: any, b: any) => {
      const av = normalizeSortValue(a[options.orderBy!]);
      const bv = normalizeSortValue(b[options.orderBy!]);
      const compare = av > bv ? 1 : av < bv ? -1 : 0;
      return options.direction === 'asc' ? compare : -compare;
    });
  } catch (error) {
    throw normalizeDatabaseError(error as Error & { code?: string }, 'Document storage is unavailable.');
  }
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
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value.toLowerCase();
  return JSON.stringify(value);
}
