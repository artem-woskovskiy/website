import { VerifyClient } from '@/components/auth/verify-client';

export const metadata = { title: 'Verify email' };

export default function VerifyPage({
  searchParams,
}: { searchParams: Promise<{ token?: string }> }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Verify your email</h1>
      <VerifyClient searchParams={searchParams} />
    </div>
  );
}
