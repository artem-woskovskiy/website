import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Sepaito · Admin',
  robots: { index: false, follow: false },
};

/**
 * Top-level /admin layout — intentionally a passthrough so that the login
 * page (`/admin/login`) can render its own full-screen UI without the
 * authenticated chrome. The actual sidebar, topbar, and auth gate live in
 * `(authed)/layout.tsx`, which only wraps protected pages via a route group.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
