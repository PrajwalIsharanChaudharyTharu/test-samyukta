/**
 * SITE CONFIG — the single source of truth for company identity.
 * Interns: change company details HERE only. Never hardcode them in components.
 */

interface SiteConfig {
  name: string;
  legalName: string;
  tagline: string;
  /** Default meta description (70–160 chars). */
  description: string;
  lang: string;
  /** Open Graph locale, e.g. en_US */
  locale: string;
  /** "%s" is replaced with the page title. */
  titleTemplate: `%s${string}`;
  /** Root-relative path to a 1200×630 image in /public. */
  defaultOgImage: `/${string}`;
  logo: `/${string}`;
  themeColor: string;
  foundingYear: number;
  contact: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      region: string;
      postalCode: string;
      country: string;
    };
  };
  social: Partial<Record<'linkedin' | 'github' | 'x' | 'facebook' | 'instagram', string>>;
  /** X/Twitter handle without "@". Empty string to omit. */
  twitterHandle: string;
}

export const site = {
  name: 'Samyukta Technology',
  legalName: 'Samyukta Technology Pvt. Ltd.',
  tagline: 'Digital Innovation',
  description:
    'Samyukta Technology builds MVPs, custom software, websites and IT solutions for growing businesses in Nepal and beyond.',
  lang: 'en',
  locale: 'en_US',
  titleTemplate: '%s | Samyukta Technology',
  defaultOgImage: '/og-default.png',
  logo: '/logo.svg',
  themeColor: '#079669',
  foundingYear: 2020, // TODO: confirm — not stated on the live site

  contact: {
    email: 'info@samyukta.tech',
    phone: '+977-9851447974',
    address: {
      street: 'Balkumari Mandir',
      city: 'Lalitpur',
      region: 'Bagmati',
      postalCode: '44600',
      country: 'NP',
    },
  },

  social: {
    linkedin: 'https://www.linkedin.com/company/samyukta-technology',
    facebook: 'https://www.facebook.com/profile.php?id=61580596401928',
  },

  twitterHandle: '',
} as const satisfies SiteConfig;

export type Site = typeof site;
