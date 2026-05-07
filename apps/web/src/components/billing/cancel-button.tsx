'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        if (!confirm('Cancel at the end of the current period?')) return;
        setBusy(true);
        await api.post('/subscriptions/me/cancel');
        router.refresh();
      }}
    >
      {busy ? 'Cancelling…' : 'Cancel at period end'}
    </Button>
  );
}
