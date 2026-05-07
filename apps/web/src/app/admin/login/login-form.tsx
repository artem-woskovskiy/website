'use client';

import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useActionState } from 'react';
import { loginAction } from './actions';

const initialState: { error: string | null } = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[var(--color-bg)] px-6">
      {/* Mesh backdrop in the site style */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(35% 40% at 22% 18%, var(--mesh-1), transparent 60%),' +
            'radial-gradient(40% 45% at 80% 25%, var(--mesh-2), transparent 60%),' +
            'radial-gradient(45% 50% at 55% 110%, var(--mesh-3), transparent 60%)',
          filter: 'blur(120px)',
          opacity: 0.45,
        }}
      />
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 -z-10 opacity-50"
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-sm rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-8 shadow-[0_30px_80px_-50px_oklch(0.4_0.05_250/0.35)]"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-[var(--color-fg)] text-[var(--color-bg)]">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Sepaito · Admin</h1>
            <p className="text-xs text-[var(--color-fg-mute)]">
              Только для операторов
            </p>
          </div>
        </div>

        <form action={formAction} className="space-y-3">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-fg-dim)]"
            >
              Логин
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              spellCheck={false}
              className="h-10 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-fg-dim)]"
            >
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
            />
          </div>

          {state.error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-3 py-2 text-sm text-[var(--color-danger)]"
            >
              {state.error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] text-sm font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending ? 'Проверяем…' : 'Войти'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-[var(--color-fg-dim)]">
          Доступ ограничен. Все попытки логируются.
        </p>
      </motion.div>
    </main>
  );
}
