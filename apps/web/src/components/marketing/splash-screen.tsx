'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sepaito.splash.shown';
const VISIBLE_DURATION_MS = 1100;

/**
 * Branded one-shot splash screen. Shown once per session so subsequent
 * navigations don't replay the loader. Falls back gracefully when JS is
 * disabled — markup is `display:none` until the client hydrates.
 *
 * Always-on animation regardless of `prefers-reduced-motion`: the user
 * explicitly asked for the splash to play; we keep durations short.
 */
export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null;
    }
    if (storage?.getItem(STORAGE_KEY) === '1') return;

    setVisible(true);
    const timeout = window.setTimeout(() => {
      setVisible(false);
      try {
        storage?.setItem(STORAGE_KEY, '1');
      } catch {
        /* private mode */
      }
    }, VISIBLE_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[var(--color-bg)]"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }}
        >
          <SplashMesh />

          <motion.div
            className="relative flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Mark />
            <Wordmark />
            <ProgressBar />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Mark() {
  return (
    <motion.div
      className="relative grid size-16 place-items-center rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] shadow-[0_30px_60px_-30px_oklch(0.6_0.18_260/0.55)]"
      initial={{ rotate: -6 }}
      animate={{ rotate: 0 }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.span
        className="absolute inset-0 rounded-2xl ring-2 ring-[var(--color-accent)]/30"
        animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      <span className="font-mono text-[15px] font-semibold tracking-[0.18em] text-[var(--color-fg)]">
        S/
      </span>
    </motion.div>
  );
}

function Wordmark() {
  return (
    <div className="flex items-baseline gap-1.5 font-mono text-sm font-medium tracking-[0.16em] text-[var(--color-fg)]">
      <span>SEPAITO</span>
      <motion.span
        className="text-[var(--color-accent)]"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1.0, repeat: Number.POSITIVE_INFINITY }}
      >
        _
      </motion.span>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="relative h-[3px] w-44 overflow-hidden rounded-full bg-[var(--color-bg-grid)]">
      <motion.span
        className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-[var(--color-accent)]"
        initial={{ x: '-100%' }}
        animate={{ x: '320%' }}
        transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1], repeat: Number.POSITIVE_INFINITY }}
      />
    </div>
  );
}

function SplashMesh() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-[12%] top-[18%] size-[42vmin] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.85 0.17 260 / 0.55), transparent 70%)',
        }}
      />
      <div
        className="absolute right-[8%] top-[10%] size-[32vmin] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.92 0.08 240 / 0.7), transparent 75%)',
        }}
      />
      <div
        className="absolute bottom-[8%] left-[40%] size-[36vmin] rounded-full opacity-55 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.88 0.12 280 / 0.5), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          color: 'var(--color-fg-mute)',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
    </div>
  );
}
