// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// If you move to a custom domain (e.g. noisyvolt.com), change `site` here
// and add public/CNAME containing the domain.
export default defineConfig({
  site: 'https://noisyvoltuk.github.io',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
