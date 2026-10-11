// In-memory results of the last list/profile loads for this tab. Pages paint from these instantly when the
// user navigates (e.g. from a dashboard row into the record's page) and then refresh in the background.
// Cleared on sign-out; mutations drop the keys they make stale.

const results = new Map<string, { value: unknown; expiresAt: number }>();
const inFlight = new Map<string, Promise<unknown>>();

/** Stores `value` under `key`; `ttlMs` bounds values that go stale on their own (e.g. signed URLs). */
export function remember<T>(key: string, value: T, ttlMs = Infinity): T {
  results.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function recall<T>(key: string): T | undefined {
  const entry = results.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    results.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/** Joins an identical request already on the wire (e.g. a hover prefetch followed by the click). */
export function shared<T>(key: string, load: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const request = load().finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

/** Drops every cached result whose key contains one of `fragments` (all of them when none are given). */
export function forget(...fragments: string[]) {
  for (const key of [...results.keys()]) {
    if (fragments.length === 0 || fragments.some((fragment) => key.includes(fragment))) results.delete(key);
  }
}
