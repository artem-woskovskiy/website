'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Activity, Radio } from 'lucide-react';

interface LiveMetrics {
  activeSessions: number;
  sessionsSeen5m: number;
  eventsLastHour: number;
  signupsLastDay: number;
  paymentsLastDay: { count: number; amountRub: number };
  generatedAt: string;
}

export function LiveMetricsCard() {
  const [data, setData] = useState<LiveMetrics | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const d = await api.get<LiveMetrics>('/admin/metrics/live');
        if (!alive) return;
        setData(d);
        setPulse(true);
        setTimeout(() => alive && setPulse(false), 400);
      } catch {
        // ignore — keep last good data
      }
    }
    load();
    const i = window.setInterval(load, 10_000);
    return () => {
      alive = false;
      window.clearInterval(i);
    };
  }, []);

  return (
    <section className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30 p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio
            className={`size-3.5 text-[var(--color-success)] ${pulse ? 'animate-ping' : ''}`}
          />
          <h2 className="text-sm font-medium">Live activity</h2>
        </div>
        <span className="font-mono text-[10px] text-[var(--color-fg-dim)]">
          {data ? new Date(data.generatedAt).toLocaleTimeString() : '—'} · polls every 10s
        </span>
      </header>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Tile
          label="Active sessions"
          value={data?.activeSessions ?? '—'}
          hint="not yet expired or revoked"
        />
        <Tile
          label="Online (5m)"
          value={data?.sessionsSeen5m ?? '—'}
          hint="lastSeen within 5m"
          accent
        />
        <Tile
          label="Events / hour"
          value={data?.eventsLastHour ?? '—'}
          hint="audit log writes"
        />
        <Tile
          label="Signups / 24h"
          value={data?.signupsLastDay ?? '—'}
          hint="new users"
        />
        <Tile
          label="Revenue / 24h"
          value={
            data
              ? `${(data.paymentsLastDay.amountRub / 100).toLocaleString('ru-RU')} ₽`
              : '—'
          }
          hint={data ? `${data.paymentsLastDay.count} payments` : ''}
        />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-bg-grid)]/60 bg-[var(--color-bg-elev)] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-2xl font-bold tracking-tight tabular-nums ${
          accent ? 'text-[var(--color-success)]' : ''
        }`}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-[10px] text-[var(--color-fg-dim)] flex items-center gap-1">
          <Activity className="size-2.5" /> {hint}
        </p>
      )}
    </div>
  );
}
