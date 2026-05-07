'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function RevokeButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await api.delete(`/users/me/sessions/${id}`);
        router.refresh();
      }}
    >
      {busy ? '…' : 'Revoke'}
    </Button>
  );
}
