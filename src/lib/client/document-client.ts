export type LocalDocRef = {
  kind: 'doc';
  collection: string;
  id: string;
  path: string;
};

export type LocalCollectionRef = {
  kind: 'collection';
  collection: string;
  path: string;
};

export type LocalQuery = {
  kind: 'query';
  collection: string;
  orderBy?: string;
  direction?: 'asc' | 'desc';
  limit?: number;
  path: string;
  __memo?: boolean;
};

export type LocalCollectionTarget = LocalCollectionRef | LocalQuery;

export function collection(_db: unknown, collectionName: string): LocalCollectionRef {
  return { kind: 'collection', collection: collectionName, path: collectionName };
}

export function doc(_dbOrCollection: unknown, collectionNameOrId?: string, id?: string): LocalDocRef {
  if (typeof _dbOrCollection === 'object' && _dbOrCollection && 'kind' in _dbOrCollection) {
    const collectionRef = _dbOrCollection as LocalCollectionRef;
    const documentId = collectionNameOrId || crypto.randomUUID();
    return {
      kind: 'doc',
      collection: collectionRef.collection,
      id: documentId,
      path: `${collectionRef.collection}/${documentId}`,
    };
  }

  const collectionName = String(collectionNameOrId || 'documents');
  const documentId = id || crypto.randomUUID();
  return {
    kind: 'doc',
    collection: collectionName,
    id: documentId,
    path: `${collectionName}/${documentId}`,
  };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'desc') {
  return { type: 'orderBy' as const, field, direction };
}

export function limit(count: number) {
  return { type: 'limit' as const, count };
}

export function query(collectionRef: LocalCollectionRef, ...clauses: Array<ReturnType<typeof orderBy> | ReturnType<typeof limit>>): LocalQuery {
  const localQuery: LocalQuery = {
    kind: 'query',
    collection: collectionRef.collection,
    path: collectionRef.path,
  };

  for (const clause of clauses) {
    if (clause.type === 'orderBy') {
      localQuery.orderBy = clause.field;
      localQuery.direction = clause.direction;
    }
    if (clause.type === 'limit') {
      localQuery.limit = clause.count;
    }
  }

  return localQuery;
}

export function serverTimestamp() {
  return new Date().toISOString();
}

export const Timestamp = Date;

export async function getDoc(ref: LocalDocRef) {
  const response = await fetch(`/api/documents/${encodeURIComponent(ref.collection)}/${encodeURIComponent(ref.id)}`, {
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  return {
    id: ref.id,
    exists: () => response.ok && Boolean(data?.document),
    data: () => data?.document || undefined,
  };
}

export async function setDoc(ref: LocalDocRef, data: Record<string, any>, options?: { merge?: boolean }) {
  const response = await fetch(`/api/documents/${encodeURIComponent(ref.collection)}/${encodeURIComponent(ref.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, merge: Boolean(options?.merge) }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Could not save document.');
  }

  return response.json();
}

export async function updateDoc(ref: LocalDocRef, patch: Record<string, any>) {
  const response = await fetch(`/api/documents/${encodeURIComponent(ref.collection)}/${encodeURIComponent(ref.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patch }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Could not update document.');
  }

  return response.json();
}

export async function addDoc(collectionRef: LocalCollectionRef, data: Record<string, any>) {
  const response = await fetch(`/api/documents/${encodeURIComponent(collectionRef.collection)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || 'Could not add document.');
  }

  return { id: result.document.id, path: `${collectionRef.collection}/${result.document.id}` };
}

export async function runTransaction(_db: unknown, callback: (transaction: any) => Promise<any>) {
  const transaction = {
    get: getDoc,
    set: setDoc,
    update: updateDoc,
  };

  return callback(transaction);
}
