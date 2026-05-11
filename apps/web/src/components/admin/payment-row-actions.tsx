'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, RotateCcw, Undo2 } from 'lucide-react';

interface Props {
  paymentId: string;
  status: string;
}

export function PaymentRowActions({ paymentId, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | 'refund' | 'retry'>(null);
  const [, startTransition] = useTransition();

  async function refund() {
    const reason = window.prompt('Reason for refund (optional, shown in audit log):') ?? undefined;
    setBusy('refund');
    try {
      await api.post(`/admin/payments/${paymentId}/refund`, { reason });
      startTransition(() => router.refresh());
    } catch (e) {
      alert(`Refund failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setBusy(null);
    }
  }

  async function retry() {
    if (!confirm('Mark this failed payment as PENDING for retry?')) return;
    setBusy('retry');
    try {
      await api.post(`/admin/payments/${paymentId}/retry`);
      startTransition(() => router.refresh());
    } catch (e) {
      alert(`Retry failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setBusy(null);
    }
  }

  if (status === 'SUCCEEDED') {
    return (
      <button
        type="button"
        onClick={refund}
        disabled={busy !== null}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--color-bg-grid)] px-2.5 text-[11px] text-[var(--color-fg-mute)] hover:border-[var(--color-danger)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50"
        title="Refund this payment"
      >
        {busy === 'refund' ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Undo2 className="size-3" />
        )}
        Refund
      </button>
    );
  }

  if (status === 'FAILED') {
    return (
      <button
        type="button"
        onClick={retry}
        disabled={busy !== null}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-[var(--color-bg-grid)] px-2.5 text-[11px] text-[var(--color-fg-mute)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
        title="Re-queue this failed payment"
      >
        {busy === 'retry' ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <RotateCcw className="size-3" />
        )}
        Retry
      </button>
    );
  }

  return <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>;
}
