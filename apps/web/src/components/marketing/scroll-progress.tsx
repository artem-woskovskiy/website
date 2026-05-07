'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Thin accent bar pinned to the very top of the viewport. Width tracks scroll
 * progress through the document. Spring-smoothed so it feels alive instead of
 * snapping. Adaline.ai uses a near-identical indicator.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    mass: 0.4,
  });

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-[var(--color-accent)]"
      style={{ scaleX }}
    />
  );
}
