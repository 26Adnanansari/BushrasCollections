/**
 * useApiCache — Simple API response cache
 * Prevents redundant DB calls when switching tabs (Alt+Tab focus triggers).
 * Uses in-memory Map with TTL. Survives component re-mounts but not page refreshes.
 */

const cache = new Map<string, { data: any; expires: number }>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: any, ttlSeconds = 120): void {
  cache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
}

export function clearCache(key: string): void {
  cache.delete(key);
}

export function clearAllCache(): void {
  cache.clear();
}
