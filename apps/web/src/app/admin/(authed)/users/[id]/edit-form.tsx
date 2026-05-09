'use client';

import { useActionState } from 'react';
import { updateUserAction } from './actions';

interface Props {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  emailVerified: boolean;
}

const initialState: { error: string | null; ok: boolean } = { error: null, ok: false };

export function UserEditForm({ id, email, name, role, emailVerified }: Props) {
  const [state, formAction, pending] = useActionState(updateUserAction, initialState);
  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5"
    >
      <div>
        <h3 className="text-sm font-semibold">Профиль</h3>
        <p className="mt-1 text-xs text-[var(--color-fg-mute)]">
          Email менять отсюда нельзя — это меняет identity. Свяжитесь с пользователем.
        </p>
      </div>
      <input type="hidden" name="id" value={id} />

      <Field label="Email">
        <input
          readOnly
          value={email}
          className="h-9 w-full cursor-not-allowed rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-soft)] px-3 font-mono text-xs text-[var(--color-fg-mute)]"
        />
      </Field>
      <Field label="Имя">
        <input
          name="name"
          defaultValue={name}
          maxLength={120}
          className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        />
      </Field>
      <Field label="Роль">
        <select
          name="role"
          defaultValue={role}
          className="h-9 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="emailVerified"
          defaultChecked={emailVerified}
          className="size-4 accent-[var(--color-accent)]"
        />
        Email подтверждён
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
        {pending ? 'Сохраняем…' : 'Сохранить'}
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
