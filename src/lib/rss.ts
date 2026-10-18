import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from './site';
import { entryUrl, entrySummary, KIND_LABEL, type AnyEntry } from './content';

export function feed(context: APIContext, title: string, description: string, entries: AnyEntry[]) {
  return rss({
    title: `${SITE.title}: ${title}`,
    description,
    site: context.site!,
    trailingSlash: true,
    items: entries.slice(0, 50).map((e) => ({
      title: e.collection === 'links' ? `${e.data.title}` : e.data.title,
      pubDate: e.data.date,
      description: entrySummary(e),
      // Links point straight at the saved URL; everything else at its page here.
      link: e.collection === 'links' ? e.data.url : new URL(entryUrl(e), context.site).href,
      categories: [KIND_LABEL[e.collection], ...e.data.tags],
    })),
    customData: '<language>en-gb</language>',
  });
}
