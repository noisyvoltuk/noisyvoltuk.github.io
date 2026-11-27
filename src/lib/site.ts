export const SITE = {
  title: 'NoisyVolt',
  author: 'Andy Morris',
  description: 'Synthesizers, CSound and electronic music by Andy Morris (noisyvoltuk).',
  github: 'https://github.com/noisyvoltuk',
};

/**
 * Where to find me. These are the big buttons on the home page.
 * Fill in a url to show a link; leave it as '' to hide it.
 */
export const PROFILES: { label: string; url: string }[] = [
  { label: 'GitHub', url: 'https://github.com/noisyvoltuk' },
  { label: 'YouTube', url: '' },   // e.g. https://www.youtube.com/@your-channel
  { label: 'Spotify', url: '' },   // e.g. https://open.spotify.com/user/your-id
  { label: 'Pinterest', url: '' }, // e.g. https://www.pinterest.com/your-profile
];

/** Forums and communities. Shown as a smaller list; empty urls are hidden. */
export const FORUMS: { label: string; url: string }[] = [
  // { label: 'CSound forum', url: 'https://forum.csound.com/u/your-name' },
];

/**
 * Top navigation. Kept deliberately short. The other section pages (music, notes, links,
 * riffs, tags, now) still build and their URLs still work; they're just not in the menu.
 * Add any back here if you ever want them.
 */
export const SECTIONS: { href: string; label: string }[] = [];
