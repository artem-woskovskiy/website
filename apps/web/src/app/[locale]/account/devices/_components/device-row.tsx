'use client';

import { Cpu, Laptop, MapPin, Network, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { revokeDeviceAction } from '../actions';

interface Props {
  device: {
    id: string;
    clientName: string;
    deviceName: string | null;
    platform: string | null;
    ip: string | null;
    geoCountry: string | null;
    scope: string[];
    lastSeenAt: string | null;
    createdAt: string;
  };
}

export function DeviceRow({ device }: Props) {
  const t = useTranslations('account.devices');
  const [pending, startTransition] = useTransition();

  const handleRevoke = () => {
    const fd = new FormData();
    fd.set('session_id', device.id);
    startTransition(async () => {
      await revokeDeviceAction(fd);
    });
  };

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--color-accent)]/15 text-[var(--color-accent)]">
          <Laptop className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{device.clientName}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[var(--color-fg-mute)]">
            {device.platform && (
              <span className="inline-flex items-center gap-1">
                <Cpu className="size-3" />
                {device.platform}
              </span>
            )}
            {device.ip && (
              <span className="inline-flex items-center gap-1">
                <Network className="size-3" />
                {device.ip}
              </span>
            )}
            {device.geoCountry && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {device.geoCountry}
              </span>
            )}
            <span>
              {t('addedOn')} {device.createdAt.slice(0, 10)}
            </span>
            {device.lastSeenAt && (
              <span>
                {t('lastSeen')} {device.lastSeenAt.slice(0, 10)}
              </span>
            )}
          </div>
          {device.scope.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {device.scope.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-[var(--color-bg-grid)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-fg-mute)]"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={handleRevoke}
        className="md:w-32"
      >
        <RotateCcw className="mr-1 size-3.5" />
        {pending ? t('revoking') : t('revoke')}
      </Button>
    </li>
  );
}
