'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronRight, ShieldCheck, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authorizeDeviceAction } from '../actions';

interface Scope {
  id: string;
  label: string;
}

interface Props {
  client: { name: string; description: string | null; iconUrl: string | null };
  user: { email: string; name: string | null };
  device: { name: string | null; platform: string | null; ip: string | null; geo: string | null };
  scopes: Scope[];
  hidden: {
    client_id: string;
    redirect_uri: string;
    scope: string;
    code_challenge: string;
    code_challenge_method: 'S256';
    state?: string;
    device_name?: string;
    platform?: string;
  };
}

/**
 * Animated "Open in Sepaito Desktop?" consent card. Renders a single form
 * that submits to the same server action for both Approve and Deny; the
 * action redirects the browser to the OS-level `sepaito://` deep link.
 */
export function ConsentCard({ client, user, device, scopes, hidden }: Props) {
  const t = useTranslations('oauth.consent');
  const reduced = useReducedMotion();
  const [pending, setPending] = useState<'approve' | 'deny' | null>(null);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(60% 50% at 30% 0%, var(--color-accent-soft), transparent 60%)',
        }}
        animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }}
      />

      <div className="relative p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[oklch(0.55_0.20_240)] text-white shadow-[0_10px_30px_-10px_var(--color-accent)]">
            <ShieldCheck className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              {t('title', { app: client.name })}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
              {client.description ?? t('defaultSubtitle')}
            </p>
          </div>
        </div>

        {/* Identity */}
        <div className="mt-6 rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] p-4">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-[var(--color-fg-dim)]">
            <span>{t('signedInAs')}</span>
            <span>{t('verified')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{user.name ?? user.email}</div>
              <div className="truncate font-mono text-xs text-[var(--color-fg-mute)]">
                {user.email}
              </div>
            </div>
            <Check className="size-4 shrink-0 text-[var(--color-success)]" />
          </div>
        </div>

        {/* Device */}
        <div className="mt-3 rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-fg-dim)]">
            {t('device')}
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-[var(--color-fg-mute)]">{t('app')}</dt>
            <dd className="font-mono text-right">{client.name}</dd>
            <dt className="text-[var(--color-fg-mute)]">{t('os')}</dt>
            <dd className="font-mono text-right">{device.platform ?? '—'}</dd>
            <dt className="text-[var(--color-fg-mute)]">{t('ip')}</dt>
            <dd className="font-mono text-right">{device.ip ?? '—'}</dd>
            <dt className="text-[var(--color-fg-mute)]">{t('location')}</dt>
            <dd className="font-mono text-right">{device.geo ?? '—'}</dd>
          </dl>
        </div>

        {/* Scopes */}
        <div className="mt-3 rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--color-fg-dim)]">
            {t('grants')}
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {scopes.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" />
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <form
          action={authorizeDeviceAction}
          className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          onSubmit={(e) => {
            const decision =
              (e.nativeEvent as SubmitEvent).submitter instanceof HTMLButtonElement
                ? ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement).value
                : 'approve';
            setPending(decision as 'approve' | 'deny');
          }}
        >
          {Object.entries(hidden).map(([k, v]) =>
            v == null ? null : <input key={k} type="hidden" name={k} value={v} />,
          )}
          <Button
            type="submit"
            name="decision"
            value="deny"
            variant="ghost"
            disabled={pending !== null}
            className="sm:w-32"
          >
            <X className="mr-1 size-4" />
            {pending === 'deny' ? t('denying') : t('deny')}
          </Button>
          <Button
            type="submit"
            name="decision"
            value="approve"
            disabled={pending !== null}
            className="sm:w-48"
          >
            {pending === 'approve' ? t('opening') : t('open', { app: client.name })}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
