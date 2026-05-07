'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Adaline-style 3D-CSS scenes for the sticky reel. Each visual matches the
 * topic of its card and floats with subtle layered parallax — pure CSS 3D,
 * no WebGL. Disabled on prefers-reduced-motion.
 */

type SceneProps = { className?: string };

export function ReelScene({ index, className }: { index: number; className?: string }) {
  const Scene = [TerminalStackScene, ModelOrbitScene, ThemeStackScene, ShellKeysScene][index];
  if (!Scene) return null;
  return <Scene className={className} />;
}

/* -------------------------------------------------------------------------- */
/* 01 · Multi-agent terminals                                                 */
/* -------------------------------------------------------------------------- */
function TerminalStackScene({ className }: SceneProps) {
  const reduced = useReducedMotion();
  const PANES = [
    {
      title: 'T1 · Claude',
      accent: '#fbbf24',
      lines: ['> summarize commits', '✓ feat: pane scheduler', '✓ fix(grpc): retry'],
      offset: { x: -38, y: 16, z: -60, r: -12 },
    },
    {
      title: 'T2 · Codex',
      accent: '#60a5fa',
      lines: ['> implement feature', 'writing: jwt-auth.guard.ts', '↳ 3 files modified'],
      offset: { x: 0, y: 0, z: 0, r: -4 },
    },
    {
      title: 'T3 · Qwen',
      accent: '#34d399',
      lines: ['> explain this diff', 'covers 3 modules…', 'Refactor → port'],
      offset: { x: 32, y: -24, z: -40, r: 6 },
    },
  ];

  return (
    <Stage className={className}>
      {PANES.map((p, i) => (
        <motion.div
          key={p.title}
          className="absolute left-1/2 top-1/2 h-[140px] w-[230px] rounded-md border border-[#1c2230] bg-[#0b0e14] p-2 shadow-[0_24px_60px_-30px_oklch(0.4_0.05_250/0.5)]"
          style={{
            x: p.offset.x - 115, // half-width to center
            y: p.offset.y - 70,  // half-height to center
            translateZ: `${p.offset.z}px`,
            rotate: `${p.offset.r}deg`,
            transformStyle: 'preserve-3d',
            zIndex: 10 - Math.abs(p.offset.z) / 10,
          }}
          animate={
            reduced
              ? undefined
              : {
                  y: [p.offset.y - 70, p.offset.y - 76, p.offset.y - 70],
                }
          }
          transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center gap-1 border-b border-[#1c2230] pb-1">
            <span className="size-1.5 rounded-full bg-[#ef4444]" />
            <span className="size-1.5 rounded-full bg-[#fbbf24]" />
            <span className="size-1.5 rounded-full bg-[#22c55e]" />
            <span className="ml-2 font-mono text-[9px] tracking-tight" style={{ color: p.accent }}>
              {p.title}
            </span>
            <span className="ml-auto size-1.5 rounded-full" style={{ background: p.accent }} />
          </div>
          <div className="space-y-1 pt-1.5 font-mono text-[9px] leading-tight text-[#e6edf3]">
            {p.lines.map((l) => (
              <div key={l} className={l.startsWith('>') ? 'text-[#8b949e]' : ''}>
                {l}
              </div>
            ))}
            <Caret color={p.accent} />
          </div>
        </motion.div>
      ))}
    </Stage>
  );
}

function Caret({ color }: { color: string }) {
  return (
    <motion.span
      className="inline-block h-[8px] w-[5px] align-baseline"
      style={{ background: color }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1.1, repeat: Infinity }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 02 · One workspace, every model                                            */
/* -------------------------------------------------------------------------- */
function ModelOrbitScene({ className }: SceneProps) {
  const reduced = useReducedMotion();
  const MODELS = [
    { name: 'Claude', color: '#fbbf24', x: -90, y: -40, z: 30 },
    { name: 'GPT-5', color: '#34d399', x: 80, y: -30, z: -40 },
    { name: 'Gemini', color: '#60a5fa', x: -60, y: 50, z: -20 },
    { name: 'Kimi', color: '#c084fc', x: 90, y: 50, z: 40 },
  ];
  return (
    <Stage className={className}>
      {/* central core */}
      <motion.div
        className="absolute left-1/2 top-1/2 size-16 rounded-2xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] shadow-[0_20px_50px_-20px_oklch(0.6_0.18_260/0.5)]"
        animate={reduced ? undefined : { rotateZ: [0, 360] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{ transformStyle: 'preserve-3d', x: -32, y: -32 }}
      >
        <div className="grid h-full place-items-center font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--color-fg)]">
          IDE
        </div>
      </motion.div>

      {/* orbiting model pills */}
      {MODELS.map((m, i) => (
        <motion.div
          key={m.name}
          className="absolute left-1/2 top-1/2 flex h-7 items-center gap-1.5 rounded-full border bg-[var(--color-bg)] px-2.5 font-mono text-[10px] font-medium shadow-[0_10px_30px_-15px_rgba(0,0,0,0.25)]"
          style={{
            borderColor: m.color,
            color: m.color,
            x: m.x - 26,
            y: m.y - 14,
            translateZ: `${m.z}px`,
          }}
          animate={
            reduced
              ? undefined
              : {
                  y: [m.y - 14, m.y - 22, m.y - 14],
                  scale: [1, 1.05, 1],
                }
          }
          transition={{ duration: 5 + i * 0.7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="size-1.5 rounded-full" style={{ background: m.color }} />
          {m.name}
        </motion.div>
      ))}

      {/* connection lines */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        viewBox="-150 -100 300 200"
        style={{ width: '100%', height: '100%' }}
      >
        <title>connections</title>
        {MODELS.map((m) => (
          <motion.line
            key={`line-${m.name}`}
            x1={0}
            y1={0}
            x2={m.x}
            y2={m.y}
            stroke={m.color}
            strokeWidth={0.6}
            strokeDasharray="2 4"
            initial={{ pathLength: 0, opacity: 0.2 }}
            animate={reduced ? undefined : { opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    </Stage>
  );
}

/* -------------------------------------------------------------------------- */
/* 03 · Themes that feel like home                                            */
/* -------------------------------------------------------------------------- */
function ThemeStackScene({ className }: SceneProps) {
  const reduced = useReducedMotion();
  const SWATCHES = [
    { name: 'Claude Darkula', bg: '#1c150c', fg: '#fbbf24', mid: '#3d2914' },
    { name: 'Dracula', bg: '#282a36', fg: '#bd93f9', mid: '#44475a' },
    { name: 'Nord', bg: '#2e3440', fg: '#88c0d0', mid: '#3b4252' },
    { name: 'Tokyo Night', bg: '#1a1b26', fg: '#7aa2f7', mid: '#24283b' },
    { name: 'Solarized', bg: '#002b36', fg: '#b58900', mid: '#073642' },
  ];
  return (
    <Stage className={className}>
      {SWATCHES.map((s, i) => {
        const offset = i - (SWATCHES.length - 1) / 2;
        return (
          <motion.div
            key={s.name}
            className="absolute left-1/2 top-1/2 h-[110px] w-[180px] overflow-hidden rounded-lg border shadow-[0_18px_40px_-25px_rgba(0,0,0,0.45)]"
            style={{
              borderColor: s.mid,
              background: s.bg,
              x: offset * 20 - 90,
              y: offset * 18 - 55,
              translateZ: `${offset * -28}px`,
              rotate: `${offset * 4}deg`,
              zIndex: SWATCHES.length - Math.abs(offset),
            }}
            animate={
              reduced
                ? undefined
                : {
                    y: [offset * 18 - 55, offset * 18 - 60, offset * 18 - 55],
                  }
            }
            transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div
              className="flex items-center gap-1 border-b px-2 py-1"
              style={{ borderColor: s.mid }}
            >
              <span className="size-1.5 rounded-full" style={{ background: s.fg, opacity: 0.9 }} />
              <span className="size-1.5 rounded-full" style={{ background: s.mid }} />
              <span className="size-1.5 rounded-full" style={{ background: s.mid }} />
              <span
                className="ml-2 font-mono text-[8px] tracking-tight"
                style={{ color: s.fg, opacity: 0.85 }}
              >
                {s.name}
              </span>
            </div>
            <div className="space-y-1 px-2 py-1.5 font-mono text-[8px] leading-snug">
              <div className="h-1.5 w-2/3 rounded-sm" style={{ background: s.fg, opacity: 0.65 }} />
              <div className="h-1.5 w-1/2 rounded-sm" style={{ background: s.mid }} />
              <div className="h-1.5 w-3/4 rounded-sm" style={{ background: s.fg, opacity: 0.4 }} />
              <div className="h-1.5 w-1/3 rounded-sm" style={{ background: s.mid }} />
              <div className="h-1.5 w-2/3 rounded-sm" style={{ background: s.fg, opacity: 0.5 }} />
            </div>
          </motion.div>
        );
      })}
    </Stage>
  );
}

/* -------------------------------------------------------------------------- */
/* 04 · Built for the terminal generation                                      */
/* -------------------------------------------------------------------------- */
function ShellKeysScene({ className }: SceneProps) {
  const reduced = useReducedMotion();
  const KEYS = [
    { label: '⌘', x: -80, y: -30, z: 30, r: -10 },
    { label: 'K', x: -28, y: -45, z: -10, r: 4 },
    { label: '⌥', x: 30, y: -28, z: 40, r: 12 },
    { label: '⏎', x: 80, y: 0, z: -30, r: -6 },
    { label: '$_', x: 0, y: 50, z: 10, r: 0 },
  ];
  return (
    <Stage className={className}>
      {KEYS.map((k, i) => (
        <motion.div
          key={k.label}
          className="absolute left-1/2 top-1/2 grid size-12 place-items-center rounded-lg border border-[var(--color-bg-grid)] bg-[var(--color-bg)] font-mono text-base font-medium text-[var(--color-fg)] shadow-[0_14px_30px_-15px_oklch(0.5_0.04_260/0.4)]"
          style={{
            x: k.x - 24,
            y: k.y - 24,
            translateZ: `${k.z}px`,
            rotate: `${k.r}deg`,
          }}
          animate={
            reduced
              ? undefined
              : {
                  y: [k.y - 24, k.y - 30, k.y - 24],
                  rotate: [`${k.r}deg`, `${k.r + 2}deg`, `${k.r}deg`],
                }
          }
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {k.label === '$_' ? (
            <span className="text-[var(--color-accent)]">$_</span>
          ) : (
            k.label
          )}
        </motion.div>
      ))}
    </Stage>
  );
}

/* -------------------------------------------------------------------------- */
function Stage({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div
      className={`pointer-events-none ${className ?? ''}`}
      style={{ perspective: '900px' }}
    >
      {/* Inner stage spans the full visual area; children center around its midpoint */}
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={reduced ? undefined : { rotateY: [-6, 6, -6], rotateX: [3, -3, 3] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
