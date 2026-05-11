'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { RevealItem, RevealStagger } from './reveal';

type Theme = {
  name: string;
  bg: string;
  bgElev: string;
  border: string;
  fg: string;
  mute: string;
  accent: string;
  string: string;
  number: string;
  comment: string;
};

const THEMES: Theme[] = [
  { name: 'Claude Darkula', bg: '#1c150c', bgElev: '#241b10', border: '#3d2914', fg: '#f2e6c8', mute: '#a89272', accent: '#fbbf24', string: '#a3e635', number: '#fb7185', comment: '#7c6f5a' },
  { name: 'Cursor',         bg: '#0f0f12', bgElev: '#16161b', border: '#26262e', fg: '#e7e7ee', mute: '#a1a1aa', accent: '#7a4dff', string: '#86efac', number: '#fda4af', comment: '#71717a' },
  { name: 'Light',          bg: '#ffffff', bgElev: '#f7f7f9', border: '#e3e3e8', fg: '#111827', mute: '#6b7280', accent: '#ff7a3d', string: '#16a34a', number: '#dc2626', comment: '#9ca3af' },
  { name: 'Midnight Blue',  bg: '#0a1428', bgElev: '#0f1d3b', border: '#1e3358', fg: '#e1ecff', mute: '#8aa3cc', accent: '#3a7bff', string: '#7dd3fc', number: '#fda4af', comment: '#5b6f95' },
  { name: 'Monokai Pro',    bg: '#221f22', bgElev: '#2c282d', border: '#3e3a3f', fg: '#fcfcfa', mute: '#939293', accent: '#ffd866', string: '#a9dc76', number: '#ff6188', comment: '#727072' },
  { name: 'Nord',           bg: '#2e3440', bgElev: '#3b4252', border: '#434c5e', fg: '#eceff4', mute: '#d8dee9', accent: '#88c0d0', string: '#a3be8c', number: '#b48ead', comment: '#616e88' },
  { name: 'Solarized Dark', bg: '#002b36', bgElev: '#073642', border: '#0e4956', fg: '#fdf6e3', mute: '#93a1a1', accent: '#b58900', string: '#859900', number: '#dc322f', comment: '#586e75' },
  { name: 'Gruvbox Dark',   bg: '#282828', bgElev: '#32302f', border: '#3c3836', fg: '#ebdbb2', mute: '#a89984', accent: '#fe8019', string: '#b8bb26', number: '#fb4934', comment: '#665c54' },
  { name: 'Dracula',        bg: '#282a36', bgElev: '#343746', border: '#44475a', fg: '#f8f8f2', mute: '#bdbdbd', accent: '#bd93f9', string: '#50fa7b', number: '#ff79c6', comment: '#6272a4' },
  { name: 'GitHub Dark',    bg: '#0d1117', bgElev: '#161b22', border: '#30363d', fg: '#e6edf3', mute: '#8b949e', accent: '#58a6ff', string: '#7ee787', number: '#ff7b72', comment: '#6e7681' },
  { name: 'Tokyo Night',    bg: '#1a1b26', bgElev: '#24283b', border: '#2f334d', fg: '#c0caf5', mute: '#9aa5ce', accent: '#7aa2f7', string: '#9ece6a', number: '#ff9e64', comment: '#565f89' },
  { name: 'Catppuccin',     bg: '#1e1e2e', bgElev: '#313244', border: '#45475a', fg: '#cdd6f4', mute: '#a6adc8', accent: '#f5c2e7', string: '#a6e3a1', number: '#f38ba8', comment: '#7f849c' },
  { name: 'One Dark',       bg: '#282c34', bgElev: '#21252b', border: '#3e4451', fg: '#abb2bf', mute: '#828997', accent: '#e06c75', string: '#98c379', number: '#d19a66', comment: '#5c6370' },
  { name: 'Synthwave',      bg: '#1a0b2e', bgElev: '#241139', border: '#3a1d56', fg: '#f0eff4', mute: '#a78bda', accent: '#ff00ea', string: '#36f9f6', number: '#fede5d', comment: '#7a5cad' },
  { name: 'Sepaito BW',     bg: '#000000', bgElev: '#121212', border: '#252525', fg: '#ffffff', mute: '#707070', accent: '#ffffff', string: '#ffffff', number: '#ffffff', comment: '#505050' },
  { name: 'Sepaito Mono',   bg: '#0d0d0d', bgElev: '#161616', border: '#262626', fg: '#e5e5e5', mute: '#a3a3a3', accent: '#9aa0a6', string: '#cccccc', number: '#a3a3a3', comment: '#525252' },
];

export function ThemesStrip() {
  const t = useTranslations('themesStrip');
  const [active, setActive] = useState<Theme>(THEMES[0] as Theme);

  const applyTheme = (th: Theme) => {
    setActive(th);
    const themeId = th.name === 'Sepaito BW' ? 'bw' : th.name === 'Light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', themeId);
    document.cookie = `theme=${themeId}; path=/; max-age=31536000`;
  };

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
            {t('eyebrow')}
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{t('title')}</h2>
          <p className="mt-3 max-w-md text-sm text-[var(--color-fg-mute)]">{t('subtitle')}</p>
        </div>
      </div>

      {/* Live preview pane that animates whenever the active theme changes */}
      <ThemePreview theme={active} />

      <RevealStagger className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5" stagger={0.03}>
        {THEMES.map((th) => {
          const isActive = th.name === active.name;
          return (
            <RevealItem key={th.name}>
              <button
                type="button"
                onMouseEnter={() => setActive(th)}
                onFocus={() => setActive(th)}
                onClick={() => applyTheme(th)}
                className={`group w-full rounded-lg border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                  isActive
                    ? 'border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)_inset]'
                    : 'border-[var(--color-bg-grid)] hover:border-[var(--color-fg)]'
                }`}
                style={{
                  background: isActive ? `${th.bg}10` : 'transparent',
                }}
                aria-pressed={isActive}
              >
                <div className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: th.string, opacity: 0.85 }}
                    />
                    <span
                      className="size-2 rounded-full"
                      style={{ background: th.number, opacity: 0.85 }}
                    />
                    <span
                      className="size-2 rounded-full"
                      style={{ background: th.accent, opacity: 0.85 }}
                    />
                  </span>
                  <span
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: th.bgElev, opacity: 0.7 }}
                  />
                  <span
                    className="size-2 rounded-full transition-transform duration-300 group-hover:scale-150"
                    style={{ background: th.accent }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm">{th.name}</span>
                  {isActive && (
                    <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--color-accent)]">
                      Active
                    </span>
                  )}
                </div>
              </button>
            </RevealItem>
          );
        })}
      </RevealStagger>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Mini live IDE that recolors itself when the active theme changes.          */
/* -------------------------------------------------------------------------- */
function ThemePreview({ theme }: { theme: Theme }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      key={theme.name /* re-key triggers a soft crossfade on theme switch */}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="mt-8 overflow-hidden rounded-2xl border shadow-[0_30px_80px_-50px_oklch(0.4_0.05_250/0.35)]"
      style={{
        background: theme.bg,
        borderColor: theme.border,
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-1 border-b px-3 py-2"
        style={{ borderColor: theme.border }}
      >
        <span className="size-2.5 rounded-full bg-[#ef4444]" />
        <span className="size-2.5 rounded-full bg-[#fbbf24]" />
        <span className="size-2.5 rounded-full bg-[#22c55e]" />
        <span
          className="ml-3 font-mono text-[11px] tracking-tight"
          style={{ color: theme.mute }}
        >
          ~/sepaito · {theme.name}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-mono"
          style={{
            background: `${theme.accent}22`,
            color: theme.accent,
            border: `1px solid ${theme.accent}55`,
          }}
        >
          ● Live
        </span>
      </div>

      {/* Two-pane editor */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
        {/* Sidebar */}
        <aside
          className="hidden border-r p-3 md:block"
          style={{ borderColor: theme.border, background: theme.bgElev }}
        >
          <div
            className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em]"
            style={{ color: theme.mute }}
          >
            Workspaces
          </div>
          <div className="space-y-1 font-mono text-xs" style={{ color: theme.fg }}>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full" style={{ background: theme.accent }} />
              workspace-1
            </div>
            <div className="flex items-center gap-2 pl-3" style={{ color: theme.mute }}>
              workspace-2
            </div>
          </div>
          <div
            className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-[0.16em]"
            style={{ color: theme.mute }}
          >
            Terminals
          </div>
          <div className="space-y-1 font-mono text-xs" style={{ color: theme.fg }}>
            {['T1 · Claude', 'T2 · Codex', 'T3 · Qwen'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: [theme.string, theme.number, theme.accent][i] ?? theme.accent,
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </aside>

        {/* Editor */}
        <div className="p-4 font-mono text-xs leading-relaxed">
          <CodeLine n={1} theme={theme}>
            <span style={{ color: theme.comment }}>{`// AI agents IDE — themed live preview`}</span>
          </CodeLine>
          <CodeLine n={2} theme={theme}>
            <span style={{ color: theme.accent }}>const</span>{' '}
            <span style={{ color: theme.fg }}>agents</span>{' '}
            <span style={{ color: theme.mute }}>=</span>{' '}
            <span style={{ color: theme.string }}>['Claude', 'Codex', 'Qwen']</span>
            <span style={{ color: theme.mute }}>;</span>
          </CodeLine>
          <CodeLine n={3} theme={theme}>
            <span style={{ color: theme.accent }}>function</span>{' '}
            <span style={{ color: theme.number }}>spawn</span>
            <span style={{ color: theme.mute }}>(</span>
            <span style={{ color: theme.fg }}>name</span>
            <span style={{ color: theme.mute }}>) {'{'}</span>
          </CodeLine>
          <CodeLine n={4} theme={theme}>
            {'  '}
            <span style={{ color: theme.accent }}>return</span>{' '}
            <span style={{ color: theme.fg }}>terminal</span>
            <span style={{ color: theme.mute }}>.</span>
            <span style={{ color: theme.number }}>open</span>
            <span style={{ color: theme.mute }}>({'{'}</span>{' '}
            <span style={{ color: theme.fg }}>agent</span>
            <span style={{ color: theme.mute }}>:</span>{' '}
            <span style={{ color: theme.fg }}>name</span>{' '}
            <span style={{ color: theme.mute }}>{'}'});</span>
          </CodeLine>
          <CodeLine n={5} theme={theme}>
            <span style={{ color: theme.mute }}>{'}'}</span>
          </CodeLine>
          <CodeLine n={6} theme={theme}>
            <span style={{ color: theme.fg }}>agents</span>
            <span style={{ color: theme.mute }}>.</span>
            <span style={{ color: theme.number }}>forEach</span>
            <span style={{ color: theme.mute }}>(</span>
            <span style={{ color: theme.fg }}>spawn</span>
            <span style={{ color: theme.mute }}>);</span>
          </CodeLine>
          <CodeLine n={7} theme={theme}>
            <span style={{ color: theme.comment }}>// 3 panes booted in parallel</span>
            <BlinkingCaret color={theme.accent} />
          </CodeLine>
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between border-t px-3 py-1.5 font-mono text-[10px]"
        style={{ borderColor: theme.border, background: theme.bgElev, color: theme.mute }}
      >
        <span>main · ✓ ready</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={theme.name}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ color: theme.accent }}
          >
            theme: {theme.name}
          </motion.span>
        </AnimatePresence>
        <span>UTF-8 · LF · TS</span>
      </div>
    </motion.div>
  );
}

function CodeLine({
  n,
  children,
  theme,
}: {
  n: number;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        className="select-none text-right tabular-nums"
        style={{ color: theme.comment, minWidth: 18 }}
      >
        {n}
      </span>
      <span style={{ color: theme.fg }}>{children}</span>
    </div>
  );
}

function BlinkingCaret({ color }: { color: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return <span style={{ color }}> ▍</span>;
  }
  return (
    <motion.span
      style={{ color }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1.1, repeat: Infinity }}
    >
      {' '}▍
    </motion.span>
  );
}
