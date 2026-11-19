# Samyukta Technology — Corporate Website

Static, SEO-first corporate site built with **Astro 7**, **Tailwind CSS v4** and **TypeScript (strictest)**.

---

## Getting started

```bash
nvm use                 # Node 22 (from .nvmrc)
npm install             # also installs the git hooks
cp .env.example .env
npm run dev             # http://localhost:4321
```

| Command               | What it does                                                           |
| --------------------- | ---------------------------------------------------------------------- |
| `npm run dev`         | Dev server. Draft content is visible here.                             |
| `npm run check`       | Architecture boundaries + type check                                   |
| `npm run build`       | check → build → **seo-guard** (fails on SEO problems and broken links) |
| `npm run preview`     | Serve the production build locally                                     |
| `npm run lighthouse`  | Lighthouse budgets on the built site (run after a production build)    |
| `npm run format`      | Format everything with Prettier                                        |
| `npm run lint:format` | Check formatting without changing files (what CI runs)                 |

---

## Project structure

```
src/
  config/        site.ts · routes.ts · pages.ts      ← single sources of truth
  content/       services/ · blog/                   ← Markdown content (_template.md = copy me)
  content.config.ts                                  ← content schemas (Zod)
  lib/           content.ts · seo.ts · schema.ts · nav.ts · utils.ts
  layouts/       BaseLayout.astro · PageLayout.astro
  components/
    seo/         SEO.astro · JsonLd.astro            ← used by layouts only
    layout/      Header · Footer · Container · Breadcrumbs
    ui/          Button · Badge · SectionHeading     ← primitives
    sections/    ServiceCard · PostCard · CtaBanner  ← compositions
  pages/         file = URL
  styles/        global.css                          ← design tokens
integrations/    seo-guard.ts                        ← build-time SEO checks
scripts/         check-boundaries.mjs                ← architecture checks
```

Imports flow **one way only**: `config → lib → components/ui → components/sections → layouts → pages`.

| Path                        | Owns                                     | Who edits              |
| --------------------------- | ---------------------------------------- | ---------------------- |
| `src/config/site.ts`        | Company name, contact, socials, OG image | Lead                   |
| `src/config/routes.ts`      | **Every URL** + header/footer navigation | Lead                   |
| `src/config/pages.ts`       | SEO for static pages                     | Anyone                 |
| `src/content.config.ts`     | Content schemas                          | Lead (review required) |
| `src/content/*/`            | Markdown content                         | Anyone                 |
| `src/lib/*`                 | Data access, SEO and schema logic        | Lead (review required) |
| `src/layouts/`              | Document shell and inner-page layout     | Lead (review required) |
| `src/components/`, `pages/` | UI and pages                             | Anyone                 |
| `src/styles/global.css`     | Design tokens                            | Lead / designer        |
| `integrations/`, `scripts/` | Build guardrails                         | Lead                   |

---

## Rules

Most of these are **enforced by the build or CI** — breaking them fails `npm run build`.

1. **No hardcoded URLs.** Use `routes.*` from `@config/routes`. Every URL ends with `/` (`/about/`, `/blog/my-post/`).
2. **No hardcoded company info.** Use `site.*` from `@config/site`.
3. **Read content only through `@lib/content`.** Never call `getCollection()` / `getEntry()` in a page or component.
4. **Pages never write `<title>` or `<meta>`.** Pass a `seo` object to the layout.
5. **One `<h1>` per page.** `PageLayout` renders it from `heading`. Sections start at `<h2>` (use `SectionHeading`).
6. **Images:** use `<Image />` from `astro:assets`, files in `src/assets/images/`. Only the first image visible on load gets `priority` / `loading="eager"`. Keep source images ≈2400px wide and under ~500 KB.
7. **Colours:** tokens only (no `bg-[#...]`). Tailwind's default palette is disabled on purpose. **Green text and buttons use `brand-700` or darker** — `brand-600` fails contrast on white.
8. **Comments in `.astro` files:** use `{/* ... */}`. Never `<!-- -->` — HTML comments are shipped to every visitor.
9. **Astro 7 whitespace:** put mixed text and `{expressions}` in one template string: ``{`© ${year} ${site.name}`}``.
10. **Never use `Astro.url.pathname` directly** to build or compare URLs. Pass it through `normalizePath()` from `@lib/nav`.
11. **Links need descriptive text.** No "Learn more", "Read more", "Click here" on their own.

---

## Common tasks

### Add a blog post or service

1. Copy `_template.md` in `src/content/blog/` (or `services/`).
2. Rename it — the file name becomes the URL: `my-new-post.md` → `/blog/my-new-post/`.
3. Fill in the frontmatter, then set `draft: false`.

Drafts are visible in `npm run dev` and never published.

### Add a static page (e.g. `/careers/`)

1. `src/config/routes.ts` → `careers: () => '/careers/'`
2. `src/config/pages.ts` → `careers: { title, description }`
3. `src/pages/careers.astro`:
   ```astro
   <PageLayout
     seo={pages.careers}
     heading="Careers"
     breadcrumbs={[{ label: 'Careers', href: routes.careers() }]}
   >
     ...
   </PageLayout>
   ```
4. Add it to `mainNav` / `footerNav` in `routes.ts` if it belongs in navigation.
5. Add its URL to `lighthouserc.json` if it is a new **type** of page.

### Add a new content type (e.g. projects, team)

1. Schema in `src/content.config.ts` (lead review)
2. Content + `_template.md` in `src/content/<name>/`
3. Getter functions in `src/lib/content.ts`
4. Card component in `src/components/sections/`
5. Pages in `src/pages/<name>/` (`index.astro` + `[slug].astro`)
6. Route functions in `routes.ts`, then navigation

---

## SEO & performance (built in)

- Title, description, canonical, robots, Open Graph and Twitter tags on every page from one typed object
- JSON-LD: Organization + WebSite on all pages; BreadcrumbList, Service and BlogPosting per page type
- 1200×630 social image generated from each blog cover at build time
- `sitemap-index.xml`, `robots.txt`, `rss.xml` generated from content
- Single-post tag pages are `noindex` and removed from the sitemap automatically
- Responsive WebP images, zero framework JavaScript (only a ~2.5 KB prefetch script)

**seo-guard** checks the built HTML and fails the build on: missing title / description / canonical / `<h1>`, more than one `<h1>`, duplicate titles or descriptions, canonical ≠ real URL, broken internal links, non-descriptive link text.

**Lighthouse budgets** (CI): Performance ≥ 95 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO = 100 · LCP < 2.5 s · CLS < 0.1.

---

## Git workflow

Commits follow [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `content:`, `style:`, `refactor:`, `perf:`, `docs:`, `chore:`, `ci:`, `test:`.

```bash
git checkout -b feat/careers-page
git commit -m "feat: add careers page"
git push -u origin feat/careers-page   # then open a PR into master
```

| Hook         | Runs                                 |
| ------------ | ------------------------------------ |
| `pre-commit` | Prettier on staged files             |
| `commit-msg` | Commit message format check          |
| `pre-push`   | `npm run check` (boundaries + types) |

**CI** (`.github/workflows/ci.yml`) runs on every PR: install → formatting → build + seo-guard → Lighthouse. A PR can only merge into `master` when CI is green.

---

## Running Lighthouse locally

```bash
DEPLOY_ENV=production npm run build
npm run lighthouse
```

Reports are written to `.lighthouseci/` (git-ignored).

To use Chrome DevTools instead: run `npm run preview` after the production build and audit in an **Incognito** window. **Never audit `npm run dev`** — the dev toolbar adds links and scripts that lower the scores.

---

## Environment variables

| Variable     | Purpose                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SITE_URL`   | Production origin (no trailing slash). Used for canonicals, sitemap, OG, RSS.                                                                    |
| `DEPLOY_ENV` | Set to `production` **only** on the live deploy and in CI. Leave it unset in `.env` — otherwise local builds allow search engines to index them. |

---

## Troubleshooting

| Problem                                                       | Fix                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `architecture rule violation`                                 | Use `routes.*` / `@lib/content` — the file and line are shown                                    |
| `InvalidContentEntryDataError`                                | Frontmatter doesn't match the schema — the field is named in the error                           |
| `[seo-guard] duplicate description` / `duplicate <title>`     | Make every page's title and description unique                                                   |
| `[seo-guard] broken link`                                     | A link points to a page that doesn't exist — check `routes.ts` and the page file                 |
| `[seo-guard] has 2 <h1>`                                      | Change the extra `<h1>` to `<h2>`                                                                |
| `[seo-guard] non-descriptive link text`                       | Replace "Learn more" etc. with text that says where the link goes                                |
| Lighthouse "Page is blocked from indexing"                    | Expected for local builds without `DEPLOY_ENV=production`                                        |
| Lighthouse fails in CI                                        | Download the `lighthouse-reports` artifact from the CI run and open the HTML report              |
| `EPERM … .node` during `npm ci` / `npm install` (Windows)     | `npx astro dev stop`, close VS Code, run the command again                                       |
| `File 'astro/tsconfigs/strictest' not found`                  | `node_modules` is incomplete — run `npm install`, then VS Code → "TypeScript: Restart TS Server" |
| `prettier --check` fails on files you didn't change (Windows) | Line-ending issue — `git add --renormalize .` (`.gitattributes` enforces LF)                     |
| Dev server URL without trailing slash returns 404             | Expected — all URLs end with `/`. Use `routes.*` and it never happens.                           |

---

## Dependencies notes

- `overrides.postcss-selector-parser` forces a patched version ([GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf)) because `@tailwindcss/typography` pins an older one. Remove it once typography updates its dependency.
- `package-lock.json` must stay valid on Linux (CI). If `npm ci` fails in CI with `Missing: … from lock file`, regenerate the lock file on Linux (WSL / Codespaces) with `npm install`.
- Lighthouse CI is pinned in the `lighthouse` script (`@lhci/cli@0.15.1`) so scores don't change between runs.

---
