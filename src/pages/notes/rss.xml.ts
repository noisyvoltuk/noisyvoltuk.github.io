import type { APIContext } from 'astro';
import { getSorted } from '../../lib/content';
import { feed } from '../../lib/rss';

export async function GET(context: APIContext) {
  return feed(context, 'notes', 'Short build logs and things learned.', await getSorted('notes'));
}
