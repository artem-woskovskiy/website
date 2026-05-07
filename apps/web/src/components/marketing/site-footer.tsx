import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function SiteFooter() {
  const t = useTranslations('footer');
  return (
    <footer className="mt-32 border-t border-[var(--color-bg-grid)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-10 px-6 py-16 md:grid-cols-5 md:px-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-[var(--color-fg)]">
              <span className="font-serif text-lg italic leading-none text-white">g</span>
            </span>
            <span className="font-medium tracking-tight">Sepaito</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-[var(--color-fg-mute)]">{t('tagline')}</p>
        </div>
        <FooterCol
          title={t('product')}
          items={[
            { href: '/#product', label: 'IDE' },
            { href: '/#themes', label: 'Themes' },
            { href: '/#models', label: 'Models' },
            { href: '/download', label: t('download') },
          ]}
        />
        <FooterCol
          title={t('company')}
          items={[
            { href: '/about', label: t('about') },
            { href: '/pricing', label: t('pricing') },
            { href: '/sign-up', label: t('signUp') },
          ]}
        />
        <FooterCol
          title={t('legal')}
          items={[
            { href: '/legal/terms', label: t('terms') },
            { href: '/legal/privacy', label: t('privacy') },
          ]}
        />
      </div>
      <div className="border-t border-[var(--color-bg-grid)] py-6 text-center text-xs text-[var(--color-fg-dim)]">
        © {new Date().getFullYear()} Sepaito.ai · {t('rights')}
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-[0.08em] text-[var(--color-fg-mute)]">{title}</h4>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="text-[var(--color-fg)] transition-colors hover:text-[var(--color-accent)]"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
