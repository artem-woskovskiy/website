'use client';

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

/**
 * Subtle 3D tilt + cursor-following spotlight — the kind adaline.ai applies
 * to its feature/library cards. Hovering tilts the card a few degrees toward
 * the cursor and a soft radial glow tracks the pointer position.
 */
export function Tilt({
  children,
  className = '',
  glow = true,
  intensity = 6,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotX = useSpring(useTransform(y, [0, 1], [intensity, -intensity]), {
    stiffness: 220,
    damping: 18,
  });
  const rotY = useSpring(useTransform(x, [0, 1], [-intensity, intensity]), {
    stiffness: 220,
    damping: 18,
  });

  function handleMove(e: React.MouseEvent) {
    if (!ref.current || reduced) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    if (reduced) return;
    x.set(0.5);
    y.set(0.5);
  }

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX: rotX, rotateY: rotY, transformPerspective: 1100 }}
    >
      {children}
      {glow && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [x, y],
              ([px, py]) =>
                `radial-gradient(220px circle at ${(px as number) * 100}% ${(py as number) * 100}%, var(--color-accent-soft), transparent 60%)`,
            ),
          }}
        />
      )}
    </motion.div>
  );
}
