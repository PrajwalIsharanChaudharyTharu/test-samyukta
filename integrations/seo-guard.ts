/**
 * seo-guard — runs after every `astro build` and checks the REAL HTML output.
 *
 * Fails the build when:
 *   1. an indexable page is missing <title>, meta description, canonical or <h1>
 *   2. a page has more than one <h1>
 *   3. two indexable pages share a <title> or a description
 *   4. a canonical does not match the URL the page is actually served at
 *   5. an internal link points to a page that does not exist
 *
 * Also removes `noindex` pages from the sitemap, so Google never gets mixed signals.
 * Register AFTER @astrojs/sitemap in astro.config.mjs (it edits the sitemap files).
 */
import type { AstroIntegration } from 'astro';
import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function listHtml(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listHtml(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** dist/about/index.html -> "/about/" (matches trailingSlash: 'always' + format: 'directory'). */
function urlPathFor(file: string, root: string): string {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`; // 404.html and other top-level files
}

const pick = (html: string, re: RegExp) => re.exec(html)?.[1]?.trim();

export default function seoGuard(): AstroIntegration {
  return {
    name: 'seo-guard',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = await listHtml(root);
        const errors: string[] = [];
        const noindex = new Set<string>();
        const titles = new Map<string, string>();
        const descriptions = new Map<string, string>();
        const pages = new Set(files.map((f) => urlPathFor(f, root)));

        for (const file of files) {
          const url = urlPathFor(file, root);
          if (url === '/404.html') continue;
          const html = await readFile(file, 'utf8');

          // ── 5. broken internal links (checked on every page, indexable or not)
          for (const [, href] of html.matchAll(/<a\s[^>]*href="(\/[^"#?]*)/g)) {
            if (!href || href.startsWith('/_astro/')) continue;
            const isFile = /\.[a-z0-9]+$/i.test(href);
            const exists = isFile ? existsSync(path.join(root, href)) : pages.has(href);
            if (!exists) errors.push(`${url}: broken link → ${href}`);
          }

          const canonical = pick(html, /<link rel="canonical" href="([^"]+)"/);
          if (/<meta name="robots" content="noindex/.test(html)) {
            if (canonical) noindex.add(canonical);
            continue; // noindex pages skip the content rules below
          }

          // ── 6. generic link text (Lighthouse "link-text" audit)
          const GENERIC = /^(click here|here|read more|learn more|more|more info|see more|go|start|this)$/i;
          for (const [, inner] of html.matchAll(/<a\s[^>]*>([\s\S]*?)<\/a>/g)) {
            const text = (inner ?? '')
              .replace(/<[^>]+>/g, '')
              .replace(/[→←»›]/g, '')
              .trim();
            if (GENERIC.test(text)) errors.push(`${url}: non-descriptive link text "${text}"`);
          }

          // ── 1–2. required tags
          const title = pick(html, /<title>([^<]*)<\/title>/);
          const description = pick(html, /<meta name="description" content="([^"]*)"/);
          const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
          if (!title) errors.push(`${url}: missing <title>`);
          if (!description) errors.push(`${url}: missing meta description`);
          if (!canonical) errors.push(`${url}: missing canonical`);
          if (h1Count !== 1) errors.push(`${url}: has ${h1Count} <h1> (must be exactly 1)`);

          // ── 4. canonical must equal the served URL
          if (canonical && new URL(canonical).pathname !== url) {
            errors.push(`${url}: canonical points to ${new URL(canonical).pathname}`);
          }

          // ── 3. duplicates
          if (title) {
            const other = titles.get(title);
            if (other) errors.push(`duplicate <title> on ${other} and ${url}: "${title}"`);
            else titles.set(title, url);
          }
          if (description) {
            const other = descriptions.get(description);
            if (other) errors.push(`duplicate description on ${other} and ${url}`);
            else descriptions.set(description, url);
          }
        }

        // ── remove noindex pages from the sitemap
        for (const name of await readdir(root)) {
          if (!/^sitemap-\d+\.xml$/.test(name)) continue;
          const file = path.join(root, name);
          const xml = await readFile(file, 'utf8');
          const cleaned = xml.replace(/<url><loc>([^<]+)<\/loc>.*?<\/url>/g, (block, loc: string) =>
            noindex.has(loc) ? '' : block,
          );
          await writeFile(file, cleaned);
        }
        if (noindex.size) logger.info(`excluded ${noindex.size} noindex page(s) from the sitemap`);

        if (errors.length) {
          for (const e of errors) logger.error(e);
          throw new Error(`seo-guard: ${errors.length} problem(s). Fix them before deploying.`);
        }
        logger.info(`✓ ${titles.size} indexable pages passed SEO checks, 0 broken links`);
      },
    },
  };
}
