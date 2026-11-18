/**
 * CONTENT MODEL — the typed contract for all content.
 *
 * Today: Markdown files in src/content/* via glob().
 * Later (headless CMS): replace a collection's `loader`. Keep its `schema`.
 * Nothing that reads the data has to change.
 *
 * Files starting with "_" are ignored, which is how the _template.md files work.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const contentGlob = (dir: string) => glob({ pattern: '**/[^_]*.{md,mdx}', base: `./src/content/${dir}` });

/** Optional per-entry SEO overrides, shared by every collection that becomes a page. */
const seo = z
  .object({
    title: z.string().max(60).optional(),
    description: z.string().min(70).max(160).optional(),
    noindex: z.boolean().default(false),
  })
  .optional();

const services = defineCollection({
  loader: contentGlob('services'),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(200),
    order: z.number().int().default(100),
    features: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    seo,
  }),
});

const blog = defineCollection({
  loader: contentGlob('blog'),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70),
      description: z.string().min(70).max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().min(2),
      cover: image(),
      coverAlt: z.string().min(5),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
      seo,
    }),
});

export const collections = { services, blog };
