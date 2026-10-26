#!/usr/bin/env node
// Turns a GitHub issue labelled "link" into src/content/links/<date>-<slug>.md.
// Issue title = URL, issue body = one-line comment, other labels = tags.
// Runs in Actions (reads GITHUB_EVENT_PATH) or locally: node scripts/capture-link.mjs event.json
import { writeFileSync } from 'node:fs';
import { readIssue, output, issueLabels, toTag, findByIssue, cleanBody, slugify, uniqueFile, fetchTitle } from './lib/capture.mjs';

const LINKS_DIR = 'src/content/links';
const CAPTURE_LABEL = 'link';

const issue = readIssue();
const labels = issueLabels(issue);
if (!labels.includes(CAPTURE_LABEL)) {
  output('result', 'skipped');
  process.exit(0);
}

const existing = findByIssue(LINKS_DIR, issue.number);
if (existing) {
  output('result', 'exists');
  output('file', existing);
  process.exit(0);
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

const comment = cleanBody(issue.body).replace(/\s+/g, ' ');
const tags = [...new Set(labels.filter((l) => l !== CAPTURE_LABEL).map(toTag))];

const title = await fetchTitle(url);
const date = (issue.created_at ?? new Date().toISOString()).slice(0, 10);
const file = uniqueFile(LINKS_DIR, date, slugify(title, 'link'));

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
