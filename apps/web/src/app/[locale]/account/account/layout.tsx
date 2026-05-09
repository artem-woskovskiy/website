import { AccountSidebar } from '@/components/account/account-sidebar';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=/account');

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-[1280px] px-6 py-12 md:px-10 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <aside className="md:col-span-3">
            <AccountSidebar isAdmin={user.role === 'ADMIN'} />
          </aside>
          <section className="md:col-span-9">{children}</section>
        </div>
      </main>
    </>
  );
}
