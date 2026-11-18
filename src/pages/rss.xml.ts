/**
 * /rss.xml — blog feed for feed readers, newsletters and aggregators.
 */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '@config/site';
import { routes } from '@config/routes';
import { getPosts } from '@lib/content';

export const GET: APIRoute = async (context) => {
  const posts = await getPosts();

  return rss({
    title: `${site.name} Blog`,
    description: site.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: routes.blogPost(post.id),
      categories: post.data.tags,
      author: post.data.author,
    })),
    customData: `<language>${site.lang}</language>`,
  });
};
