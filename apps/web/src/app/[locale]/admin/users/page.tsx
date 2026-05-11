import { Card } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import { Link } from '@/i18n/navigation';
import { Users, Search } from 'lucide-react';

export const metadata = { title: 'Users' };

interface UsersResp {
  items: Array<{
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    subscriptions: Array<{ status: string; plan: { name: string; code: string } }>;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export default async function AdminUsersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', params.page);
  const { data } = await serverFetch<UsersResp>(`/admin/users?${qs.toString()}`);
  if (!data) return <p className="text-[var(--color-fg-mute)]">Failed to load users.</p>;

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-[10px] uppercase tracking-[0.2em] mb-1">
          <Users className="size-3" />
          User Management
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <span className="text-sm text-[var(--color-fg-mute)] font-mono">{data.total} total</span>
        </div>
      </header>

      {/* Search */}
      <form className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fg-dim)]" />
        <input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search by email or name…"
          className="w-full h-10 rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
        />
      </form>

      {/* Users table */}
      <Card className="border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[var(--color-fg-dim)]">
              <tr className="border-b border-[var(--color-bg-grid)]">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium text-right">Joined</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-bg-grid)]">
              {data.items.map((u) => {
                const sub = u.subscriptions[0];
                return (
                  <tr key={u.id} className="group hover:bg-[var(--color-bg-grid)]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 place-items-center rounded-lg bg-[var(--color-bg-grid)] font-mono text-[10px] font-bold">
                          {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{u.name ?? 'Unnamed'}</span>
                          <span className="text-[10px] text-[var(--color-fg-dim)] font-mono truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-tighter ${
                        u.role === 'ADMIN'
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-grid)] text-[var(--color-fg-dim)]'
                      }`}>
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
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex h-7 items-center rounded-md border border-[var(--color-bg-grid)] px-3 text-[11px] text-[var(--color-fg-mute)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {data.items.length === 0 && (
                <tr>
                  <td className="px-6 py-12 text-center text-[var(--color-fg-mute)] italic" colSpan={5}>
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-[var(--color-bg-grid)] p-4">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?page=${p}${params.q ? `&q=${params.q}` : ''}`}
                className={`grid size-8 place-items-center rounded text-xs font-mono transition-colors ${
                  p === data.page
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                    : 'hover:bg-[var(--color-bg-grid)]'
                }`}
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
