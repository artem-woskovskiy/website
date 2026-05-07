import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { serverFetch } from '@/lib/server-api';
import Link from 'next/link';

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
  if (!data) return <p>Failed to load.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              {data.total} total · page {data.page}
            </CardDescription>
          </div>
          <form className="flex gap-2">
            <input
              name="q"
              defaultValue={params.q ?? ''}
              placeholder="Search email or name…"
              className="h-9 w-64 rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm"
            />
          </form>
        </CardHeader>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.1em] text-[var(--color-fg-dim)]">
            <tr>
              <th className="py-2">Email</th>
              <th className="py-2">Name</th>
              <th className="py-2">Role</th>
              <th className="py-2">Plan</th>
              <th className="py-2">Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => {
              const sub = u.subscriptions[0];
              return (
                <tr key={u.id} className="border-t border-[var(--color-bg-grid)]">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2 text-[var(--color-fg-mute)]">{u.name ?? '—'}</td>
                  <td className="py-2">
                    <span
                      className={
                        u.role === 'ADMIN'
                          ? 'rounded bg-[var(--color-accent-soft)] px-2 py-0.5 text-xs text-[var(--color-accent)]'
                          : 'text-xs text-[var(--color-fg-mute)]'
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--color-fg-mute)]">
                    {sub ? `${sub.plan.name} · ${sub.status}` : 'Hobby'}
                  </td>
                  <td className="py-2 text-[var(--color-fg-mute)]">{u.createdAt.slice(0, 10)}</td>
                  <td className="py-2 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {data.items.length === 0 && (
              <tr>
                <td className="py-3 text-[var(--color-fg-mute)]" colSpan={6}>
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
