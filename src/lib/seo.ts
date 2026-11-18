/**
 * SEO core: pure functions with no Astro imports, so they are easy to test.
 * SEO.astro calls resolveSeo() and renders the result into <head>.
 */
import { site } from '@config/site';
import { normalizePath } from '@lib/nav';

export interface ArticleMeta {
  publishedTime: Date;
  modifiedTime?: Date | undefined;
  authors?: string[] | undefined;
  tags?: string[] | undefined;
}

/** What a page provides. Only title + description are required. */
export interface PageSeo {
  title: string;
  description: string;
  /** Use the title as-is, without the "| Company" suffix (e.g. home page). */
  absoluteTitle?: boolean | undefined;
  /** Root-relative or absolute. Falls back to site.defaultOgImage. */
  ogImage?: string | undefined;
  ogImageAlt?: string | undefined;
  /** Override the canonical, e.g. for content republished from elsewhere. */
  canonical?: string | undefined;
  noindex?: boolean | undefined;
  /** Present only on blog posts; switches og:type to "article". */
  article?: ArticleMeta | undefined;
}

/** What SEO.astro renders. Every field is final and absolute. */
export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType: 'website' | 'article';
  ogImage: string;
  ogImageAlt: string;
  article: ArticleMeta | undefined;
}

export const SEO_LIMITS = {
  /** Measured on the FINAL title (with suffix): that is what Google displays. */
  title: { min: 30, max: 60 },
  description: { min: 70, max: 160 },
} as const;

export function absoluteUrl(pathOrUrl: string, siteUrl: URL): string {
  return new URL(pathOrUrl, siteUrl).href;
}

export function formatTitle(title: string, absolute = false): string {
  return absolute ? title : site.titleTemplate.replace('%s', title);
}

export function resolveSeo(input: PageSeo, pathname: string, siteUrl: URL): ResolvedSeo {
  return {
    title: formatTitle(input.title, input.absoluteTitle),
    description: input.description,
    // normalizePath strips the ".html" that build.format: 'file' leaks into the pathname.
    canonical: absoluteUrl(input.canonical ?? normalizePath(pathname), siteUrl),
    robots: input.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    ogType: input.article ? 'article' : 'website',
    ogImage: absoluteUrl(input.ogImage ?? site.defaultOgImage, siteUrl),
    ogImageAlt: input.ogImageAlt ?? site.name,
    article: input.article,
  };
}

/** Returns human-readable problems. An empty array means the page is fine. */
export function auditSeo(seo: ResolvedSeo): string[] {
  const issues: string[] = [];
  const t = seo.title.length;
  const d = seo.description.length;
  if (t < SEO_LIMITS.title.min || t > SEO_LIMITS.title.max) {
    issues.push(`title is ${t} chars (aim ${SEO_LIMITS.title.min}–${SEO_LIMITS.title.max}): "${seo.title}"`);
  }
  if (d < SEO_LIMITS.description.min || d > SEO_LIMITS.description.max) {
    issues.push(
      `description is ${d} chars (aim ${SEO_LIMITS.description.min}–${SEO_LIMITS.description.max})`,
    );
  }
  return issues;
}
