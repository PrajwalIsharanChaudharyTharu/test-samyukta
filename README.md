# Samyukta Technology — Corporate Website

Static, SEO-first site built with **Astro 7 + Tailwind CSS v4 + TypeScript (strictest)**.

## Getting started

```bash
nvm use                 # Node 22
npm install             # also installs git hooks
cp .env.example .env
npm run dev             # http://localhost:4321
```

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Dev server with draft content visible             |
| `npm run check`   | Architecture boundaries + type check              |
| `npm run build`   | check → build → seo-guard (fails on SEO problems) |
| `npm run preview` | Serve the production build locally                |
| `npm run format`  | Format everything with Prettier                   |

## Where things live

| Path                          | Owns                                                | Edit?                  |
| ----------------------------- | --------------------------------------------------- | ---------------------- |
| `src/config/site.ts`          | Company name, contact, socials                      | Lead                   |
| `src/config/routes.ts`        | **Every URL** + header/footer nav                   | Lead                   |
| `src/config/pages.ts`         | SEO for static pages                                | Anyone                 |
| `src/content.config.ts`       | Content schemas                                     | Lead (review required) |
| `src/content/*/`              | Markdown content. Copy `_template.md`               | Anyone                 |
| `src/lib/content.ts`          | The only code that reads content                    | Lead                   |
| `src/lib/seo.ts`, `schema.ts` | Meta tags + JSON-LD logic                           | Lead                   |
| `src/layouts/`                | `BaseLayout` (document), `PageLayout` (inner pages) | Lead                   |
| `src/components/ui/`          | Primitives: Button, Badge, SectionHeading           | Anyone                 |
| `src/components/sections/`    | Cards, CTA, BlogListing                             | Anyone                 |
| `src/pages/`                  | Routes. File = URL                                  | Anyone                 |
| `src/styles/global.css`       | Design tokens                                       | Lead / designer        |
| `integrations/seo-guard.ts`   | Build-time SEO checks                               | Lead                   |

Imports flow one way: `config → lib → components → layouts → pages`.

## Rules (most are enforced by the build)

1. **No hardcoded URLs.** Use `routes.*`. All URLs end in `/`.
2. **No hardcoded company info.** Use `site.*`.
3. **Content only through `@lib/content`.** Never `getCollection()` in a page.
4. **Pages never write `<meta>`.** Pass `seo` to the layout.
5. **One `<h1>` per page.** `PageLayout` renders it; sections use `<h2>`.
6. **Images:** `<Image />` from `src/assets/`. Only the first visible image gets `priority`.
7. **Colours:** tokens only. Green **text and buttons use `brand-700`** (contrast).
8. **Astro 7 whitespace:** put mixed text + `{expressions}` in one template string.
9. **Never use `Astro.url.pathname` directly.** Pass it through `normalizePath()`.

## Common tasks

**Add a blog post or service:** copy `_template.md` in that folder → rename (file name = URL) → fill in → `draft: false`.

**Add a static page (e.g. `/careers/`):**

1. `routes.ts` → `careers: () => '/careers/'`
2. `pages.ts` → `careers: { title, description }`
3. `src/pages/careers.astro` → `<PageLayout seo={pages.careers} heading="Careers" breadcrumbs={[…]}>`
4. Add it to `mainNav` / `footerNav` if needed

## When the build fails

| Message                             | Fix                                                        |
| ----------------------------------- | ---------------------------------------------------------- |
| `architecture rule violation`       | Use `routes.*` / `@lib/content` (file + line are shown)    |
| `InvalidContentEntryDataError`      | Frontmatter doesn't match the schema; the field is named   |
| `[seo-guard] duplicate description` | Two pages share a description. Make each unique.           |
| `[seo-guard] broken link`           | A link points to a page that doesn't exist                 |
| `[seo-guard] has 2 <h1>`            | Change the extra `<h1>` to `<h2>`                          |
| Lighthouse failure in CI            | Download the `lighthouse-reports` artifact from the CI run |

## Environment

| Variable     | Purpose                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `SITE_URL`   | Production origin, used for canonicals, sitemap and OG                  |
| `DEPLOY_ENV` | `production` **only** on the live deploy; anything else blocks crawlers |
