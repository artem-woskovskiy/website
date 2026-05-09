'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'sep-theme';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t;
  try {
    localStorage.setItem(STORAGE_KEY, t);
  } catch {}
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);

    // Cross-tab sync: if another tab toggles, react here too.
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        applyTheme(e.newValue);
        setTheme(e.newValue);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  // Render the same shell on server + first client render to avoid hydration
  // mismatch; flip the icon only after mount.
  const isDark = mounted && theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={[
        'relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-bg-grid)] text-[var(--color-fg-mute)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-fg)]',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Sun
        className={`size-4 transition-all ${isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
        aria-hidden
      />
      <Moon
        className={`absolute size-4 transition-all ${isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`}
        aria-hidden
      />
    </button>
  );
}
