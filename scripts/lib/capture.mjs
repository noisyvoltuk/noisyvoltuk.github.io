// Shared helpers for the issue quick-capture scripts (capture-link.mjs, capture-riff.mjs).
import { readFileSync, readdirSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/** Reads the issue from the Actions event file, or from a path given on the command line. */
export function readIssue() {
  const eventPath = process.argv[2] ?? process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('No event file: pass a path or set GITHUB_EVENT_PATH');
  return JSON.parse(readFileSync(eventPath, 'utf8')).issue;
}

export function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<__EOF__\n${value}\n__EOF__\n`);
  console.log(`${key}=${value}`);
}

export const issueLabels = (issue) => (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));

export const toTag = (l) => l.trim().toLowerCase().replace(/\s+/g, '-');

/** Idempotent: the same issue can fire both "opened" and "labeled". Returns the file already made from this issue, if any. */
export function findByIssue(dir, number) {
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) {
    if (new RegExp(`^issue: ${number}$`, 'm').test(readFileSync(join(dir, f), 'utf8'))) return join(dir, f);
  }
  return null;
}

/** Issue body with HTML comments (template hints) removed. */
export const cleanBody = (body) => (body ?? '').replace(/<!--[\s\S]*?-->/g, '').trim();

export const slugify = (s, fallback) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback;

/** <dir>/<date>-<slug>.md, with -2, -3… added if that name is taken. */
export function uniqueFile(dir, date, slug) {
  let file = join(dir, `${date}-${slug}.md`);
  for (let i = 2; readdirSync(dir).includes(file.split('/').pop()); i++) file = join(dir, `${date}-${slug}-${i}.md`);
  return file;
}

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const isYouTube = (host) => ['youtube.com', 'youtu.be', 'music.youtube.com'].includes(host);

/** Page title for a URL. YouTube gives { title, author } from oEmbed; other pages give og:title or <title>. */
export async function fetchPageInfo(u) {
  const signal = AbortSignal.timeout(10_000);
  const headers = { 'user-agent': 'Mozilla/5.0 (link-capture; +https://github.com/noisyvoltuk)' };
  const host = new URL(u).hostname.replace(/^www\.|^m\./, '');
  try {
    if (isYouTube(host)) {
      const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`, { signal, headers });
      if (r.ok) {
        const j = await r.json();
        if (j.title) return { title: j.title, author: j.author_name };
      }
    }
    const r = await fetch(u, { signal, headers, redirect: 'follow' });
    if (r.ok && (r.headers.get('content-type') ?? '').includes('html')) {
      const html = (await r.text()).slice(0, 500_000);
      const og = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      const t = og?.[1] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      if (t && decode(t)) return { title: decode(t).slice(0, 200) };
    }
  } catch (e) {
    console.warn(`Could not fetch title: ${e.message}`);
  }
  return null;
}

/** Display title for a link: "Title (Channel)" for YouTube, else the page title, else host and path. */
export async function fetchTitle(u) {
  const info = await fetchPageInfo(u);
  if (info) return info.author ? `${info.title} (${info.author})` : info.title;
  return fallbackTitle(u);
}

/** Title for a URL whose page couldn't be fetched. */
export function fallbackTitle(u) {
  const p = new URL(u);
  if (isYouTube(p.hostname.replace(/^www\.|^m\./, ''))) return 'YouTube video';
  return `${p.hostname.replace(/^www\./, '')}${p.pathname === '/' ? '' : p.pathname}`;
}
