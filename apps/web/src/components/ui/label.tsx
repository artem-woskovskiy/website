import { cn } from '@/lib/cn';
import type { LabelHTMLAttributes } from 'react';

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-xs uppercase tracking-[0.08em] text-[var(--color-fg-mute)]', className)}
      {...rest}
    />
  );
}
