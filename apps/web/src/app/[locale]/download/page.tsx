import { Link } from '@/i18n/navigation';
import { Reveal, RevealItem, RevealStagger } from '@/components/marketing/reveal';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';
import { Apple, Download, Monitor } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

const PLATFORMS = [
  { key: 'macos', icon: Apple, file: 'Sepaito-1.0.0-arm64.dmg' },
  { key: 'windows', icon: Monitor, file: 'Sepaito-1.0.0-x64.exe' },
  { key: 'linux', icon: Monitor, file: 'Sepaito-1.0.0-x86_64.AppImage' },
] as const;

export default async function DownloadPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const t = await getTranslations('download');

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="mesh relative">
          <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
            <Reveal>
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                {t('eyebrow')}
              </span>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-6xl">
                {t('title')}
              </h1>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-4 max-w-xl text-base text-[var(--color-fg-mute)]">
                {t('subtitle')}
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 pb-32 md:px-10">
          <RevealStagger className="grid grid-cols-1 gap-4 md:grid-cols-3" stagger={0.08}>
            {PLATFORMS.map((p) => (
              <RevealItem key={p.key}>
                <div className="hairline group flex h-full flex-col items-start rounded-2xl p-6 transition-colors hover:border-[var(--color-accent)]">
                  <p.icon className="size-7 text-[var(--color-accent)] transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="mt-5 text-lg font-medium">{t(p.key)}</h3>
                  <p className="mt-1 text-xs font-mono text-[var(--color-fg-dim)]">{p.file}</p>
                  <a
                    href={`https://downloads.sepaito.ai/${p.file}`}
                    className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-[var(--color-accent-fg)] transition-colors hover:bg-[var(--color-accent-strong)]"
                  >
                    <Download className="size-4" />
                    {t('download')}
                  </a>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>

          <Reveal>
            <div className="mt-10 flex items-center justify-between rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-6 py-4">
              <div>
                <p className="text-sm">{t('afterDownload')}</p>
                <p className="mt-0.5 text-xs text-[var(--color-fg-mute)]">{t('needKey')}</p>
              </div>
              <Link
                href={user ? '/account/api-keys' : '/sign-up'}
                className="inline-flex h-9 items-center rounded-md border border-[var(--color-bg-grid)] px-4 text-sm transition-colors hover:border-[var(--color-accent)]"
              >
                {user ? t('accountKeys') : t('signUp')}
              </Link>
            </div>
          </Reveal>

          <p className="mt-6 text-center text-xs text-[var(--color-fg-dim)]">{t('version')}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
