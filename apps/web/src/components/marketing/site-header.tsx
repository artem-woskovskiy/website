'use client';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from './locale-switcher';
import { Magnetic } from './magnetic';

export function SiteHeader({ user }: { user: { email: string; name: string | null } | null }) {
  const t = useTranslations('nav');
  const { scrollY } = useScroll();
  // Slightly stronger blur once the user has scrolled past the hero.
  const bgOpacity = useTransform(scrollY, [0, 80], [0.55, 0.85]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <motion.header
      className="sticky top-0 z-40 bg-[var(--color-bg)]/60 backdrop-blur-md"
      style={{ ['--header-bg-opacity' as string]: bgOpacity }}
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-[var(--color-bg-grid)]"
        style={{ opacity: borderOpacity }}
      />
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 md:px-10">
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-7 place-items-center rounded-md bg-[var(--color-fg)] transition-transform group-hover:rotate-[-4deg]"
          >
            <span className="font-serif text-lg italic leading-none text-white">g</span>
          </span>
          <span className="font-medium tracking-tight">Sepaito</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-[var(--color-fg-mute)] md:flex">
          <NavLink href="/#product">{t('product')}</NavLink>
          <NavLink href="/pricing">{t('pricing')}</NavLink>
          <NavLink href="/about">{t('about')}</NavLink>
          <NavLink href="/download">{t('download')}</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {user ? (
            <Link
              href="/account"
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-bg-grid)] px-3 text-sm transition-colors hover:border-[var(--color-accent)]',
              )}
            >
              <span className="grid size-5 place-items-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-[var(--color-accent-fg)]">
                {(user.name ?? user.email)[0]?.toUpperCase()}
              </span>
              <span>{t('account')}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden h-9 items-center px-3 text-sm text-[var(--color-fg-mute)] transition-colors hover:text-[var(--color-fg)] sm:inline-flex"
              >
                {t('signIn')}
              </Link>
              <Magnetic>
                <Link
                  href="/sign-up"
                  className="inline-flex h-9 items-center rounded-full bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-strong)]"
                >
                  {t('getSepaito')}
                </Link>
              </Magnetic>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative transition-colors hover:text-[var(--color-fg)]"
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--color-accent)] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}
