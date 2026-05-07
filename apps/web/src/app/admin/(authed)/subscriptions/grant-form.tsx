'use client';

import { useActionState } from 'react';
import { grantSubscriptionAction } from './actions';

interface PlanOption {
  id: string;
  code: string;
  name: string;
}

const initialState: { error: string | null; ok: boolean } = { error: null, ok: false };

export function GrantForm({ plans }: { plans: PlanOption[] }) {
  const [state, formAction, pending] = useActionState(grantSubscriptionAction, initialState);
  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-4">
      <Field label="Email пользователя" className="md:col-span-2">
        <input
          name="email"
          type="email"
          required
          maxLength={120}
          placeholder="user@example.com"
          className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
      </Field>
      <Field label="Plan">
        <select
          name="planId"
          required
          className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Interval">
        <select
          name="interval"
          defaultValue="MONTH"
          className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        >
          <option value="MONTH">MONTH</option>
          <option value="YEAR">YEAR</option>
        </select>
      </Field>
      <Field label="Длительность (дней)">
        <input
          name="days"
          type="number"
          min={1}
          max={365 * 5}
          defaultValue={30}
          className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
      </Field>
      <div className="flex items-end md:col-span-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md bg-[var(--color-accent)] px-4 text-xs font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
        >
          {pending ? 'Создаём…' : 'Выдать подписку'}
        </button>
      </div>

      {state.error && (
        <p className="md:col-span-4 rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 py-2 text-xs text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="md:col-span-4 rounded-md border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-3 py-2 text-xs text-[var(--color-success)]">
          Подписка создана.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
        {label}
      </span>
      {children}
    </label>
  );
}
