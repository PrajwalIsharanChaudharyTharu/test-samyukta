import { routes } from '@config/routes';

/**
 * Normalise a pathname to our URL shape: no ".html", no "/index", no trailing slash.
 * Needed because with build.format: 'file', Astro.url.pathname is "/about.html" at build time
 * but "/about" in dev. Anything that builds URLs from the current path MUST use this.
 */
export function normalizePath(pathname: string): string {
  const clean = pathname
    .replace(/\.html$/, '')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

/**
 * True when `href` is the current page or a parent section of it.
 * "/services" is active on "/services/web-development" — but not on "/services-pricing".
 */
export function isActivePath(currentPath: string, href: string): boolean {
  const path = normalizePath(currentPath);
  if (href === routes.home()) return path === '/';
  return path === href || path.startsWith(`${href}/`);
}
