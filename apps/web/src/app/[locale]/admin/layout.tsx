import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { getCurrentUser } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=/admin');
  if (user.role !== 'ADMIN') redirect('/account');

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-10 md:py-16">
          {children}
        </div>
      </main>
    </div>
  );
}
