import { PageTransition } from '@/components/marketing/page-transition';
import { ScrollProgress } from '@/components/marketing/scroll-progress';
import { SmoothScroll } from '@/components/marketing/smooth-scroll';
import { SplashScreen } from '@/components/marketing/splash-screen';
import { type Locale, locales } from '@/i18n/config';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  style: ['italic'],
  variable: '--font-instrument',
});

export const metadata: Metadata = {
  title: { default: 'Sepaito — the AI Agents IDE', template: '%s — Sepaito' },
  description:
    'Sepaito is the AI Agents IDE — multi-terminal, multi-agent, multi-model. Bring your own keys.',
  metadataBase: new URL(process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Sepaito',
    title: 'Sepaito — the AI Agents IDE',
    description:
      'Multi-terminal, multi-agent, multi-model IDE. 15 themes, 8+ models, bring your own keys.',
  },
  twitter: { card: 'summary_large_image' },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale as Locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <SplashScreen />
          <SmoothScroll />
          <ScrollProgress />
          <PageTransition>{children}</PageTransition>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
