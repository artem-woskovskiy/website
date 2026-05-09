import { CtaStrip } from '@/components/marketing/cta-strip';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { getCurrentUser } from '@/lib/auth-server';

export const metadata = { title: 'About' };

const TIMELINE = [
  {
    year: '2025 · Spring',
    body: 'First prototype: a Cursor clone with three terminals running in parallel.',
  },
  {
    year: '2025 · Summer',
    body: 'Multi-model architecture lands. Claude, GPT and a custom MCP agent share one workspace.',
  },
  { year: '2025 · Autumn', body: 'AgentPanel beta opens to 100 builders.' },
  { year: '2026 · Spring', body: 'Sepaito 1.0 — 15 themes, 8 models, public launch.' },
];

const VALUES = [
  {
    title: 'Local-first',
    body: 'Your code, your prompts and your keys live on your machine. We never get to see any of it.',
  },
  {
    title: 'Model-agnostic',
    body: 'No vendor lock-in. Claude, GPT, Gemini, Kimi — and any MCP server you bring.',
  },
  {
    title: 'Keyboard-respecting',
    body: 'Every flow is reachable from a keystroke. Tab, Cmd+P, and your shell still rule.',
  },
];

export default async function AboutPage() {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="relative mesh">
          <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-40">
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
              About
            </span>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-7xl md:leading-[1.05]">
              We&rsquo;re building the IDE we{' '}
              <span className="font-serif italic text-[var(--color-accent)]">wished</span> existed
              when we started vibe-coding.
            </h1>
            <p className="mt-8 max-w-2xl text-lg text-[var(--color-fg-mute)] md:text-xl">
              Most editors treat AI as a sidekick. We treat it as a swarm. Sepaito makes every agent
              a first-class citizen — with its own pane, its own model, and its own opinion.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
            <div className="md:col-span-5">
              <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
                Manifesto
              </span>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                Three things we believe.
              </h2>
            </div>
            <div className="space-y-6 text-lg text-[var(--color-fg)] md:col-span-7 md:text-xl">
              <p>
                <span className="text-[var(--color-fg-mute)]">01</span> The IDE is the new shell. It
                deserves first-class agents, not popups.
              </p>
              <p>
                <span className="text-[var(--color-fg-mute)]">02</span> A workspace should remember
                the agents that worked in it. Conversation history is part of the codebase.
              </p>
              <p>
                <span className="text-[var(--color-fg-mute)]">03</span> Local first. Always. Your
                keys, your prompts, your privacy.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
            Timeline
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            How we got here.
          </h2>
          <ol className="mt-10 space-y-6 border-l border-[var(--color-bg-grid)] pl-8">
            {TIMELINE.map((t) => (
              <li key={t.year} className="relative">
                <span className="absolute -left-[37px] top-1.5 size-2.5 rounded-full bg-[var(--color-accent)]" />
                <div className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--color-fg-mute)]">
                  {t.year}
                </div>
                <div className="mt-1 text-base text-[var(--color-fg)]">{t.body}</div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
            Values
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            What we won&rsquo;t compromise on.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] p-6"
              >
                <h3 className="text-lg font-medium">{v.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-fg-mute)]">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-6 py-24 md:px-10 md:py-32">
          <CtaStrip />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
