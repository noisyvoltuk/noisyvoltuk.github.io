import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tags = z.array(z.string()).default([]).transform((t) => t.map((s) => s.trim().toLowerCase()).filter(Boolean));

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      hero: image(),
      heroAlt: z.string().default(''),
      gallery: z.array(z.object({ src: image(), alt: z.string().default('') })).default([]),
      audio: z
        .object({ src: z.string(), title: z.string().optional() })
        .optional(),
      repo: z.url().optional(),
      tags,
      status: z.enum(['idea', 'active', 'paused', 'done', 'archived']).default('active'),
      featured: z.boolean().default(false),
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags,
  }),
});

const links = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/links' }),
  schema: z.object({
    url: z.url(),
    title: z.string(),
    comment: z.string().default(''),
    date: z.coerce.date(),
    tags,
    issue: z.number().optional(),
  }),
});

const music = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/music' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // "original" = my own CSound pieces, "listening" = things I'm listening to
    kind: z.enum(['original', 'listening']),
    artist: z.string().optional(),
    audio: z.string().optional(),
    source: z.url().optional(),
    url: z.url().optional(),
    tags,
  }),
});

export const collections = { projects, notes, links, music };
