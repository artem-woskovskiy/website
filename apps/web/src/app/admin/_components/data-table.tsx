import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)]',
        className,
      )}
    >
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[var(--color-bg-soft)] text-[11px] uppercase tracking-[0.08em] text-[var(--color-fg-dim)]">
      {children}
    </thead>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn('px-4 py-2.5 text-left font-medium', className)}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[var(--color-bg-grid)]">{children}</tbody>;
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn('transition-colors hover:bg-[var(--color-fg)]/[0.02]', className)}>
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>;
}

export function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
  children: ReactNode;
}) {
  const toneStyles: Record<string, string> = {
    success:
      'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/30',
    warning: 'bg-amber-500/10 text-amber-700 ring-amber-500/30',
    danger:
      'bg-[var(--color-danger)]/10 text-[var(--color-danger)] ring-[var(--color-danger)]/30',
    neutral:
      'bg-[var(--color-fg)]/[0.04] text-[var(--color-fg-mute)] ring-[var(--color-bg-grid)]',
    accent:
      'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)] ring-[var(--color-accent)]/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        toneStyles[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-bg-grid)] bg-[var(--color-bg-elev)] px-6 py-10 text-center text-sm text-[var(--color-fg-mute)]">
      {children}
    </div>
  );
}
