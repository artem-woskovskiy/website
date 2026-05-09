/**
 * Inline blocking script that runs BEFORE React hydrates and BEFORE any CSS
 * paints. It reads the theme out of localStorage / system preference and
 * sets `data-theme` on <html> so the right palette applies on first paint —
 * no flash, no client-only re-render.
 *
 * Render this at the very top of <body> in the root layout (or in <head>).
 */
const SCRIPT = `(() => {
  try {
    var stored = localStorage.getItem('sep-theme');
    var system = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var t = stored === 'dark' || stored === 'light' ? stored : system;
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();`;

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted static string, runs blocking before hydration
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} suppressHydrationWarning />;
}
