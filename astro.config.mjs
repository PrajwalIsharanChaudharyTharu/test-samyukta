// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

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

  trailingSlash: 'never',

  build: {
    format: 'file',
  },

  integrations: [mdx()],
});
