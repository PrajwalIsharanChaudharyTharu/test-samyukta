# 5. `src/` reference — file by file

[← Handbook index](./README.md)

Every file in `src/`, what it owns, what it exports, who uses it, and how to change it safely. Ownership follows
the table in `README.md`: **Lead** files need a lead's review; **Anyone** files can be changed by any developer.

- [5.1 config/](#51-config) · [5.2 content.config.ts & content/](#52-contentconfigts--content) ·
  [5.3 lib/](#53-lib) · [5.4 layouts/](#54-layouts) · [5.5 components/](#55-components) ·
  [5.6 pages/](#56-pages) · [5.7 assets/ & public/](#57-assets--public) · [5.8 styles/](#58-styles)

---

## 5.1 `config/`

Plain data. No logic, no Astro imports. These are the **single sources of truth**.

### `config/site.ts` — company identity _(Lead)_

Exports `site` (and the type `Site`). Shape enforced by the `SiteConfig` interface with `satisfies`, so a typo or
missing field is a type error, while `as const` keeps the literal values.

| Field            | Current value / meaning                                          | Used by                                      |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| `name`           | `Samyukta Technology` — short brand name                         | Header, Footer, OG `site_name`, JSON-LD, RSS |
| `legalName`      | `Samyukta Technology Pvt. Ltd.`                                  | Footer copyright, Organization JSON-LD       |
| `tagline`        | `Digital Innovation`                                             | Home `<h1>`, Footer                          |
| `description`    | Default description (70–160 chars)                               | Home intro, RSS                              |
| `lang`, `locale` | `en`, `en_US`                                                    | `<html lang>`, `og:locale`, WebSite JSON-LD  |
| `titleTemplate`  | `%s \| Samyukta Technology` — `%s` is replaced by the page title | `formatTitle()` in `lib/seo.ts`              |
| `defaultOgImage` | `/og-default.png` (1200×630, in `public/`)                       | Fallback social image                        |
| `logo`           | `/logo.svg` (in `public/`)                                       | Organization JSON-LD                         |
| `themeColor`     | `#079669` (brand green)                                          | `<meta name="theme-color">`                  |
| `foundingYear`   | `2020` — **TODO: confirm**                                       | Organization `foundingDate`                  |
| `contact`        | email, phone, postal address                                     | Footer, Organization JSON-LD                 |
| `social`         | LinkedIn, Facebook URLs                                          | Organization `sameAs`                        |
| `twitterHandle`  | `''` (empty = omit the tag)                                      | `twitter:site`                               |

**Rule:** never type company details anywhere else. If a component needs a new fact, add a field here first.

### `config/routes.ts` — every URL and the navigation _(Lead)_

```ts
export const routes = {
  home: () => '/',
  about: () => '/about/',
  services: () => '/services/',
  service: (slug: string) => `/services/${slug}/`,
  blog: () => '/blog/',
  blogPage: (page: number) => (page <= 1 ? '/blog/' : `/blog/page/${page}/`),
  blogPost: (slug: string) => `/blog/${slug}/`,
  blogTag: (tag: string) => `/blog/tags/${tag}/`,
  rss: () => '/rss.xml',
} as const;
```

- Every route is a **function**, even static ones. One calling style everywhere, and parameters can be added later
  without changing call sites.
- Every path **ends with `/`** (matches `trailingSlash: 'always'`). Files like `rss.xml` are the only exception.
- `contact`, `projects` and `project` are present but **commented out** until those pages exist. Uncommenting a
  route without creating the page makes seo-guard fail with a broken link — that is the point.
- `mainNav` (header) and `footerNav` (footer columns) are arrays of `{ label, href }`. **Array order is display
  order.** They use `satisfies readonly NavItem[]` for type safety.

### `config/pages.ts` — SEO for static pages _(Anyone)_

Exports `pages`: one `PageSeo` object per **static** page (`home`, `services`, `projects`, `about`, `contact`,
`blog`, `notFound`). Detail pages (one service, one post) take SEO from their Markdown instead.

Rules in the file header: the **final** title (with ` | Samyukta Technology`, 24 characters) should be 30–60
characters; the description 70–160. `home` uses `absoluteTitle: true` (no suffix). `notFound` uses `noindex: true`.

---

## 5.2 `content.config.ts` & `content/`

### `content.config.ts` — the content model _(Lead, review required)_

Defines **collections**. Each has a `loader` (where entries come from) and a `schema` (what they must look like).

```ts
const contentGlob = (dir: string) => glob({ pattern: '**/[^_]*.{md,mdx}', base: `./src/content/${dir}` });
```

The pattern `[^_]*` skips any file whose name starts with `_` — that is how `_template.md` files are ignored.

| Collection | Fields (✱ = required)                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `services` | `title`✱ · `summary`✱ (≤200) · `order` (int, default 100) · `features` (string[], default `[]`) · `draft` (default false) · `seo`                                                         |
| `blog`     | `title`✱ (≤70) · `description`✱ (70–160) · `pubDate`✱ (date) · `updatedDate` · `author`✱ (string, ≥2) · `cover`✱ (`image()`) · `coverAlt`✱ (≥5) · `tags` (default `[]`) · `draft` · `seo` |

`seo` (optional on both): `{ title?: ≤60, description?: 70–160, noindex: boolean }` — per-entry overrides.

- `z.coerce.date()` accepts `2026-11-18` in YAML and gives you a real `Date`.
- `image()` makes Astro resolve the relative path (`../../assets/images/blog-astro.jpg`), check the file exists,
  and give you an optimisable image object.
- Commented-out `projects` and `team` collections are ready to enable (see [Recipe 8.7](./08-recipes.md#87-new-content-type-projects-end-to-end)).
  When enabled, the blog `author` can switch back to `reference('team')`.
- **Moving to a headless CMS later:** replace a collection's `loader`, keep its `schema`. Nothing that reads the
  data has to change.

### `content/` — the Markdown _(Anyone)_

```
content/
├── blog/
│   ├── _template.md          ← copy me (ignored by the loader)
│   └── why-we-chose-astro.md → /blog/why-we-chose-astro/
└── services/
    ├── web-development.md    → /services/web-development/
    └── web-sites.md          → /services/web-sites/
```

- **The file name is the URL.** Use `kebab-case.md`. Renaming a file changes its URL (and breaks old links).
- Bodies start at `##` (H2). The `title` is already the page's `<h1>`.

---

## 5.3 `lib/`

Logic. Pure TypeScript wherever possible. _(Lead, review required.)_

### `lib/content.ts` — the data access layer

**The only place that reads content.** The boundaries script fails if pages, components or layouts call
`getCollection`/`getEntry`/`getEntries` directly.

| Export                      | Returns                                 | Notes                                                              |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| `type Service`, `type Post` | `CollectionEntry<'services' \| 'blog'>` | Import these types instead of `astro:content` in UI code.          |
| `POSTS_PER_PAGE`            | `6`                                     | Page size for blog pagination.                                     |
| `getServices()`             | `Service[]` sorted by `order` ascending | Drafts hidden in production.                                       |
| `getPosts()`                | `Post[]` newest first                   | Drafts hidden in production.                                       |
| `getLatestPosts(limit = 3)` | newest `limit` posts                    | Home page.                                                         |
| `getRelatedPosts(post, 3)`  | other posts ranked by shared tags       | "Keep reading" on a post. Stable sort keeps recency as tiebreaker. |
| `getTags()`                 | `TagGroup[]` `{ slug, label, posts }`   | Tags merged by slug ("Web Perf" = "web perf"), most-used first.    |
| `getPostPages()`            | `Post[][]` chunks of `POSTS_PER_PAGE`   | Always at least one (possibly empty) page.                         |

The draft rule lives in one line:

```ts
const isPublished = ({ data }) => import.meta.env.DEV || !data.draft;
```

### `lib/seo.ts` — SEO core

| Export                         | Purpose                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interface PageSeo`            | **What a page provides.** Required: `title`, `description`. Optional: `absoluteTitle`, `ogImage`, `ogImageAlt`, `canonical`, `noindex`, `article`. |
| `interface ResolvedSeo`        | What `SEO.astro` renders — every field final and absolute.                                                                                         |
| `SEO_LIMITS`                   | Title 30–60 (measured **with** suffix), description 70–160.                                                                                        |
| `absoluteUrl(path, siteUrl)`   | `new URL(path, siteUrl).href`.                                                                                                                     |
| `formatTitle(title, abs)`      | Applies `site.titleTemplate` unless `abs` is true.                                                                                                 |
| `resolveSeo(input, path, url)` | Turns `PageSeo` into `ResolvedSeo`: title template, canonical from the normalised path, robots string, OG type/image.                              |
| `auditSeo(resolved)`           | Returns length problems. Called in **dev only** by `SEO.astro`, printed as `[seo]` warnings.                                                       |

### `lib/schema.ts` — JSON-LD builders

Pure functions returning plain objects; `JsonLd.astro` serialises them.

| Function                            | Emits            | Where it is used                         |
| ----------------------------------- | ---------------- | ---------------------------------------- |
| `organizationSchema(siteUrl)`       | `Organization`   | Every page (BaseLayout)                  |
| `websiteSchema(siteUrl)`            | `WebSite`        | Every page (BaseLayout)                  |
| `breadcrumbSchema(crumbs, siteUrl)` | `BreadcrumbList` | Every page with breadcrumbs (BaseLayout) |
| `serviceSchema(service, siteUrl)`   | `Service`        | `pages/services/[slug].astro`            |
| `blogPostingSchema(post, siteUrl)`  | `BlogPosting`    | `pages/blog/[slug].astro`                |

Stable `@id`s (`/#organization`, `/#website`) let other objects **reference** the organisation
(`publisher: { '@id': … }`) instead of repeating it.

### `lib/nav.ts` — URL helpers

| Export                        | Purpose                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `normalizePath(pathname)`     | Strips `.html`, `/index` and trailing slashes, then adds exactly one `/`. Use it whenever you compare or build URLs from `Astro.url.pathname`. |
| `isActivePath(current, href)` | True if `href` is the current page or a parent section (Home only matches exactly). Drives `aria-current="page"` in the header.                |
| `interface Crumb`             | `{ label, href }` — breadcrumb item.                                                                                                           |

### `lib/utils.ts` — small helpers

| Export             | Example                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| `cx(...classes)`   | `cx('p-4', isActive && 'font-bold', className)` — joins truthy class names. |
| `slugify(input)`   | `'Web Performance'` → `'web-performance'` (strips accents).                 |
| `formatDate(date)` | `November 18, 2026` (en-US, long month).                                    |
| `readingTime(md)`  | Words ÷ 200, minimum 1 → `"3 min read"`.                                    |

---

## 5.4 `layouts/`

_(Lead, review required.)_

### `layouts/BaseLayout.astro` — the HTML document

Every page renders inside it. It owns:

- `import '@/styles/global.css'` — the only CSS import in the project.
- `<html lang>`, charset, viewport, `theme-color`, favicon, sitemap link, RSS `<link rel="alternate">`.
- `<SEO seo={seo} />` and `<JsonLd schema={jsonLd} />`, where `jsonLd` is Organization + WebSite +
  (BreadcrumbList if breadcrumbs) + the page's `schema` prop.
- `<slot name="head" />` — escape hatch for extra `<head>` tags.
- The **skip link** (`Skip to content` → `#main`), `Header`, `<main id="main">`, `Footer`.

Props: `seo` (required), `breadcrumbs` (without Home — it prepends Home for the schema), `schema`.

Used directly by: `pages/index.astro`, `pages/404.astro`. Everything else uses `PageLayout`.

### `layouts/PageLayout.astro` — inner pages

`BaseLayout` + a standard page header band: `Breadcrumbs`, the page's **only `<h1>`** (from `heading`), optional
`intro` paragraph, and `<slot name="header-extra" />` (the blog post uses it for author/date/reading time). The
default slot is the page body.

---

## 5.5 `components/`

Organised by **role**, from most generic to most specific.

### `components/ui/` — primitives _(Anyone)_

Small, generic, no content knowledge.

| Component              | Props                                                                                        | Notes                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `Button.astro`         | `href?`, `variant` (`primary`/`secondary`/`ghost`), `size` (`sm`/`md`/`lg`), `type`, `class` | Renders `<a>` when `href` is given, otherwise `<button>`. Pill-shaped (`rounded-full`). |
| `Badge.astro`          | `href?`                                                                                      | Small rounded label; a link when `href` is given (blog tags).                           |
| `SectionHeading.astro` | `title`, `eyebrow?`, `intro?`, `align` (`left`/`center`)                                     | Always an `<h2>`. The page owns the single `<h1>`.                                      |

### `components/layout/` — site chrome _(Lead for Header/Footer)_

| Component           | Purpose                                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Container.astro`   | Centres content: `max-w-(--container-content)` (72rem) with `px-5 md:px-8`. Props: `as` (`div`/`section`/`article`/`nav`), `class`, any HTML attribute. |
| `Header.astro`      | Sticky header: wordmark (→ home), `mainNav` with `aria-current` via `isActivePath`, a "Start a project" button, and a `<details>` mobile menu (no JS).  |
| `Footer.astro`      | Name, tagline, city + email (`<address>`), one `<nav>` per `footerNav` group, copyright with `legalName`.                                               |
| `Breadcrumbs.astro` | `<nav aria-label="Breadcrumb">` with an `<ol>`. Prepends Home. Last item is `aria-current="page"` text, not a link.                                     |

### `components/sections/` — compositions _(Anyone)_

Know about content types; combine primitives.

| Component           | Props                                             | Notes                                                                                               |
| ------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `ServiceCard.astro` | `service`, `headingLevel` (`h2`/`h3`, default h3) | Whole card clickable via `after:absolute after:inset-0` on the link. Links to `routes.service(id)`. |
| `PostCard.astro`    | `post`, `priority`, `headingLevel`                | Cover `<Image>` 800×450 with `sizes`; `priority` → `loading="eager"` + `fetchpriority="high"`.      |
| `CtaBanner.astro`   | `title?`, `body?`                                 | Dark brand band with a "Start a project" button. Used on home and service pages.                    |

**`headingLevel`**: use `h2` when the cards are directly under the page `<h1>` (services index, tag pages), `h3`
when they sit under a section `<h2>` (home page). Heading levels must never skip.

### `components/seo/` — used by layouts only _(Lead)_

| Component      | Purpose                                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SEO.astro`    | Renders `<title>`, description, canonical, robots, Open Graph (incl. `article:*`), Twitter tags from one `PageSeo`. Prints `[seo]` length warnings in dev. |
| `JsonLd.astro` | One `<script type="application/ld+json">` per object. Escapes `<` as `<` so content can never close the script tag (XSS-safe).                             |

---

## 5.6 `pages/`

**File = URL.** With `build.format: 'directory'`, `about.astro` → `/about/`, `services/index.astro` → `/services/`,
`[slug].astro` → one page per value returned by `getStaticPaths()`.

| File                    | URL                  | Layout       | Data                      | Notes                                                                                                                     |
| ----------------------- | -------------------- | ------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `index.astro`           | `/`                  | BaseLayout   | services + 3 latest posts | Own `<h1>` (tagline). `Promise.all` loads both lists in parallel.                                                         |
| `about.astro`           | `/about/`            | PageLayout   | —                         | Placeholder content.                                                                                                      |
| `services/index.astro`  | `/services/`         | PageLayout   | `getServices()`           | `ServiceCard` grid, `headingLevel="h2"`.                                                                                  |
| `services/[slug].astro` | `/services/<id>/`    | PageLayout   | one service               | Markdown body in `prose`, "What's included" aside, `Service` JSON-LD, `CtaBanner`. SEO title default: `<title> Services`. |
| `blog/index.astro`      | `/blog/`             | PageLayout   | `getPosts()`              | Simple list of links.                                                                                                     |
| `blog/[slug].astro`     | `/blog/<id>/`        | PageLayout   | one post + related        | 1200×630 OG image via `getImage()`, `BlogPosting` JSON-LD, table of contents (H2s), tags, reading time, related posts.    |
| `blog/tags/[tag].astro` | `/blog/tags/<slug>/` | PageLayout   | `getTags()`               | **`noindex` when the tag has fewer than 2 posts** (thin page).                                                            |
| `404.astro`             | `/404.html`          | BaseLayout   | —                         | `noindex`; skipped by seo-guard; excluded from sitemap.                                                                   |
| `robots.txt.ts`         | `/robots.txt`        | — (endpoint) | `DEPLOY_ENV`              | `Allow` + sitemap in production; `Disallow: /` everywhere else.                                                           |
| `rss.xml.ts`            | `/rss.xml`           | — (endpoint) | `getPosts()`              | `@astrojs/rss` feed.                                                                                                      |

**Endpoints** (`.ts` files exporting `GET`) produce non-HTML files at build time.

---

## 5.7 `assets/` & `public/`

| Folder               | Processed?                                           | Use for                                                                                  |
| -------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/assets/images/` | **Yes** — resized, WebP, `srcset`, hashed file names | Every image shown through `<Image />` or a content `image()` field (blog covers).        |
| `public/`            | **No** — copied as-is to the site root               | Files that need a fixed URL: `favicon.svg`, `favicon.ico`, `logo.svg`, `og-default.png`. |

Image rules:

- Use `<Image />` from `astro:assets` with explicit `width`/`height` (prevents layout shift) and real `alt` text.
- Only the **first image visible on load** gets `loading="eager"` + `fetchpriority="high"`. Everything else is lazy.
- Source images ≈ 2400 px wide, under ~500 KB. Astro generates the smaller sizes.
- Decorative images: `alt=""`.

## 5.8 `styles/`

### `styles/global.css` — tokens and base styles _(Lead / designer)_

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

@theme {
  --color-*: initial;   /* ← wipes Tailwind's default palette */
  …tokens…
}
@layer base { … }
```

- **`--color-*: initial` disables every default Tailwind colour.** `bg-blue-500`, `text-gray-700` and friends do
  not exist. You can only use colours defined here. Using an undefined one fails the build with
  `Cannot apply unknown utility class`.
- Every token becomes utilities automatically: `--color-ink` → `text-ink`, `bg-ink`, `border-ink`…;
  `--radius-card` is used as `rounded-(--radius-card)`; `--container-content` as `max-w-(--container-content)`.
- `@layer base` sets the page text colour, smooth scrolling, a visible `:focus-visible` ring, and a
  `prefers-reduced-motion` override that disables animations and smooth scrolling.

The full token list and how to add one is in [chapter 7](./07-design-system.md).

Next: [6. SEO patterns →](./06-seo.md)
