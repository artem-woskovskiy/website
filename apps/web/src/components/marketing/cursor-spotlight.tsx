'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Big soft glow that follows the cursor inside this section — adaline.ai
 * uses this on hero/feature blocks to make the page feel alive while the
 * cursor moves. Disabled for reduced-motion users.
 */
export function CursorSpotlight({
  children,
  className = '',
  size = 520,
  color = 'var(--color-accent-soft)',
}: {
  children: ReactNode;
  className?: string;
  size?: number;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const sx = useSpring(x, { stiffness: 180, damping: 24, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 180, damping: 24, mass: 0.6 });

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    const onLeave = () => {
      x.set(-9999);
      y.set(-9999);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, x, y]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -z-0 rounded-full opacity-70 blur-3xl"
          style={{
            x: sx,
            y: sy,
            width: size,
            height: size,
            translateX: '-50%',
            translateY: '-50%',
            background: `radial-gradient(circle, ${color}, transparent 60%)`,
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
