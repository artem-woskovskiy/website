'use client';

import { useEffect, useState } from 'react';

const PANES = [
  {
    title: 'T1 · Claude',
    accent: '#fbbf24',
    lines: [
      '> summarize recent commits',
      'Reviewing 6 files across 2 branches…',
      '✓ feat(orchestrator): parallel pane scheduler',
      '✓ fix(grpc): retry on UNAVAILABLE',
    ],
  },
  {
    title: 'T2 · Codex',
    accent: '#60a5fa',
    lines: [
      '> implement {feature}',
      'Generating: subscription guard…',
      'Writing: src/auth/guards/jwt-auth.guard.ts',
    ],
  },
  {
    title: 'T3 · Qwen',
    accent: '#34d399',
    lines: [
      '> explain this diff',
      'Diff covers 3 modules…',
      'Refactor moves PaymentProvider into a port.',
    ],
  },
  {
    title: 'T4 · Claude Code',
    accent: '#c084fc',
    lines: ['> write a test for <filepath>', 'Adding vitest spec…', '✓ 3 tests passing'],
  },
];

const DARK_BG = '#0b0e14';
const DARK_BG_ELEV = '#11151c';
const DARK_BORDER = '#1c2230';
const DARK_FG = '#e6edf3';
const DARK_FG_MUTE = '#8b949e';
const DARK_FG_DIM = '#6e7681';

export function IdeMock() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full p-3"
      style={{ background: DARK_BG, color: DARK_FG }}
    >
      <div className="mb-3 flex items-center gap-1.5 px-2">
        <span className="size-3 rounded-full" style={{ background: '#ff5f57' }} />
        <span className="size-3 rounded-full" style={{ background: '#febc2e' }} />
        <span className="size-3 rounded-full" style={{ background: '#28c840' }} />
        <span className="ml-3 font-mono text-xs" style={{ color: DARK_FG_DIM }}>
          Sepaito · Workspace 1
        </span>
      </div>

      <div className="grid grid-cols-12 gap-2">
        <aside
          className="col-span-3 rounded-md p-3"
          style={{ background: DARK_BG_ELEV, border: `1px solid ${DARK_BORDER}` }}
        >
          <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: DARK_FG_DIM }}>
            Workspaces
          </div>
          <div
            className="mt-2 flex items-center gap-2 rounded px-2 py-1 text-xs"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <span className="size-1.5 rounded-full" style={{ background: '#7aa2ff' }} /> Workspace 1
          </div>
          <div
            className="mt-4 text-[10px] uppercase tracking-[0.1em]"
            style={{ color: DARK_FG_DIM }}
          >
            Terminals
          </div>
          <ul className="mt-2 space-y-1 text-xs" style={{ color: DARK_FG_MUTE }}>
            {['T1', 'T2', 'T3', 'T4', 'T5', 'T6'].map((t, i) => (
              <li key={t} className="flex items-center gap-2">
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: i < 4 ? '#34d399' : DARK_FG_DIM }}
                />
                {t}
              </li>
            ))}
          </ul>
        </aside>

        <div className="col-span-9 grid grid-cols-2 gap-2">
          {PANES.map((p, idx) => (
            <Pane key={p.title} pane={p} active={tick % PANES.length === idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Pane({ pane, active }: { pane: (typeof PANES)[number]; active: boolean }) {
  return (
    <div
      className="relative flex h-44 flex-col rounded-md p-3 font-mono text-[11px]"
      style={{
        background: DARK_BG_ELEV,
        color: DARK_FG,
        border: `1px solid ${active ? pane.accent : DARK_BORDER}`,
        boxShadow: active ? `0 0 0 1px ${pane.accent}25 inset` : undefined,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.1em]" style={{ color: pane.accent }}>
          {pane.title}
        </span>
        <span className="size-1.5 rounded-full" style={{ background: pane.accent }} />
      </div>
      <div className="space-y-1">
        {pane.lines.map((l) => (
          <div key={l} style={{ color: l.startsWith('>') ? DARK_FG : DARK_FG_MUTE }}>
            {l}
          </div>
        ))}
        {active && (
          <span
            className="inline-block h-3 w-1.5 align-middle"
            style={{ background: pane.accent }}
          />
        )}
      </div>
    </div>
  );
}
