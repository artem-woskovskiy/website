import IORedis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __sepaitoAdminRedis: IORedis | undefined;
}

/**
 * Lazy ioredis singleton for admin-panel inspection of the BullMQ queue.
 * Keeping it on `globalThis` avoids exhausting connections during dev
 * hot-reload.
 *
 * Returns `null` if there's no REDIS_URL configured — callers must handle
 * that gracefully so the admin panel still renders without Redis in dev.
 */
export function getAdminRedis(): IORedis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (globalThis.__sepaitoAdminRedis) return globalThis.__sepaitoAdminRedis;
  const client = new IORedis(url, {
    maxRetriesPerRequest: null,
    lazyConnect: false,
    enableOfflineQueue: false,
  });
  // Don't crash the page if Redis is briefly unreachable.
  client.on('error', () => {});
  globalThis.__sepaitoAdminRedis = client;
  return client;
}
