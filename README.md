# noisyvoltuk.github.io

Music and synthesizer site: synth builds, build notes, saved links and CSound pieces. Built with [Astro](https://astro.build),
deployed to GitHub Pages by GitHub Actions. No server.

## First-time setup

With [Git](https://git-scm.com/download/win) and [GitHub CLI](https://cli.github.com/) installed and `gh auth login` done:

- Windows: `powershell -ExecutionPolicy Bypass -File scripts\setup-repo.ps1`
- macOS/Linux: `./scripts/setup-repo.sh`

## Run locally

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
```

Needs Node 22.22 or newer.

## Adding content

Everything is Markdown in `src/content/`. Tags are shared across all four collections; every tag
gets a page at `/tags/<tag>/`, and project pages list notes and links that share their tags.

| Collection | Folder | Frontmatter |
|---|---|---|
| projects | `src/content/projects/<slug>.md` | `title`, `summary`, `date`, `hero` (image path), `heroAlt`, `gallery` (list of `src`/`alt`), `audio` (`src`, `title`), `repo`, `tags`, `status` (idea, active, paused, done, archived), `featured` |
| notes | `src/content/notes/<date>-<slug>.md` | `title`, `date`, `tags`, then the Markdown body |
| links | `src/content/links/<date>-<slug>.md` | `url`, `title`, `comment`, `date`, `tags`. YouTube URLs embed automatically |
| music | `src/content/music/<date>-<slug>.md` | `title`, `date`, `kind` (`original` or `listening`), `artist`, `audio`, `source` (.csd URL), `url`, `tags` |

Project images go in `src/assets/projects/` (Astro resizes them). Audio files go in `public/audio/`
and are referenced as `/audio/<file>`. Featured projects (`featured: true`) appear on the home page.

The /now page is `src/pages/now.md`.

## Editing in the browser

Go to https://noisyvoltuk.github.io/admin/ and sign in with a GitHub personal access token.
It's a [Sveltia CMS](https://sveltiacms.app/) editor with forms for synths, notes, links and music.
Every save is a commit to `main`, which redeploys the site in a minute or two. Images you upload
for synths go to `src/assets/projects/`, and audio goes to `public/audio/`.

To make the token: GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
Choose **Only select repositories** → `noisyvoltuk.github.io`, and under Repository permissions set
**Contents** to *Read and write*. The editor remembers it in that browser.

The editor is configured in `public/admin/config.yml`. Keep its fields in step with `src/content.config.ts`.

## Quick capture

Open an issue with the **Save a link** template (or any issue labelled `link`):

- **Title:** the URL
- **Body:** a one-line comment
- **Other labels:** tags

The *Capture link from issue* workflow fetches the page title (YouTube titles come from oEmbed),
writes `src/content/links/<date>-<slug>.md`, commits it, closes the issue, and starts a deploy.
Only issues opened by the repo owner are captured.

This works from the GitHub mobile app too.

## Feeds

`/rss.xml` (everything), plus `/projects/rss.xml`, `/notes/rss.xml`, `/links/rss.xml` and `/music/rss.xml`.

## Custom domain

To serve from noisyvolt.com: set `site` in `astro.config.mjs`, add `public/CNAME` containing the
domain, and set the domain under Settings → Pages.
