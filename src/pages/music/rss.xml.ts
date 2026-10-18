import type { APIContext } from 'astro';
import { getSorted } from '../../lib/content';
import { feed } from '../../lib/rss';

export async function GET(context: APIContext) {
  return feed(context, 'music', 'Original CSound pieces and things I am listening to.', await getSorted('music'));
}
