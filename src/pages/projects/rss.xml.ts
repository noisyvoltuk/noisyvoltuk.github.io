import type { APIContext } from 'astro';
import { getSorted } from '../../lib/content';
import { feed } from '../../lib/rss';

export async function GET(context: APIContext) {
  return feed(context, 'synths', 'Synth build write-ups.', await getSorted('projects'));
}
