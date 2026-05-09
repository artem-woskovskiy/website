'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// Framer Motion accepts extra transform shortcuts (translateZ, rotate, etc.)
// that React.CSSProperties does not. Use a permissive style record so we can
// pass them directly without losing the rest of the strongly-typed CSS.
type MotionLayerStyle = Record<string, unknown>;

/**
 * Adaline-style 3D-CSS scenes for the sticky reel. Each visual matches the
 * topic of its card and floats with subtle layered parallax — pure CSS 3D,
 * no WebGL.
 *
 * Cross-browser notes:
 * - Animations always play (the splash screen is the only motion-respect surface).
 * - Safari sometimes flattens nested `transform-style: preserve-3d` when a
 *   descendant has `overflow:hidden` or filters. We side-step this by:
 *     • setting `perspective` on a *separate* outer wrapper from the rotating
 *       inner stage,
 *     • applying `transform: translate3d(0,0,0)` to every floater to force
 *       a fresh stacking context,
 *     • opting children into `will-change: transform`.
 * - Firefox rasterises 3D transforms more aggressively — keep `filter` off
 *   the rotating parent.
 */

type SceneProps = { className?: string };

export function ReelScene({ index, className }: { index: number; className?: string }) {
  const Scene = [TerminalStackScene, ModelOrbitScene, ThemeStackScene, ShellKeysScene][index];
  if (!Scene) return null;
  return <Scene className={className} />;
}

const layerStyle = (extra: MotionLayerStyle = {}): MotionLayerStyle => ({
  willChange: 'transform',
  WebkitBackfaceVisibility: 'hidden',
  backfaceVisibility: 'hidden',
  ...extra,
});

/* -------------------------------------------------------------------------- */
/* 01 · Multi-agent terminals                                                 */
/* -------------------------------------------------------------------------- */
function TerminalStackScene({ className }: SceneProps) {
  const PANES = [
    {
      title: 'T1 · Claude',
      accent: '#fbbf24',
      lines: ['> summarize commits', '✓ feat: pane scheduler', '✓ fix(grpc): retry'],
      offset: { x: -64, y: 28, z: -90, r: -12 },
    },
    {
      title: 'T2 · Codex',
      accent: '#60a5fa',
      lines: ['> implement feature', 'writing: jwt-auth.guard.ts', '↳ 3 files modified'],
      offset: { x: 0, y: 0, z: 0, r: -3 },
    },
    {
      title: 'T3 · Qwen',
      accent: '#34d399',
      lines: ['> explain this diff', 'covers 3 modules…', 'Refactor → port'],
      offset: { x: 56, y: -36, z: -60, r: 7 },
    },
  ];

  return (
    <Stage className={className}>
      {PANES.map((p, i) => (
        <motion.div
          key={p.title}
          className="absolute left-1/2 top-1/2 h-[180px] w-[300px] rounded-md border border-[#1c2230] bg-[#0b0e14] p-3 shadow-[0_30px_70px_-30px_oklch(0.4_0.05_250/0.55)]"
          style={layerStyle({
            x: p.offset.x - 150,
            y: p.offset.y - 90,
            translateZ: `${p.offset.z}px`,
            rotate: `${p.offset.r}deg`,
            transformStyle: 'preserve-3d',
            zIndex: 10 - Math.abs(p.offset.z) / 10,
          })}
          animate={{ y: [p.offset.y - 90, p.offset.y - 98, p.offset.y - 90] }}
          transition={{ duration: 6 + i, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <div className="flex items-center gap-1 border-b border-[#1c2230] pb-1.5">
            <span className="size-2 rounded-full bg-[#ef4444]" />
            <span className="size-2 rounded-full bg-[#fbbf24]" />
            <span className="size-2 rounded-full bg-[#22c55e]" />
            <span
              className="ml-2 font-mono text-[11px] font-medium tracking-tight"
              style={{ color: p.accent }}
            >
              {p.title}
            </span>
            <span className="ml-auto size-2 rounded-full" style={{ background: p.accent }} />
          </div>
          <div className="space-y-1.5 pt-2 font-mono text-[11px] leading-tight text-[#e6edf3]">
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
      className="inline-block h-[10px] w-[6px] align-baseline"
      style={{ background: color }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 02 · One workspace, every model                                            */
/* -------------------------------------------------------------------------- */
function ModelOrbitScene({ className }: SceneProps) {
  const MODELS = [
    { name: 'Claude', color: '#fbbf24', x: -130, y: -55, z: 50 },
    { name: 'GPT-5', color: '#34d399', x: 120, y: -45, z: -55 },
    { name: 'Gemini', color: '#60a5fa', x: -90, y: 75, z: -30 },
    { name: 'Kimi', color: '#c084fc', x: 130, y: 70, z: 60 },
  ];
  return (
    <Stage className={className}>
      {/* central core */}
      <motion.div
        className="absolute left-1/2 top-1/2 size-24 rounded-3xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] shadow-[0_30px_70px_-25px_oklch(0.6_0.18_260/0.55)]"
        animate={{ rotateZ: [0, 360] }}
        transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        style={layerStyle({ transformStyle: 'preserve-3d', x: -48, y: -48 })}
      >
        <div className="grid h-full place-items-center font-mono text-xs font-semibold tracking-[0.2em] text-[var(--color-fg)]">
          IDE
        </div>
      </motion.div>

      {/* orbiting model pills */}
      {MODELS.map((m, i) => (
        <motion.div
          key={m.name}
          className="absolute left-1/2 top-1/2 flex h-9 items-center gap-2 rounded-full border bg-[var(--color-bg)] px-3.5 font-mono text-xs font-medium shadow-[0_14px_36px_-15px_rgba(0,0,0,0.3)]"
          style={layerStyle({
            borderColor: m.color,
            color: m.color,
            x: m.x - 36,
            y: m.y - 18,
            translateZ: `${m.z}px`,
          })}
          animate={{ y: [m.y - 18, m.y - 28, m.y - 18], scale: [1, 1.06, 1] }}
          transition={{ duration: 5 + i * 0.7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          <span className="size-2 rounded-full" style={{ background: m.color }} />
          {m.name}
        </motion.div>
      ))}

      {/* connection lines */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0"
        viewBox="-200 -130 400 260"
        preserveAspectRatio="xMidYMid meet"
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
            strokeWidth={0.8}
            strokeDasharray="3 5"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
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
            className="absolute left-1/2 top-1/2 h-[150px] w-[240px] overflow-hidden rounded-xl border shadow-[0_24px_50px_-25px_rgba(0,0,0,0.5)]"
            style={layerStyle({
              borderColor: s.mid,
              background: s.bg,
              x: offset * 28 - 120,
              y: offset * 22 - 75,
              translateZ: `${offset * -38}px`,
              rotate: `${offset * 4}deg`,
              zIndex: SWATCHES.length - Math.abs(offset),
            })}
            animate={{
              y: [offset * 22 - 75, offset * 22 - 82, offset * 22 - 75],
            }}
            transition={{ duration: 5 + i * 0.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <div
              className="flex items-center gap-1.5 border-b px-2.5 py-1.5"
              style={{ borderColor: s.mid }}
            >
              <span className="size-2 rounded-full" style={{ background: s.fg, opacity: 0.9 }} />
              <span className="size-2 rounded-full" style={{ background: s.mid }} />
              <span className="size-2 rounded-full" style={{ background: s.mid }} />
              <span
                className="ml-2 font-mono text-[10px] tracking-tight"
                style={{ color: s.fg, opacity: 0.85 }}
              >
                {s.name}
              </span>
            </div>
            <div className="space-y-1.5 px-2.5 py-2 font-mono text-[10px] leading-snug">
              <div className="h-2 w-2/3 rounded-sm" style={{ background: s.fg, opacity: 0.65 }} />
              <div className="h-2 w-1/2 rounded-sm" style={{ background: s.mid }} />
              <div className="h-2 w-3/4 rounded-sm" style={{ background: s.fg, opacity: 0.4 }} />
              <div className="h-2 w-1/3 rounded-sm" style={{ background: s.mid }} />
              <div className="h-2 w-2/3 rounded-sm" style={{ background: s.fg, opacity: 0.5 }} />
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
  const KEYS = [
    { label: '⌘', x: -120, y: -50, z: 50, r: -10 },
    { label: 'K', x: -42, y: -68, z: -10, r: 4 },
    { label: '⌥', x: 50, y: -45, z: 55, r: 12 },
    { label: '⏎', x: 120, y: 5, z: -45, r: -6 },
    { label: '$_', x: 0, y: 75, z: 25, r: 0 },
  ];
  return (
    <Stage className={className}>
      {KEYS.map((k, i) => (
        <motion.div
          key={k.label}
          className="absolute left-1/2 top-1/2 grid size-16 place-items-center rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg)] font-mono text-xl font-medium text-[var(--color-fg)] shadow-[0_18px_38px_-15px_oklch(0.5_0.04_260/0.5)]"
          style={layerStyle({
            x: k.x - 32,
            y: k.y - 32,
            translateZ: `${k.z}px`,
            rotate: `${k.r}deg`,
          })}
          animate={{
            y: [k.y - 32, k.y - 40, k.y - 32],
            rotate: [`${k.r}deg`, `${k.r + 2}deg`, `${k.r}deg`],
          }}
          transition={{ duration: 4 + i * 0.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          {k.label === '$_' ? <span className="text-[var(--color-accent)]">$_</span> : k.label}
        </motion.div>
      ))}
    </Stage>
  );
}

/* -------------------------------------------------------------------------- */
function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`pointer-events-none ${className ?? ''}`}
      style={{
        // Outer perspective wrapper — Safari preserves 3D more reliably when
        // perspective lives separate from the rotating element.
        perspective: '1100px',
        WebkitPerspective: '1100px',
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform',
        }}
        animate={{ rotateY: [-7, 7, -7], rotateX: [3, -3, 3] }}
        transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
