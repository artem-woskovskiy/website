'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CursorSpotlight } from '@/components/marketing/cursor-spotlight';
import { Tilt } from '@/components/marketing/tilt';

/**
 * Premium account dashboard header — gradient mesh, animated avatar, plan
 * badge, and a 3D stacked subscription card on the right. Used on every
 * /account/* page for visual continuity.
 */
export function AccountHero({
  name,
  email,
  planName,
  planStatus,
  renewsOn,
  apiKeyCount,
}: {
  name: string;
  email: string;
  planName: string;
  planStatus: string;
  renewsOn: string | null;
  apiKeyCount: number;
}) {
  const reduced = useReducedMotion();
  const initials = (name || email).slice(0, 2).toUpperCase();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <CursorSpotlight className="overflow-hidden rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]" size={380}>
      {/* Animated gradient mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-70"
        style={{
          background: `
            radial-gradient(60% 50% at 20% 30%, var(--color-accent-soft), transparent 60%),
            radial-gradient(50% 50% at 80% 70%, oklch(0.85 0.12 200 / 0.3), transparent 60%),
            radial-gradient(40% 40% at 50% 100%, oklch(0.85 0.12 320 / 0.2), transparent 60%)
          `,
        }}
      />

      <div className="relative grid grid-cols-1 gap-8 p-8 md:grid-cols-[1fr_auto] md:p-10">
        {/* Left: identity */}
        <div>
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[oklch(0.55_0.20_240)] font-mono text-lg font-semibold text-white shadow-[0_10px_30px_-10px_var(--color-accent)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {name || 'Welcome back'}
                </h1>
                <span className="inline-flex h-5 items-center gap-1 rounded-full border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-fg-mute)]">
                  <span className="size-1.5 rounded-full bg-[var(--color-success)]" />
                  online
                </span>
              </div>
              <p className="truncate text-sm text-[var(--color-fg-mute)]">{email}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-fg)]">
              {planName}
            </span>
            <span className="rounded-full border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-fg-mute)]">
              {planStatus}
            </span>
            {renewsOn && (
              <span className="rounded-full border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-fg-mute)]">
                renews {renewsOn}
              </span>
            )}
            <span className="ml-auto font-mono text-[11px] text-[var(--color-fg-dim)]">
              {time}
            </span>
          </div>
        </div>

        {/* Right: 3D stacked subscription card */}
        <Tilt intensity={5} className="hidden md:block" glow={false}>
          <SubscriptionStackCard
            planName={planName}
            apiKeyCount={apiKeyCount}
            renewsOn={renewsOn}
          />
        </Tilt>
      </div>
    </CursorSpotlight>
  );
}

function SubscriptionStackCard({
  planName,
  apiKeyCount,
  renewsOn,
}: {
  planName: string;
  apiKeyCount: number;
  renewsOn: string | null;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="relative h-[180px] w-[260px]" style={{ perspective: '900px' }}>
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        {/* Back card */}
        <motion.div
          className="absolute inset-0 rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] opacity-50"
          style={{ translateZ: '-30px', translateY: '8px', translateX: '8px', rotate: '-2deg' }}
          animate={reduced ? undefined : { translateY: ['8px', '4px', '8px'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Middle card */}
        <motion.div
          className="absolute inset-0 rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] opacity-80"
          style={{ translateZ: '-15px', translateY: '4px', translateX: '4px', rotate: '-1deg' }}
          animate={reduced ? undefined : { translateY: ['4px', '0px', '4px'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* Front card */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-xl border border-[var(--color-bg-grid)] bg-gradient-to-br from-[var(--color-bg)] to-[var(--color-bg-elev)] shadow-[0_18px_40px_-20px_oklch(0.55_0.18_260/0.4)]"
          style={{ translateZ: '0px' }}
          animate={reduced ? undefined : { translateY: ['0px', '-4px', '0px'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        >
          {/* Card chrome */}
          <div className="flex items-center justify-between border-b border-[var(--color-bg-grid)] px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-fg-dim)]">
              Sepaito · Plan
            </span>
            <motion.span
              className="size-1.5 rounded-full bg-[var(--color-accent)]"
              animate={reduced ? undefined : { opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          {/* Plan label */}
          <div className="px-3 py-3">
            <div className="text-xl font-semibold tracking-tight">{planName}</div>
            <div className="mt-1 font-mono text-[11px] text-[var(--color-fg-mute)]">
              {renewsOn ? `renews · ${renewsOn}` : 'no auto-renew'}
            </div>
          </div>

          {/* Card chip */}
          <div className="absolute right-3 top-12 grid h-7 w-9 grid-cols-3 grid-rows-3 gap-px overflow-hidden rounded-sm bg-gradient-to-br from-[var(--color-accent-soft)] to-transparent p-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="rounded-sm bg-[var(--color-accent)]/20" />
            ))}
          </div>

          {/* Stats line */}
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-fg-dim)]">
                API keys
              </div>
              <div className="font-mono text-base font-semibold text-[var(--color-fg)]">
                {apiKeyCount.toString().padStart(2, '0')}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-fg-dim)]">
                License
              </div>
              <div className="font-mono text-[11px] text-[var(--color-success)]">● active</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
