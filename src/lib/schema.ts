/**
 * JSON-LD (schema.org) builders — pure functions that return plain objects.
 * <JsonLd /> serialises them into <script type="application/ld+json">.
 *
 * Every page:      Organization + WebSite   (emitted by BaseLayout)
 * Inner pages:   + BreadcrumbList           (from the same `breadcrumbs` prop as the visible trail)
 * Service page:  + Service
 * Blog post:     + BlogPosting
 *
 * Validate output: https://validator.schema.org and Google's Rich Results Test.
 */
import { site } from '@config/site';
import type { Crumb } from '@lib/nav';

export type JsonLdObject = Record<string, unknown>;

/** Stable IDs let other schemas point at the organisation instead of repeating it. */
const orgId = (siteUrl: URL) => new URL('/#organization', siteUrl).href;
const websiteId = (siteUrl: URL) => new URL('/#website', siteUrl).href;
const abs = (path: string, siteUrl: URL) => new URL(path, siteUrl).href;

export function organizationSchema(siteUrl: URL): JsonLdObject {
  const { contact } = site;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId(siteUrl),
    name: site.name,
    legalName: site.legalName,
    url: abs('/', siteUrl),
    logo: abs(site.logo, siteUrl),
    foundingDate: String(site.foundingYear),
    email: contact.email,
    telephone: contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address.street,
      addressLocality: contact.address.city,
      addressRegion: contact.address.region,
      postalCode: contact.address.postalCode,
      addressCountry: contact.address.country,
    },
    sameAs: Object.values(site.social).filter(Boolean),
  };
}

export function websiteSchema(siteUrl: URL): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId(siteUrl),
    url: abs('/', siteUrl),
    name: site.name,
    inLanguage: site.lang,
    publisher: { '@id': orgId(siteUrl) },
  };
}

/** `crumbs` must already include Home as the first item. */
export function breadcrumbSchema(crumbs: Crumb[], siteUrl: URL): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.label,
      item: abs(crumb.href, siteUrl),
    })),
  };
}

export function serviceSchema(
  service: { title: string; description: string; url: string },
  siteUrl: URL,
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    url: abs(service.url, siteUrl),
    provider: { '@id': orgId(siteUrl) },
    areaServed: 'Worldwide',
  };
}

export function blogPostingSchema(
  post: {
    title: string;
    description: string;
    url: string;
    image: string;
    datePublished: Date;
    dateModified?: Date | undefined;
    authorName: string;
    tags: string[];
  },
  siteUrl: URL,
): JsonLdObject {
  const url = abs(post.url, siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: abs(post.image, siteUrl),
    url,
    mainEntityOfPage: url,
    datePublished: post.datePublished.toISOString(),
    dateModified: (post.dateModified ?? post.datePublished).toISOString(),
    author: { '@type': 'Person', name: post.authorName },
    publisher: { '@id': orgId(siteUrl) },
    keywords: post.tags.join(', '),
  };
}
