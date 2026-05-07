'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';

/**
 * Reveals a string word-by-word with a soft slide+fade as it scrolls into
 * view. Heavily inspired by adaline.ai's section-heading reveals — each word
 * tucked into an overflow-hidden mask, then unmasks with a subtle stagger.
 */
export function WordReveal({
  children,
  as: Tag = 'h2',
  className = '',
  delay = 0,
}: {
  children: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduced = useReducedMotion();
  const words = children.split(' ');

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[Tag] as typeof motion.h2;

  return (
    <MotionTag
      // biome-ignore lint/suspicious/noExplicitAny: motion ref typing
      ref={ref as any}
      className={className}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.045, delayChildren: delay } },
      }}
    >
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline">
          <span className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: '105%', opacity: 0 },
                show: {
                  y: '0%',
                  opacity: 1,
                  transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] },
                },
              }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </MotionTag>
  );
}
