import { requireAdminSession } from '@/lib/admin-auth';
import type { ReactNode } from 'react';
import { AdminSidebar } from '../_components/admin-sidebar';
import { AdminTopbar } from '../_components/admin-topbar';

export const dynamic = 'force-dynamic';

/**
 * Authenticated admin chrome. The route group `(authed)` lets us keep the
 * login page outside of this gate while rendering everything else with the
 * sidebar+topbar shell. URL-wise, pages inside this group still live at
 * `/admin`, `/admin/users`, etc. — the group is invisible.
 */
export default async function AuthedAdminLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();
  return (
    <div className="grid min-h-dvh bg-[var(--color-bg)] md:grid-cols-[260px_1fr]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-col">
        <AdminTopbar />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
