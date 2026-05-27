'use client';

import type { LocalCollectionRef, LocalDocRef } from '@/lib/client/document-client';
import { addDoc, setDoc, updateDoc } from '@/lib/client/document-client';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function setDocumentNonBlocking(docRef: LocalDocRef, data: any, options: { merge?: boolean } = {}) {
  void setDoc(docRef, data, options).catch(() => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write',
        requestResourceData: data,
      })
    );
  });
}

export function addDocumentNonBlocking(colRef: LocalCollectionRef, data: any) {
  return addDoc(colRef, data).catch(() => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
    return undefined;
  });
}

export function updateDocumentNonBlocking(docRef: LocalDocRef, data: any) {
  void updateDoc(docRef, data).catch(() => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}

export function deleteDocumentNonBlocking(_docRef: LocalDocRef) {
  return;
}
