import { NextResponse } from 'next/server';
import { z, type ZodType } from 'zod';

export class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function requestId(request?: Request) {
  return request?.headers.get('x-request-id')?.slice(0, 128) || crypto.randomUUID();
}

export function jsonOk<T extends Record<string, unknown>>(data: T, request?: Request, init?: ResponseInit) {
  const id = requestId(request);
  return NextResponse.json({ ok: true, ...data, requestId: id }, {
    ...init,
    headers: { ...init?.headers, 'x-request-id': id },
  });
}

export function jsonError(error: unknown, request?: Request, fallback = 'Request failed.') {
  const id = requestId(request);
  const normalized = error instanceof ApiRequestError
    ? error
    : new ApiRequestError('INTERNAL_ERROR', fallback, 500);

  return NextResponse.json({
    ok: false,
    error: normalized.message,
    code: normalized.code,
    requestId: id,
    ...(normalized.details === undefined ? {} : { details: normalized.details }),
  }, {
    status: normalized.status,
    headers: { 'x-request-id': id },
  });
}

export function asApiError(error: unknown, fallback = 'Request failed.', defaultStatus = 500) {
  if (error instanceof ApiRequestError) return error;
  const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
    ? error.status
    : defaultStatus;
  return new ApiRequestError('REQUEST_FAILED', error instanceof Error ? error.message : fallback, status);
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiRequestError('INVALID_REQUEST', 'The request body is invalid.', 400, parsed.error.flatten());
  }
  return parsed.data;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.APP_ORIGIN?.replace(/\/$/, '');
  if (origin !== requestOrigin && origin !== configuredOrigin) {
    throw new ApiRequestError('ORIGIN_MISMATCH', 'This request came from an unexpected origin.', 403);
  }
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function enforceRateLimit(request: Request, scope: string, limit: number, windowMs = 60_000) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const key = `${scope}:${forwarded || request.headers.get('x-real-ip') || 'local'}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new ApiRequestError('RATE_LIMITED', 'Too many requests. Try again shortly.', 429);
  }
}

export const requestIdSchema = z.string().uuid().optional();
