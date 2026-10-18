import type { APIContext } from 'astro';
import { getSorted } from '../../lib/content';
import { feed } from '../../lib/rss';

export async function GET(context: APIContext) {
  return feed(context, 'links', 'Saved links and videos.', await getSorted('links'));
}
