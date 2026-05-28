type TimestampLike =
  | Date
  | string
  | number
  | { toDate: () => Date }
  | null
  | undefined;

export function normalizeTimestamp(value: TimestampLike) {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date(0);
}
