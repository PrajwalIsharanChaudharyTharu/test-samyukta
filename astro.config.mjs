// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';
import seoGuard from './integrations/seo-guard';

// .env files are NOT loaded into process.env when this config file runs,
// so we load them explicitly. CI/host env vars still win over .env.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const SITE_URL = process.env.SITE_URL ?? env.SITE_URL;

if (!SITE_URL) {
  console.warn(
    '\n⚠️  SITE_URL is not set — using https://samyuktatechnology.com/. Canonicals will be WRONG.\n',
  );
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL ?? 'https://samyuktatechnology.com/',
  output: 'static',

  vite: {
    plugins: [tailwindcss()],
  },

  trailingSlash: 'always',

  build: {
    format: 'directory',
  },

  image: {
    // Every <Image /> gets srcset + sizes automatically and never stretches past its width.
    layout: 'constrained',
    responsiveStyles: true,
  },

  // Load the next page in the background on hover/focus, so navigation feels instant.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !/\/404$/.test(page) && !page.includes('/blog/page/'),
    }),
    seoGuard(),
  ],
});
