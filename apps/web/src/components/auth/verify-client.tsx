'use client';

import { api } from '@/lib/api';
import { use, useEffect, useState } from 'react';

type Status = 'pending' | 'ok' | 'error' | 'idle';

export function VerifyClient({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = use(searchParams);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!params.token) return;
    setStatus('pending');
    api
      .post('/auth/verify-email', { token: params.token })
      .then(() => setStatus('ok'))
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [params.token]);

  if (!params.token) {
    return (
      <p className="mt-2 text-sm text-[var(--color-fg-mute)]">
        Open the link we just sent to your inbox.
      </p>
    );
  }
  if (status === 'pending') {
    return <p className="mt-2 text-sm text-[var(--color-fg-mute)]">Verifying…</p>;
  }
  if (status === 'ok') {
    return (
      <p className="mt-2 text-sm text-[var(--color-success)]">
        Email verified. You can close this tab.
      </p>
    );
  }
  if (status === 'error') {
    return <p className="mt-2 text-sm text-[var(--color-danger)]">{message}</p>;
  }
  return null;
}
