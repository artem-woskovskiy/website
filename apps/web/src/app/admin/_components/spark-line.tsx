'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';

interface SparkLineProps {
  data: number[];
  height?: number;
  className?: string;
}

/**
 * Tiny inline sparkline — pure SVG, no chart library. Used for the Overview
 * cards: weekly users / payments etc. The path is normalized so 0 maps to
 * the bottom of the box and max maps to the top, with a subtle area fill.
 */
export function SparkLine({ data, height = 56, className }: SparkLineProps) {
  const id = useId();
  if (!data.length) {
    return (
      <div
        className={className}
        style={{ height }}
        aria-label="No data"
      />
    );
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const stepX = 100 / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = 100 - ((v - min) / range) * 100;
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <svg
      role="img"
      aria-label={`sparkline of ${data.length} points, max ${max}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={{ height, width: '100%' }}
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#grad-${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <motion.path
        d={linePath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </svg>
  );
}
