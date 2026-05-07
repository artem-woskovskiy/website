'use client';

import { motion } from 'framer-motion';
import { LogOut, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminSidebarMobile } from './admin-sidebar-mobile';

const TITLES: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/users': 'Users',
  '/admin/plans': 'Plans',
  '/admin/subscriptions': 'Subscriptions',
  '/admin/payments': 'Payments',
  '/admin/api-keys': 'API keys',
  '/admin/sessions': 'Sessions',
  '/admin/email-queue': 'Email queue',
  '/admin/settings': 'Settings',
};

function titleForPath(path: string): string {
  if (TITLES[path]) return TITLES[path];
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'admin' && parts[1]) return parts[1];
  return 'Admin';
}

export function AdminTopbar() {
  const path = usePathname() ?? '/admin';
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the path changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: path drives the reset
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-bg-grid)] bg-[var(--color-bg)]/85 px-4 backdrop-blur md:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="-ml-1 grid size-9 place-items-center rounded-md border border-transparent text-[var(--color-fg-mute)] transition-colors hover:border-[var(--color-bg-grid)] hover:text-[var(--color-fg)] md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="min-w-0"
          >
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
              Sepaito Admin
            </div>
            <div className="truncate text-sm font-semibold tracking-tight md:text-base">
              {titleForPath(path)}
            </div>
          </motion.div>
        </div>

        <form action="/admin/logout" method="post">
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-bg-grid)] px-3 text-xs font-medium text-[var(--color-fg-mute)] transition-colors hover:border-[var(--color-danger)]/40 hover:text-[var(--color-danger)]"
          >
            <LogOut className="size-3.5" />
            Выйти
          </button>
        </form>
      </header>

      {mobileOpen && <AdminSidebarMobile onClose={() => setMobileOpen(false)} />}
    </>
  );
}
