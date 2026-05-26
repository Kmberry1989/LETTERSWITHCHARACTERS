import { getUserByToken } from '@/lib/server/auth';
import { addDocument, getDocument, listDocuments, setDocument, updateDocument } from '@/lib/server/document-store';

function makeSnapshot(collection: string, documentId: string, data: any | null) {
  return {
    id: documentId,
    exists: Boolean(data),
    data: () => {
      if (!data) return undefined;
      const { id, ...rest } = data;
      return rest;
    },
  };
}

export function getAdminApp() {
  return { name: 'local-postgres-app' };
}

export function getAdminAuth() {
  return {
    async verifyIdToken(token: string) {
      const user = await getUserByToken(token);
      if (!user) {
        throw new Error('Invalid or expired session token.');
      }
      return { uid: user.uid, email: user.email, name: user.displayName, picture: user.photoURL };
    },
  };
}

export function getAdminFirestore() {
  return {
    collection(collectionName: string) {
      return {
        doc(documentId?: string) {
          const id = documentId || crypto.randomUUID();
          return {
            id,
            path: `${collectionName}/${id}`,
            async get() {
              return makeSnapshot(collectionName, id, await getDocument(collectionName, id));
            },
            async set(data: Record<string, any>, options?: { merge?: boolean }) {
              return setDocument(collectionName, id, data, Boolean(options?.merge));
            },
            async update(patch: Record<string, any>) {
              return updateDocument(collectionName, id, patch);
            },
          };
        },
        async add(data: Record<string, any>) {
          const created = await addDocument(collectionName, data);
          return { id: created.id, path: `${collectionName}/${created.id}` };
        },
        orderBy(field: string, direction: 'asc' | 'desc' = 'desc') {
          return {
            limit(count: number) {
              return {
                async get() {
                  const docs = await listDocuments(collectionName, { orderBy: field, direction, limit: count });
                  return { docs: docs.map((doc) => makeSnapshot(collectionName, doc.id, doc)) };
                },
              };
            },
          };
        },
      };
    },
    async runTransaction<T>(callback: (transaction: any) => Promise<T>) {
      const transaction = {
        async get(ref: any) {
          return ref.get();
        },
        set(ref: any, data: Record<string, any>) {
          return ref.set(data);
        },
        update(ref: any, patch: Record<string, any>) {
          return ref.update(patch);
        },
      };
      return callback(transaction);
    },
  };
}
