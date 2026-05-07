import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';
import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=/admin');
  if (user.role !== 'ADMIN') redirect('/account');

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-16">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
              Admin
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sepaito control panel</h1>
          </div>
          <nav className="flex gap-3 text-sm text-[var(--color-fg-mute)]">
            <Link href="/admin" className="hover:text-[var(--color-fg)]">
              Overview
            </Link>
            <Link href="/admin/users" className="hover:text-[var(--color-fg)]">
              Users
            </Link>
            <Link href="/admin/payments" className="hover:text-[var(--color-fg)]">
              Payments
            </Link>
          </nav>
        </div>
        {children}
      </main>
    </>
  );
}
