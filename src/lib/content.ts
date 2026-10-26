import { getCollection, type CollectionEntry } from 'astro:content';

export type Kind = 'projects' | 'notes' | 'links' | 'music' | 'riffs';
export type AnyEntry = CollectionEntry<Kind>;

export const KIND_LABEL: Record<Kind, string> = {
  projects: 'Synth',
  notes: 'Note',
  links: 'Link',
  music: 'Music',
  riffs: 'Riff',
};

export const ALL_KINDS: Kind[] = ['projects', 'notes', 'links', 'music', 'riffs'];
/** Kinds in the home stream and the main feed. Riffs are a to-do list, so they only show on /riffs/ and tag pages. */
export const STREAM_KINDS: Kind[] = ['projects', 'notes', 'links', 'music'];

export const RIFF_STATUS = {
  learning: 'Working on',
  wanted: 'Wanted',
  recreated: 'Recreated',
} as const;

const byDateDesc = (a: { data: { date: Date } }, b: { data: { date: Date } }) =>
  b.data.date.valueOf() - a.data.date.valueOf();

export async function getSorted<K extends Kind>(kind: K): Promise<CollectionEntry<K>[]> {
  const entries = (await getCollection(kind)) as CollectionEntry<K>[];
  return entries.sort(byDateDesc);
}

export async function getAll(kinds: Kind[] = STREAM_KINDS): Promise<AnyEntry[]> {
  const all = await Promise.all(kinds.map(getSorted));
  return (all.flat() as AnyEntry[]).sort(byDateDesc);
}

/** Internal URL for an entry. Links and riffs point at their anchor on their list page. */
export function entryUrl(entry: AnyEntry): string {
  if (entry.collection === 'links') return `/links/#${entry.id}`;
  if (entry.collection === 'riffs') return `/riffs/#${entry.id}`;
  return `/${entry.collection}/${entry.id}/`;
}

export function entrySummary(entry: AnyEntry): string {
  switch (entry.collection) {
    case 'projects':
      return entry.data.summary;
    case 'links':
      return entry.data.comment;
    case 'music':
      return entry.data.kind === 'listening' && entry.data.artist ? `Listening: ${entry.data.artist}` : 'Original CSound piece';
    case 'riffs':
      return [entry.data.artist, `${RIFF_STATUS[entry.data.status]} ${entry.data.type}`].filter(Boolean).join(' · ');
    default:
      const first = (entry.body ?? '').replace(/[#>*_`\[\]]/g, '').trim().split('\n\n')[0]?.replace(/\s+/g, ' ') ?? '';
      return first.length > 160 ? `${first.slice(0, 160).replace(/\s+\S*$/, '')}…` : first;
  }
}

export const slugTag = (t: string) => t.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function getTagMap(): Promise<Map<string, AnyEntry[]>> {
  const map = new Map<string, AnyEntry[]>();
  for (const e of await getAll(ALL_KINDS)) {
    for (const t of e.data.tags) {
      const key = slugTag(t);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
  }
  return map;
}

/** Entries of the given kinds that share at least one tag, most overlap first. */
export async function related(entry: AnyEntry, kinds: Kind[]): Promise<AnyEntry[]> {
  const mine = new Set(entry.data.tags.map(slugTag));
  if (!mine.size) return [];
  const all = await getAll(ALL_KINDS);
  return all
    .filter((e) => kinds.includes(e.collection) && !(e.collection === entry.collection && e.id === entry.id))
    .map((e) => ({ e, score: e.data.tags.filter((t) => mine.has(slugTag(t))).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.e.data.date.valueOf() - a.e.data.date.valueOf())
    .map((x) => x.e);
}

export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com' || host === 'music.youtube.com' || host === 'youtube-nocookie.com') {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/);
      if (m) return m[1];
    }
  } catch {}
  return null;
}

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
