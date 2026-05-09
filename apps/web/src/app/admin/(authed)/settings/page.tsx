import { prisma } from '@/lib/prisma';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface EnvCheck {
  key: string;
  description: string;
  ok: boolean;
  value?: string;
}

function envCheck(
  key: string,
  description: string,
  predicate: (v: string | undefined) => boolean = (v) => !!v && v.length > 0,
  showValue = false,
): EnvCheck {
  const v = process.env[key];
  return {
    key,
    description,
    ok: predicate(v),
    value: showValue && v ? v : undefined,
  };
}

function loadEnvSummary(): { groups: { name: string; checks: EnvCheck[] }[] } {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    groups: [
      {
        name: 'Admin panel',
        checks: [
          envCheck('ADMIN_PANEL_USERNAME', 'Логин админ-панели', undefined, true),
          envCheck(
            'ADMIN_PANEL_PASSWORD',
            'Пароль админ-панели',
            (v) => !!v && (isProd ? v.length >= 8 : true),
          ),
          envCheck(
            'ADMIN_PANEL_SECRET',
            'HMAC-секрет для cookie',
            (v) => !!v && v.length >= 16,
          ),
        ],
      },
      {
        name: 'Auth (user app)',
        checks: [
          envCheck('AUTH_SECRET', 'AUTH_SECRET (≥16 chars)', (v) => !!v && v.length >= 16),
          envCheck('JWT_SECRET', 'JWT_SECRET (≥16 chars)', (v) => !!v && v.length >= 16),
          envCheck('JWT_ACCESS_TTL', 'JWT_ACCESS_TTL', undefined, true),
          envCheck('JWT_REFRESH_TTL', 'JWT_REFRESH_TTL', undefined, true),
        ],
      },
      {
        name: 'Database & cache',
        checks: [
          envCheck('DATABASE_URL', 'Postgres DSN'),
          envCheck('DIRECT_DATABASE_URL', 'Прямой DSN (для миграций)'),
          envCheck('REDIS_URL', 'Redis DSN'),
        ],
      },
      {
        name: 'Email',
        checks: [
          envCheck(
            'RESEND_API_KEY',
            'Resend API key',
            (v) => !!v && v !== 're_stub' && (isProd ? v.startsWith('re_') : true),
          ),
          envCheck('EMAIL_FROM', 'Email From', undefined, true),
        ],
      },
      {
        name: 'Robokassa',
        checks: [
          envCheck(
            'ROBOKASSA_MERCHANT_LOGIN',
            'Merchant login',
            (v) => !!v && v !== 'demo',
          ),
          envCheck(
            'ROBOKASSA_PASSWORD_1',
            'Password 1 (init)',
            (v) => !!v && v !== 'password1',
          ),
          envCheck(
            'ROBOKASSA_PASSWORD_2',
            'Password 2 (callback)',
            (v) => !!v && v !== 'password2',
          ),
          envCheck('ROBOKASSA_TEST_MODE', 'Test mode flag', (v) => v === '0' || v === '1', true),
        ],
      },
      {
        name: 'Public URLs',
        checks: [
          envCheck('PUBLIC_WEB_URL', 'Public web URL', undefined, true),
          envCheck('PUBLIC_API_URL', 'Public API URL', undefined, true),
          envCheck('GRPC_BIND', 'gRPC bind', undefined, true),
        ],
      },
    ],
  };
}

async function loadAuditPage(page: number) {
  const PAGE_SIZE = 50;
  const [total, rows] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, rows, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pageNum = Math.max(
    1,
    Math.min(10000, Number((typeof sp.page === 'string' && sp.page) || 1) || 1),
  );

  const env = loadEnvSummary();
  const audit = await loadAuditPage(pageNum);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-mute)]">
          Чувствительные значения хранятся в .env и git-secrets. Здесь только
          подсветка состояния и журнал действий.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2">
        {env.groups.map((g) => (
          <div
            key={g.name}
            className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-5"
          >
            <h3 className="text-sm font-semibold">{g.name}</h3>
            <ul className="mt-3 space-y-2">
              {g.checks.map((c) => (
                <li
                  key={c.key}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-[var(--color-fg)]">{c.key}</div>
                    <div className="text-xs text-[var(--color-fg-mute)]">
                      {c.description}
                    </div>
                    {c.value && (
                      <div className="mt-0.5 truncate font-mono text-[11px] text-[var(--color-fg-dim)]">
                        {c.value}
                      </div>
                    )}
                  </div>
                  {c.ok ? (
                    <span
                      title="OK"
                      className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    >
                      <CheckCircle2 className="size-4" />
                    </span>
                  ) : (
                    <span
                      title="Не настроено или дефолтное значение"
                      className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-500/10 text-amber-700"
                    >
                      <AlertTriangle className="size-4" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]">
        <div className="border-b border-[var(--color-bg-grid)] p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-fg-dim)]">
            Audit log
          </div>
          <div className="mt-1 text-sm">
            {audit.total.toLocaleString('ru-RU')} записей · стр. {pageNum} из {audit.totalPages}
          </div>
        </div>
        {audit.rows.length === 0 ? (
          <div className="p-5 text-sm text-[var(--color-fg-mute)]">Журнал пуст.</div>
        ) : (
          <ul className="divide-y divide-[var(--color-bg-grid)]">
            {audit.rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="font-mono text-xs">{row.action}</span>
                  <span className="truncate text-xs text-[var(--color-fg-mute)]">
                    {row.entityType ?? '—'} · {row.entityId ?? '—'} · {row.actorEmail ?? '—'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-fg-mute)]">
                  <span className="font-mono">{row.ip ?? '—'}</span>
                  <span>{row.createdAt.toISOString().slice(0, 19).replace('T', ' ')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {audit.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-bg-grid)] px-5 py-3 text-xs text-[var(--color-fg-mute)]">
            <span>стр. {pageNum} из {audit.totalPages}</span>
            <div className="flex gap-2">
              <a
                href={`/admin/settings?page=${Math.max(1, pageNum - 1)}`}
                className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5"
              >
                ← Назад
              </a>
              <a
                href={`/admin/settings?page=${Math.min(audit.totalPages, pageNum + 1)}`}
                className="rounded-md border border-[var(--color-bg-grid)] px-3 py-1.5"
              >
                Вперёд →
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
