'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { LayoutDashboard, Users, CreditCard, ShieldCheck, ArrowLeft, FileText, Monitor, Settings } from 'lucide-react';
import { useLocale } from 'next-intl';

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();

  const items = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Audit Log', href: '/admin/audit-log', icon: FileText },
    { label: 'Sessions', href: '/admin/sessions', icon: Monitor },
    { label: 'Plans', href: '/admin/plans', icon: CreditCard },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/50 hidden md:flex flex-col sticky top-0 h-screen">
      <div className="p-6 border-b border-[var(--color-bg-grid)]">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <ShieldCheck className="size-5 text-[var(--color-accent)]" />
          <span>Control Panel</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-fg-dim)] mt-1">
          Sepaito Intelligence
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              prefetch={false}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/${locale}${it.href}`;
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                active
                  ? 'bg-[var(--color-bg)] text-[var(--color-fg)] shadow-sm ring-1 ring-[var(--color-bg-grid)]'
                  : 'text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-grid)]/30'
              }`}
            >
              <it.icon className={`size-4 ${active ? 'text-[var(--color-accent)]' : ''}`} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--color-bg-grid)]">
        <Link
          href="/account"
          prefetch={false}
          onClick={(e) => {
            e.preventDefault();
            window.location.href = `/${locale}/account`;
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Profile
        </Link>
      </div>
    </aside>
  );
}
