'use server';

import { ADMIN_COOKIE_NAME, checkCredentials, issueAdminCookieValue } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

export async function loginAction(_prev: { error: string | null }, formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: 'Заполните оба поля.' };
  }
  if (!checkCredentials(parsed.data.username, parsed.data.password)) {
    // Constant-ish delay to slow online brute-force; the real protection is
    // a strong ADMIN_PANEL_PASSWORD set out-of-band.
    await new Promise((r) => setTimeout(r, 600));
    return { error: 'Неверный логин или пароль.' };
  }
  const { value, maxAge } = issueAdminCookieValue();
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  });
  redirect('/admin');
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  redirect('/admin/login');
}
