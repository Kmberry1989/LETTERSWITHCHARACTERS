export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

/**
 * A custom error class for Firestore permission errors.
 * This class captures detailed context about the failed request,
 * which is invaluable for debugging security rules.
 */
export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  public readonly originalError?: Error;

  constructor(context: SecurityRuleContext, originalError?: Error) {
    const formattedContext = JSON.stringify(context, null, 2);
    const message = `Firestore Permission Denied. Request Context:\n${formattedContext}`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    this.originalError = originalError;

    // This is for V8 environments (like Node.js and Chrome)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
