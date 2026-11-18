/**
 * ROUTE REGISTRY — every internal URL in the site is built here.
 *
 * Rule: components NEVER write href="/something". They call routes.*.
 * All paths end with "/" to match trailingSlash: 'always'.
 * Files (rss.xml) are the only exception.
 */
export const routes = {
  home: () => '/',
  about: () => '/about',
  contact: () => '/contact',

  services: () => '/services',
  service: (slug: string) => `/services/${slug}`,

  projects: () => '/projects',
  project: (slug: string) => `/projects/${slug}`,

  blog: () => '/blog',
  blogPage: (page: number) => (page <= 1 ? '/blog' : `/blog/page/${page}`),
  blogPost: (slug: string) => `/blog/${slug}`,
  blogTag: (tag: string) => `/blog/tags/${tag}`,

  rss: () => '/rss.xml',
} as const;

export type RouteKey = keyof typeof routes;

// ── Navigation ─────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
}

export interface NavGroup {
  title: string;
  links: NavItem[];
}

/** Header navigation. Array order = display order. */
export const mainNav = [
  { label: 'Services', href: routes.services() },
  { label: 'Projects', href: routes.projects() },
  { label: 'About', href: routes.about() },
  { label: 'Blog', href: routes.blog() },
] as const satisfies readonly NavItem[];

/** Footer navigation, grouped into columns. */
export const footerNav = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: routes.about() },
      { label: 'Contact', href: routes.contact() },
    ],
  },
  {
    title: 'Work',
    links: [
      { label: 'Services', href: routes.services() },
      { label: 'Projects', href: routes.projects() },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: routes.blog() },
      { label: 'RSS', href: routes.rss() },
    ],
  },
] as const satisfies readonly NavGroup[];
