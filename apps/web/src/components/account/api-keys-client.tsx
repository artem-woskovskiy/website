'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useState } from 'react';

interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKeyDto[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState('');
  const [created, setCreated] = useState<{ raw: string; id: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await api.post<{
        id: string;
        name: string;
        prefix: string;
        raw: string;
        createdAt: string;
      }>('/api-keys', { name });
      setCreated({ raw: res.raw, id: res.id });
      setKeys([
        {
          id: res.id,
          name: res.name,
          keyPrefix: res.prefix,
          lastUsedAt: null,
          createdAt: res.createdAt,
        },
        ...keys,
      ]);
      setName('');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this key? Devices using it will be signed out.')) return;
    await api.delete(`/api-keys/${id}`);
    setKeys(keys.filter((k) => k.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs uppercase tracking-[0.08em] text-[var(--color-fg-mute)]">
            Name
          </label>
          <Input
            placeholder="AgentPanel on Win32"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button onClick={create} disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : 'Create key'}
        </Button>
      </div>

      {created && (
        <div className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 text-sm">
          <div className="font-medium">Copy this key now — it will not be shown again.</div>
          <code className="mt-2 block break-all rounded bg-black/40 p-2 font-mono text-xs">
            {created.raw}
          </code>
        </div>
      )}

      <ul className="divide-y divide-[var(--color-bg-grid)]">
        {keys.map((k) => (
          <li key={k.id} className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm">{k.name}</div>
              <div className="font-mono text-xs text-[var(--color-fg-mute)]">{k.keyPrefix}…</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => revoke(k.id)}>
              Revoke
            </Button>
          </li>
        ))}
        {keys.length === 0 && (
          <li className="py-3 text-sm text-[var(--color-fg-mute)]">No API keys yet.</li>
        )}
      </ul>
    </div>
  );
}
