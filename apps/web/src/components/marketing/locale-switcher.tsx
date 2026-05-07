'use client';

import { localeFlags, localeNames, locales, type Locale } from '@/i18n/config';
import { usePathname, useRouter } from '@/i18n/navigation';
import { ChevronDown, Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--color-bg-grid)] px-2.5 text-sm text-[var(--color-fg-mute)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-fg)]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="size-3.5" />
        <span aria-hidden>{localeFlags[locale]}</span>
        <span className="hidden uppercase tracking-wider sm:inline">{locale}</span>
        <ChevronDown className="size-3 opacity-60" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] shadow-2xl"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setOpen(false);
                  router.replace(pathname, { locale: l });
                }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg)] ${
                  l === locale ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-mute)]'
                }`}
              >
                <span aria-hidden className="text-base">
                  {localeFlags[l]}
                </span>
                <span className="flex-1">{localeNames[l]}</span>
                {l === locale && (
                  <span className="size-1.5 rounded-full bg-[var(--color-accent)]" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
