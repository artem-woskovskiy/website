import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-between p-8 md:p-12">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="grid size-7 place-items-center rounded-md bg-black">
            <span className="font-serif text-lg italic leading-none text-white">g</span>
          </span>
          <span className="font-medium tracking-tight">Sepaito</span>
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
        <div className="text-xs text-[var(--color-fg-dim)]">
          © {new Date().getFullYear()} Sepaito.ai
        </div>
      </div>
      <div className="relative hidden border-l border-[var(--color-bg-grid)] md:block">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-20 blur-3xl"
          style={{
            backgroundImage:
              'radial-gradient(40% 50% at 30% 30%, var(--mesh-1), transparent 60%),' +
              'radial-gradient(40% 60% at 70% 70%, var(--mesh-2), transparent 60%)',
          }}
        />
        <div className="flex h-full flex-col justify-center px-12">
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-fg-dim)]">
            Sepaito
          </span>
          <h2 className="mt-2 max-w-sm text-4xl font-semibold tracking-tight">
            The IDE that runs every agent at once.
          </h2>
          <p className="mt-4 max-w-md text-sm text-[var(--color-fg-mute)]">
            Bring your own keys. 15 themes. 8+ models. No vendor lock-in.
          </p>
        </div>
      </div>
    </div>
  );
}
