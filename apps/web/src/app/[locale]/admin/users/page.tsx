import { serverFetch } from '@/lib/server-api';
import { Users, Search, Download, ArrowUpDown } from 'lucide-react';
import { UsersTable, type UserRow } from '@/components/admin/users-table';

export const metadata = { title: 'Users' };

interface UsersResp {
  items: UserRow[];
  total: number;
  page: number;
  pageSize: number;
}

type Sort = 'createdAt_desc' | 'createdAt_asc' | 'email_asc';

const ROLES = ['', 'USER', 'ADMIN'] as const;
const PLANS = ['', 'HOBBY', 'PRO', 'TEAM'] as const;
const SORTS: { value: Sort; label: string }[] = [
  { value: 'createdAt_desc', label: 'Newest first' },
  { value: 'createdAt_asc', label: 'Oldest first' },
  { value: 'email_asc', label: 'Email (A–Z)' },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    plan?: string;
    sort?: Sort;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.role) qs.set('role', params.role);
  if (params.plan) qs.set('plan', params.plan);
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', params.page);
  const { data } = await serverFetch<UsersResp>(`/admin/users?${qs.toString()}`);
  if (!data) return <p className="text-[var(--color-fg-mute)]">Failed to load users.</p>;

  const totalPages = Math.ceil(data.total / data.pageSize);
  const exportQs = new URLSearchParams(qs.toString());
  exportQs.delete('page');

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <Users className="size-3" />
          User Management
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <span className="text-sm text-[var(--color-fg-mute)] font-mono">
            {data.total.toLocaleString()} total
          </span>
        </div>
      </header>

      {/* Filter / search bar */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative grow min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fg-dim)]" />
          <input
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search by email or name…"
            className="w-full h-10 rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>
        <select
          name="role"
          defaultValue={params.role ?? ''}
          className="h-10 rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          aria-label="Filter by role"
        >
          {ROLES.map((r) => (
            <option key={r || 'any'} value={r}>
              {r ? `Role: ${r}` : 'Role: any'}
            </option>
          ))}
        </select>
        <select
          name="plan"
          defaultValue={params.plan ?? ''}
          className="h-10 rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          aria-label="Filter by plan"
        >
          {PLANS.map((p) => (
            <option key={p || 'any'} value={p}>
              {p ? `Plan: ${p}` : 'Plan: any'}
            </option>
          ))}
        </select>
        <label className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-fg-dim)] pointer-events-none" />
          <select
            name="sort"
            defaultValue={params.sort ?? 'createdAt_desc'}
            className="h-10 rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] pl-9 pr-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            aria-label="Sort"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-strong)] transition-colors"
        >
          Apply
        </button>
        <a
          href={`/api/v1/admin/users.csv?${exportQs.toString()}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--color-bg-grid)] px-3 text-sm text-[var(--color-fg-mute)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
          title="Download filtered users as CSV"
        >
          <Download className="size-3.5" /> CSV
        </a>
      </form>

      {/* Users table with bulk actions */}
      <UsersTable users={data.items} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => {
            const pageQs = new URLSearchParams(qs.toString());
            pageQs.set('page', String(p));
            return (
              <a
                key={p}
                href={`?${pageQs.toString()}`}
                className={`grid size-9 place-items-center rounded-md text-xs font-mono transition-colors ${
                  p === data.page
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                    : 'border border-[var(--color-bg-grid)] hover:bg-[var(--color-bg-grid)]'
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
