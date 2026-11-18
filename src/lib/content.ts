/**
 * DATA ACCESS LAYER — the ONLY place that reads content.
 *
 * Pages call getServices(), getLatestPosts()... never getCollection() directly.
 * Rules handled here, once:
 *  - drafts: visible in `astro dev`, hidden in production builds
 *  - sort order for every collection
 *  - related posts, tag index, pagination
 *
 * Moving to a headless CMS = change the collection loaders and, if needed, this file.
 * Adding projects or team later: enable the collection in src/content.config.ts, then add getters here.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { slugify } from '@lib/utils';

export type Service = CollectionEntry<'services'>;
export type Post = CollectionEntry<'blog'>;

export const POSTS_PER_PAGE = 6;

/** Drafts are visible while writing (dev) and never shipped (build). */
const isPublished = ({ data }: { data: { draft?: boolean } }) => import.meta.env.DEV || !data.draft;

// ── Services ──────────────────────────────────────────────
export async function getServices(): Promise<Service[]> {
  const items = await getCollection('services', isPublished);
  return items.sort((a, b) => a.data.order - b.data.order);
}

// ── Blog ──────────────────────────────────────────────────
export async function getPosts(): Promise<Post[]> {
  const items = await getCollection('blog', isPublished);
  return items.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function getLatestPosts(limit = 3): Promise<Post[]> {
  return (await getPosts()).slice(0, limit);
}

/** Up to `limit` other posts, ranked by number of shared tags, then by recency. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const shared = (p: Post) => p.data.tags.filter((t) => post.data.tags.includes(t)).length;
  return (await getPosts())
    .filter((p) => p.id !== post.id)
    .sort((a, b) => shared(b) - shared(a))
    .slice(0, limit);
}

export interface TagGroup {
  slug: string;
  label: string;
  posts: Post[];
}

/** Every tag with its posts. "Web Perf" and "web perf" merge into one slug: web-perf. */
export async function getTags(): Promise<TagGroup[]> {
  const index = new Map<string, TagGroup>();
  for (const post of await getPosts()) {
    for (const label of post.data.tags) {
      const slug = slugify(label);
      const group = index.get(slug) ?? { slug, label, posts: [] };
      group.posts.push(post);
      index.set(slug, group);
    }
  }
  return [...index.values()].sort((a, b) => b.posts.length - a.posts.length);
}

/** Splits posts into pages. Page 1 is index 0. */
export async function getPostPages(): Promise<Post[][]> {
  const posts = await getPosts();
  const pages: Post[][] = [];
  for (let i = 0; i < posts.length; i += POSTS_PER_PAGE) pages.push(posts.slice(i, i + POSTS_PER_PAGE));
  return pages.length ? pages : [[]];
}
