import { createBackendClient } from '@/lib/supabase/config';

export type JsonRecord = Record<string, any>;

type AppDocumentRow = {
  collection: string;
  documentId: string;
  data: JsonRecord;
  updatedAt?: string;
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

function getDocumentStoreClient() {
  return createBackendClient();
}

function normalizeSupabaseError(error: { message?: string; code?: string } | null | undefined, fallbackMessage: string) {
  const message = error?.message || fallbackMessage;

  if (
    message.includes('NEXT_PUBLIC_SUPABASE_URL') ||
    message.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    message.includes('Supabase client env is missing')
  ) {
    return createDocumentStoreError(`${fallbackMessage} Supabase env is missing or the dev server needs to be restarted after env changes.`);
  }

  if (
    message.includes('Failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    error?.code === 'ECONNRESET'
  ) {
    return createDocumentStoreError(`${fallbackMessage} The Supabase API could not be reached. Check network access and project status.`);
  }

  if (message.includes('permission denied') || message.includes('JWT') || message.includes('row-level security')) {
    return new Error(`${fallbackMessage} The Supabase API rejected this request due to permissions or auth configuration.`);
  }

  return createDocumentStoreError(fallbackMessage);
}

export function toDocumentStoreError(error: unknown, fallbackMessage = 'Document storage is unavailable.') {
  if (error instanceof DocumentStoreUnavailableError) {
    return error;
  }

  if (error instanceof Error) {
    return normalizeSupabaseError({ message: error.message }, fallbackMessage);
  }

  return new Error(fallbackMessage);
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
  const supabase = getDocumentStoreClient();
  const { data, error } = await supabase
    .from('app_documents')
    .select('collection, documentId, data, updatedAt')
    .eq('collection', collection)
    .eq('documentId', documentId)
    .maybeSingle();

  if (error) {
    throw normalizeSupabaseError(error, 'Document storage is unavailable.');
  }

  return mapDocumentRow<T>((data as AppDocumentRow | null) ?? null);
}

export async function setDocument(collection: string, documentId: string, data: JsonRecord, merge = false) {
  const existing = merge ? await getDocument(collection, documentId) : null;
  const nextData = serializeDocumentRecord({ ...(merge && existing ? existing : {}), ...data });
  const supabase = getDocumentStoreClient();

  const { data: saved, error } = await supabase
    .from('app_documents')
    .upsert(
      {
        collection,
        documentId,
        data: nextData,
      },
      {
        onConflict: 'collection,documentId',
      }
    )
    .select('collection, documentId, data, updatedAt')
    .single();

  if (error) {
    throw normalizeSupabaseError(error, 'Document storage is unavailable.');
  }

  return mapDocumentRow(saved as AppDocumentRow)!;
}

export async function updateDocument(collection: string, documentId: string, patch: JsonRecord) {
  const existing = await getDocument(collection, documentId);
  if (!existing) {
    throw new Error(`${collection}/${documentId} does not exist.`);
  }

  const nextData = serializeDocumentRecord(applyDottedPatch(existing, patch));
  const supabase = getDocumentStoreClient();
  const { data, error } = await supabase
    .from('app_documents')
    .update({
      data: nextData,
    })
    .eq('collection', collection)
    .eq('documentId', documentId)
    .select('collection, documentId, data, updatedAt')
    .single();

  if (error) {
    throw normalizeSupabaseError(error, 'Document storage is unavailable.');
  }

  return mapDocumentRow(data as AppDocumentRow)!;
}

export async function addDocument(collection: string, data: JsonRecord) {
  const documentId = newDocumentId();
  return setDocument(collection, documentId, data, false);
}

export async function listDocuments<T = JsonRecord>(collection: string, options?: { limit?: number; orderBy?: string; direction?: 'asc' | 'desc' }) {
  const supabase = getDocumentStoreClient();
  let query = supabase
    .from('app_documents')
    .select('collection, documentId, data, updatedAt')
    .eq('collection', collection)
    .order('updatedAt', { ascending: options?.direction === 'asc' });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.returns<AppDocumentRow[]>();

  if (error) {
    throw normalizeSupabaseError(error, 'Document storage is unavailable.');
  }

  const results = (data || []).map((doc: AppDocumentRow) => mapDocumentRow<T>(doc)!);

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
