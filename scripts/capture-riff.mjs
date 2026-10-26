#!/usr/bin/env node
// Turns a GitHub issue labelled "recreate" into src/content/riffs/<date>-<slug>.md.
// Issue title = "Artist - Tune" (or just a YouTube/Bandcamp URL), body = notes, and any URL in
// the body becomes the reference link. A tune/riff/beat/sound label sets the type; other labels become tags.
// Runs in Actions (reads GITHUB_EVENT_PATH) or locally: node scripts/capture-riff.mjs event.json
import { writeFileSync } from 'node:fs';
import { readIssue, output, issueLabels, toTag, findByIssue, cleanBody, slugify, uniqueFile, fetchPageInfo, fallbackTitle } from './lib/capture.mjs';

const RIFFS_DIR = 'src/content/riffs';
const CAPTURE_LABEL = 'recreate';
const TYPES = ['tune', 'riff', 'beat', 'sound'];

const issue = readIssue();
const labels = issueLabels(issue);
if (!labels.includes(CAPTURE_LABEL)) {
  output('result', 'skipped');
  process.exit(0);
}

const existing = findByIssue(RIFFS_DIR, issue.number);
if (existing) {
  output('result', 'exists');
  output('file', existing);
  process.exit(0);
}

const URL_RE = /https?:\/\/[^\s<>)]+/;
const asUrl = (s) => {
  try {
    return s ? new URL(s).href : undefined;
  } catch {
    return undefined;
  }
};

// "Artist - Tune" (also en and em dashes) → { artist, title }.
const splitArtist = (s) => {
  const m = s.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  return m ? { artist: m[1].trim(), title: m[2].trim() } : { title: s.trim() };
};

let body = cleanBody(issue.body);
let rawTitle = (issue.title ?? '').trim();
let url;
let artist;
let title;

const titleUrl = asUrl(rawTitle.match(URL_RE)?.[0]);
if (titleUrl && rawTitle.replace(URL_RE, '').trim() === '') {
  // Title is just a link: name it from the page.
  url = titleUrl;
  const info = await fetchPageInfo(url);
  const pageTitle = info?.title?.replace(/\s*[(\[](official|lyrics?|hd|hq|\d{4} remaster)[^)\]]*[)\]]/gi, '').trim();
  ({ artist, title } = splitArtist(pageTitle || fallbackTitle(url)));
  artist ??= info?.author?.replace(/VEVO$|\s+-\s+Topic$/, '').trim() || undefined;
} else {
  ({ artist, title } = splitArtist(rawTitle));
  url = asUrl(body.match(URL_RE)?.[0]);
  if (url) body = body.replace(URL_RE, '').trim();
}

if (!title) {
  output('result', 'invalid');
  output('error', 'The issue title must name the tune (e.g. "Gary Numan - Cars (synth riff)") or be a link to it.');
  process.exit(0);
}

const others = labels.filter((l) => l !== CAPTURE_LABEL).map(toTag);
const type = others.find((l) => TYPES.includes(l)) ?? 'riff';
const tags = [...new Set(others.filter((l) => !TYPES.includes(l)))];
const date = (issue.created_at ?? new Date().toISOString()).slice(0, 10);
const file = uniqueFile(RIFFS_DIR, date, slugify(title, 'riff'));

// JSON strings are valid YAML double-quoted scalars, so this is injection-safe.
const md = `---
title: ${JSON.stringify(title)}
${artist ? `artist: ${JSON.stringify(artist)}\n` : ''}${url ? `url: ${JSON.stringify(url)}\n` : ''}type: ${type}
status: wanted
date: ${date}
tags: ${JSON.stringify(tags)}
issue: ${issue.number}
---
${body ? `\n${body}\n` : ''}`;
writeFileSync(file, md);
output('result', 'created');
output('file', file);
output('title', artist ? `${artist} - ${title}` : title);
