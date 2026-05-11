'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function ConfigToggle({ configKey, initialValue }: { configKey: string; initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    const newValue = !enabled;
    try {
      await api.patch(`/admin/config/${configKey}`, { value: String(newValue) });
      setEnabled(newValue);
    } catch (err) {
      alert('Error saving config');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-bg-grid)]'
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } flex items-center justify-center`}
      >
        {loading && <Loader2 className="size-3 text-[var(--color-accent)] animate-spin" />}
      </span>
    </button>
  );
}
