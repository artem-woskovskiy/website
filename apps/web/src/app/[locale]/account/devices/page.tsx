import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth-server';
import { fetchOAuthDevices } from '@/lib/oauth-server';
import type { Locale } from '@/i18n/config';
import { DeviceRow } from './_components/device-row';

export const metadata = { title: 'Devices' };

export default async function DevicesPage(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in?next=/account/devices');

  const devices = await fetchOAuthDevices();
  const t = await getTranslations('account.devices');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </div>
        </CardHeader>
        <div className="px-6 pb-6">
          {devices.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-bg-grid)] p-8 text-center text-sm text-[var(--color-fg-mute)]">
              {t('empty')}
            </p>
          ) : (
            <ul className="space-y-2">
              {devices.map((d) => (
                <DeviceRow key={d.id} device={d} />
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
