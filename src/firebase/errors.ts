'use client';

import type { AppUser } from './provider';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
  user?: AppUser | null;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

function buildAuthObject(currentUser: AppUser | null | undefined): FirebaseAuthObject | null {
  if (!currentUser) {
    return null;
  }

  const providerId = currentUser.providerId || (currentUser.isAnonymous ? 'guest' : 'password');

  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: Boolean(currentUser.email),
    phone_number: null,
    sub: currentUser.uid,
    firebase: {
      identities: currentUser.email ? { [providerId]: [currentUser.email] } : {},
      sign_in_provider: providerId,
      tenant: null,
    },
  };

  return {
    uid: currentUser.uid,
    token,
  };
}

function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  return {
    auth: buildAuthObject(context.user),
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}

export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
