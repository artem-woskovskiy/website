'use client';

import { cn } from '@/lib/cn';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  CreditCard,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Mail,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/plans', label: 'Plans', icon: Sparkles },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: Inbox },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/api-keys', label: 'API keys', icon: KeyRound },
  { href: '/admin/sessions', label: 'Sessions', icon: Activity },
  { href: '/admin/email-queue', label: 'Email queue', icon: Mail },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebarMobile({ onClose }: { onClose: () => void }) {
  const path = usePathname() ?? '/admin';

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
      />
      <motion.aside
        key="drawer"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed inset-y-0 left-0 z-50 w-[78%] max-w-[300px] border-r border-[var(--color-bg-grid)] bg-[var(--color-bg)] p-3 md:hidden"
      >
        <div className="px-2.5 pb-3 pt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
          Sepaito Admin
        </div>
        <ul className="space-y-0.5">
          {ITEMS.map((item) => {
            const active = item.href === '/admin' ? path === '/admin' : path.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm transition-colors',
                    active
                      ? 'bg-[var(--color-fg)]/[0.05] text-[var(--color-fg)]'
                      : 'text-[var(--color-fg-mute)] hover:bg-[var(--color-fg)]/[0.03] hover:text-[var(--color-fg)]',
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.aside>
    </AnimatePresence>
  );
}
