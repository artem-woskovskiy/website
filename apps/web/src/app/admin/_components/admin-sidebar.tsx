'use client';

import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import {
  Activity,
  CreditCard,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, match: (p) => p === '/admin' },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/plans', label: 'Plans', icon: Sparkles },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Inbox },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/api-keys', label: 'API keys', icon: KeyRound },
  { href: '/admin/sessions', label: 'Sessions', icon: Activity },
  { href: '/admin/email-queue', label: 'Email queue', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const path = usePathname() ?? '/admin';
  return (
    <aside className="hidden border-r border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-bg-grid)] px-5">
        <span className="grid size-8 place-items-center rounded-md bg-[var(--color-fg)] text-[var(--color-bg)]">
          <ShieldCheck className="size-4" />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Sepaito</div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
            Admin Console
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.match ? item.match(path) : path.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="relative">
                {active && (
                  <motion.span
                    layoutId="admin-nav-indicator"
                    className="absolute inset-0 rounded-md bg-[var(--color-fg)]/[0.04] ring-1 ring-inset ring-[var(--color-bg-grid)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'relative z-10 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                    active
                      ? 'text-[var(--color-fg)]'
                      : 'text-[var(--color-fg-mute)] hover:text-[var(--color-fg)]',
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-[var(--color-bg-grid)] p-3 text-[11px] text-[var(--color-fg-dim)]">
        <div>v0.1 • read-write</div>
        <div className="mt-0.5">
          Логи действий: см. <span className="font-mono">audit_log</span>
        </div>
      </div>
    </aside>
  );
}
