import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export const metadata = { title: 'Admin — sign in' };

export default async function AdminLoginPage() {
  const store = await cookies();
  if (verifyAdminCookieValue(store.get(ADMIN_COOKIE_NAME)?.value)) redirect('/admin');
  return <LoginForm />;
}
