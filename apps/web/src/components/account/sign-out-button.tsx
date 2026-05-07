'use client';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="danger"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api.post('/auth/sign-out');
        } catch {
          // ignore
        } finally {
          router.push('/');
          router.refresh();
        }
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
