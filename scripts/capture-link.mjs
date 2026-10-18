#!/usr/bin/env node
// Turns a GitHub issue labelled "link" into src/content/links/<date>-<slug>.md.
// Issue title = URL, issue body = one-line comment, other labels = tags.
// Runs in Actions (reads GITHUB_EVENT_PATH) or locally: node scripts/capture-link.mjs event.json
import { readFileSync, writeFileSync, readdirSync, appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const LINKS_DIR = 'src/content/links';
const CAPTURE_LABEL = 'link';

const eventPath = process.argv[2] ?? process.env.GITHUB_EVENT_PATH;
if (!eventPath) throw new Error('No event file: pass a path or set GITHUB_EVENT_PATH');
const { issue } = JSON.parse(readFileSync(eventPath, 'utf8'));

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<__EOF__\n${value}\n__EOF__\n`);
  console.log(`${key}=${value}`);
}

const labels = (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name));
if (!labels.includes(CAPTURE_LABEL)) {
  output('result', 'skipped');
  process.exit(0);
}

// Idempotent: the same issue can fire both "opened" and "labeled".
mkdirSync(LINKS_DIR, { recursive: true });
for (const f of readdirSync(LINKS_DIR)) {
  if (new RegExp(`^issue: ${issue.number}$`, 'm').test(readFileSync(join(LINKS_DIR, f), 'utf8'))) {
    output('result', 'exists');
    output('file', join(LINKS_DIR, f));
    process.exit(0);
  }
}

const rawUrl = (issue.title ?? '').trim().match(/https?:\/\/\S+/)?.[0];
let url;
try {
  url = new URL(rawUrl).href;
} catch {
  output('result', 'invalid');
  output('error', `The issue title must be a URL (got "${issue.title}").`);
  process.exit(0);
}

const comment = (issue.body ?? '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const tags = [...new Set(labels.filter((l) => l !== CAPTURE_LABEL).map((l) => l.trim().toLowerCase().replace(/\s+/g, '-')))];

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

async function fetchTitle(u) {
  const signal = AbortSignal.timeout(10_000);
  const headers = { 'user-agent': 'Mozilla/5.0 (link-capture; +https://github.com/noisyvoltuk)' };
  const host = new URL(u).hostname.replace(/^www\.|^m\./, '');
  try {
    if (['youtube.com', 'youtu.be', 'music.youtube.com'].includes(host)) {
      const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`, { signal, headers });
      if (r.ok) {
        const j = await r.json();
        if (j.title) return j.author_name ? `${j.title} (${j.author_name})` : j.title;
      }
    }
    const r = await fetch(u, { signal, headers, redirect: 'follow' });
    if (r.ok && (r.headers.get('content-type') ?? '').includes('html')) {
      const html = (await r.text()).slice(0, 500_000);
      const og = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      const t = og?.[1] ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      if (t && decode(t)) return decode(t).slice(0, 200);
    }
  } catch (e) {
    console.warn(`Could not fetch title: ${e.message}`);
  }
  const p = new URL(u);
  if (['youtube.com', 'youtu.be', 'music.youtube.com'].includes(host)) return 'YouTube video';
  return `${p.hostname.replace(/^www\./, '')}${p.pathname === '/' ? '' : p.pathname}`;
}

const title = await fetchTitle(url);
const date = (issue.created_at ?? new Date().toISOString()).slice(0, 10);
const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'link';
let file = join(LINKS_DIR, `${date}-${slug}.md`);
for (let i = 2; readdirSync(LINKS_DIR).includes(file.split('/').pop()); i++) file = join(LINKS_DIR, `${date}-${slug}-${i}.md`);

// JSON strings are valid YAML double-quoted scalars, so this is injection-safe.
const md = `---
url: ${JSON.stringify(url)}
title: ${JSON.stringify(title)}
comment: ${JSON.stringify(comment)}
date: ${date}
tags: ${JSON.stringify(tags)}
issue: ${issue.number}
---
`;
writeFileSync(file, md);
output('result', 'created');
output('file', file);
output('title', title);
