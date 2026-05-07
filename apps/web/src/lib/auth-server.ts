import { serverFetch } from './server-api';
import type { MeUser } from './types';

/**
 * Reads the current user from the API on the server. Used by RSC pages.
 * Returns null when no/expired session.
 */
export async function getCurrentUser(): Promise<MeUser | null> {
  const { data } = await serverFetch<MeUser>('/auth/me');
  return data;
}
