import { ThemeScript } from '@/components/theme/theme-script';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
