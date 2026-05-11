'use client';

import { api } from '@/lib/api';
import { useState } from 'react';

export function RevokeButton({ sessionId }: { sessionId: string }) {
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const handleRevoke = async () => {
    if (!confirm('Revoke this session? The user will be signed out.')) return;
    setRevoking(true);
    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      setRevoked(true);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setRevoking(false);
    }
  };

  if (revoked) {
    return <span className="text-[10px] font-mono text-[var(--color-fg-dim)]">Revoked</span>;
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={revoking}
      className="text-[11px] text-[var(--color-danger)] hover:underline disabled:opacity-50"
    >
      {revoking ? 'Revoking…' : 'Revoke'}
    </button>
  );
}
