import { cn } from '@/lib/cn';
import { type InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-md border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-3 text-sm text-[var(--color-fg)]',
          'placeholder:text-[var(--color-fg-dim)] outline-none transition-colors',
          'focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...rest}
      />
    );
  },
);
