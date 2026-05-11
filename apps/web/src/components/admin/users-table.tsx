'use client';

import { useState, useMemo, useTransition } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Trash2, ShieldCheck, UserMinus, Loader2 } from 'lucide-react';

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  subscriptions: Array<{ status: string; plan: { name: string; code: string } }>;
}

interface Props {
  users: UserRow[];
}

export function UsersTable({ users }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<null | 'delete' | 'demote' | 'promote'>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const allChecked = users.length > 0 && selected.size === users.length;
  const someChecked = selected.size > 0 && selected.size < users.length;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    setBusy(true);
    try {
      const r = await api.post<{ deleted: number; skipped: number }>('/admin/users/bulk-delete', {
        ids: selectedIds,
      });
      setSelected(new Set());
      setConfirm(null);
      startTransition(() => router.refresh());
      if (r.skipped > 0) {
        alert(`Deleted ${r.deleted}. Skipped ${r.skipped} (bootstrap admin or self).`);
      }
    } catch (e) {
      alert(`Failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setBusy(false);
    }
  }

  async function bulkRole(role: 'USER' | 'ADMIN') {
    setBusy(true);
    try {
      await api.post('/admin/users/bulk-role', { ids: selectedIds, role });
      setSelected(new Set());
      setConfirm(null);
      startTransition(() => router.refresh());
    } catch (e) {
      alert(`Failed: ${e instanceof Error ? e.message : 'Unknown'}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-4 py-2.5 text-sm animate-in fade-in slide-in-from-top-1">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirm('promote')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="size-3.5" /> Make ADMIN
            </button>
            <button
              type="button"
              onClick={() => setConfirm('demote')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-bg-grid)] px-3 py-1 text-xs text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] transition-colors disabled:opacity-50"
            >
              <UserMinus className="size-3.5" /> Make USER
            </button>
            <button
              type="button"
              onClick={() => setConfirm('delete')}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-danger)]/40 px-3 py-1 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-[var(--color-fg-dim)] hover:text-[var(--color-fg)] transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
            <tr className="border-b border-[var(--color-bg-grid)]">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={toggleAll}
                  className="accent-[var(--color-accent)] size-4 align-middle"
                  aria-label="Select all on page"
                />
              </th>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Role</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium text-right">Joined</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-bg-grid)]">
            {users.map((u) => {
              const sub = u.subscriptions[0];
              const checked = selected.has(u.id);
              return (
                <tr
                  key={u.id}
                  className={`group transition-colors ${
                    checked
                      ? 'bg-[var(--color-accent-soft)]/40'
                      : 'hover:bg-[var(--color-bg-grid)]/20'
                  }`}
                >
                  <td className="px-4 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(u.id)}
                      className="accent-[var(--color-accent)] size-4 align-middle"
                      aria-label={`Select ${u.email}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-lg bg-[var(--color-bg-grid)] font-mono text-[10px] font-bold">
                        {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate">{u.name ?? 'Unnamed'}</span>
                        <span className="text-[10px] text-[var(--color-fg-dim)] font-mono truncate">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-tighter ${
                        u.role === 'ADMIN'
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-grid)] text-[var(--color-fg-dim)]'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-fg-mute)] text-xs">
                    {sub ? `${sub.plan.name} · ${sub.status}` : 'Hobby (free)'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] text-[var(--color-fg-mute)]">
                    {u.createdAt.slice(0, 10)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/admin/users/${u.id}`}
                      className="inline-flex h-7 items-center rounded-md border border-[var(--color-bg-grid)] px-3 text-[11px] text-[var(--color-fg-mute)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      Manage →
                    </a>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-[var(--color-fg-mute)] italic" colSpan={6}>
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => !busy && setConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-6 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {confirm === 'delete' && (
              <>
                <h3 className="text-lg font-semibold text-[var(--color-danger)] mb-1">
                  Delete {selected.size} user{selected.size === 1 ? '' : 's'}?
                </h3>
                <p className="text-sm text-[var(--color-fg-mute)] mb-5">
                  This permanently deletes the selected accounts and all their data. Bootstrap
                  admin and your own account are protected and will be skipped.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirm(null)}
                    disabled={busy}
                    className="h-9 rounded-md border border-[var(--color-bg-grid)] px-4 text-sm text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={bulkDelete}
                    disabled={busy}
                    className="h-9 rounded-md bg-[var(--color-danger)] px-4 text-sm font-medium text-white inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="size-3.5 animate-spin" />}
                    Delete permanently
                  </button>
                </div>
              </>
            )}
            {(confirm === 'demote' || confirm === 'promote') && (
              <>
                <h3 className="text-lg font-semibold mb-1">
                  Change role of {selected.size} user{selected.size === 1 ? '' : 's'} to{' '}
                  {confirm === 'promote' ? 'ADMIN' : 'USER'}?
                </h3>
                <p className="text-sm text-[var(--color-fg-mute)] mb-5">
                  {confirm === 'promote'
                    ? 'Grants full admin privileges to all selected accounts.'
                    : 'Removes admin privileges from all selected accounts. At least one admin must remain.'}
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirm(null)}
                    disabled={busy}
                    className="h-9 rounded-md border border-[var(--color-bg-grid)] px-4 text-sm text-[var(--color-fg-mute)] hover:text-[var(--color-fg)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => bulkRole(confirm === 'promote' ? 'ADMIN' : 'USER')}
                    disabled={busy}
                    className="h-9 rounded-md bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-fg)] inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {busy && <Loader2 className="size-3.5 animate-spin" />}
                    Confirm
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
