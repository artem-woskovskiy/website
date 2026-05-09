'use client';

import type { Plan } from '@sepaito/db';
import { useActionState } from 'react';
import { upsertPlanAction } from './actions';

const initialState: { error: string | null; ok: boolean } = { error: null, ok: false };

export function PlanForm({ plan }: { plan: Plan | null }) {
  const [state, formAction, pending] = useActionState(upsertPlanAction, initialState);
  return (
    <form action={formAction} className="space-y-3">
      {plan && <input type="hidden" name="id" value={plan.id} />}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Code">
          <select
            name="code"
            defaultValue={plan?.code ?? 'HOBBY'}
            className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          >
            <option value="HOBBY">HOBBY</option>
            <option value="PRO">PRO</option>
            <option value="TEAM">TEAM</option>
          </select>
        </Field>
        <Field label="Name">
          <input
            name="name"
            defaultValue={plan?.name ?? ''}
            required
            maxLength={80}
            className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          name="description"
          defaultValue={plan?.description ?? ''}
          rows={2}
          maxLength={400}
          className="w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Цена / мес (коп.)">
          <input
            name="priceMonthlyRub"
            type="number"
            min={0}
            defaultValue={plan?.priceMonthlyRub ?? 0}
            className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
        </Field>
        <Field label="Цена / год (коп.)">
          <input
            name="priceYearlyRub"
            type="number"
            min={0}
            defaultValue={plan?.priceYearlyRub ?? 0}
            className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Panes limit">
          <input
            name="panesLimit"
            type="number"
            min={0}
            defaultValue={plan?.panesLimit ?? 4}
            className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
        </Field>
        <Field label="Workspaces limit">
          <input
            name="workspacesLimit"
            type="number"
            min={0}
            defaultValue={plan?.workspacesLimit ?? 1}
            className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />
        </Field>
      </div>

      <Field label="Фичи (одна на строку)">
        <textarea
          name="features"
          defaultValue={(plan?.features ?? []).join('\n')}
          rows={4}
          className="w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 py-2 font-mono text-xs outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={plan ? plan.isActive : true}
          className="size-4 accent-[var(--color-accent)]"
        />
        Активный
      </label>

      {state.error && (
        <p className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 py-2 text-xs text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-md border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-3 py-2 text-xs text-[var(--color-success)]">
          Сохранено.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center rounded-md bg-[var(--color-accent)] px-4 text-xs font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-strong)] disabled:opacity-50"
      >
        {pending ? 'Сохраняем…' : plan ? 'Обновить' : 'Создать'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
        {label}
      </span>
      {children}
    </label>
  );
}
