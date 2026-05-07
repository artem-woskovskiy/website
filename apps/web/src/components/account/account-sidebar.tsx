'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, KeyRound, Shield, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AccountSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const t = useTranslations('account.nav');
  const reduced = useReducedMotion();

  const items = [
    { href: '/account', label: t('general'), icon: User },
    { href: '/account/billing', label: t('billing'), icon: CreditCard },
    { href: '/account/api-keys', label: t('apiKeys'), icon: KeyRound },
  ];

  return (
    <nav className="space-y-1">
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              active
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-fg-mute)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]'
            }`}
          >
            {active && (
              <motion.span
                layoutId="account-nav-active"
                className="absolute inset-0 rounded-md bg-[var(--color-bg-elev)] ring-1 ring-[var(--color-accent)]/40"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 30 }
                }
              />
            )}
            <it.icon className="relative size-4" />
            <span className="relative">{it.label}</span>
            {active && (
              <motion.span
                layoutId="account-nav-dot"
                className="relative ml-auto size-1.5 rounded-full bg-[var(--color-accent)]"
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 30 }
                }
              />
            )}
          </Link>
        );
      })}
      {isAdmin && (
        <>
          <div className="mt-6 px-3 text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
            Admin
          </div>
          <Link
            href="/admin"
            className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--color-fg-mute)] transition-colors hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-fg)]"
          >
            <Shield className="size-4" /> Admin panel
          </Link>
        </>
      )}
    </nav>
  );
}
