'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useState } from 'react';

export function CheckoutButton({ planCode }: { planCode: 'PRO' | 'TEAM' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(interval: 'MONTH' | 'YEAR') {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ paymentUrl: string }>('/payments/checkout', {
        planCode,
        interval,
      });
      window.location.href = res.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="h-11 w-full"
        onClick={() => startCheckout('MONTH')}
        disabled={loading}
      >
        {loading ? 'Redirecting…' : 'Subscribe monthly'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full"
        onClick={() => startCheckout('YEAR')}
        disabled={loading}
      >
        Pay yearly (−17%)
      </Button>
      {error && <div className="text-xs text-[var(--color-danger)]">{error}</div>}
    </div>
  );
}
