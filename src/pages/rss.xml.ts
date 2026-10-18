import type { APIContext } from 'astro';
import { getAll } from '../lib/content';
import { feed } from '../lib/rss';

export async function GET(context: APIContext) {
  return feed(context, 'everything', 'Projects, notes, links and music, all in one feed.', await getAll());
}
