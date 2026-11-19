# 10. Troubleshooting & known gaps

[← Handbook index](./README.md)

---

## 10.1 Error → cause → fix

### Install & environment

| You see                                                                                                        | Cause                                                                    | Fix                                                                                      |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `EPERM: operation not permitted, unlink '…astro.win32-x64-msvc.node'`                                          | VS Code's Astro extension holds the native compiler file open (Windows). | `npx astro dev stop`, close **all** VS Code windows, `npm ci`, reopen VS Code.           |
| `Tsconfig not found astro/tsconfigs/strictest`, or `npx` offers to install `astro`/`@astrojs/check`/`prettier` | `node_modules` is incomplete (an install was interrupted).               | Same as above: clean `npm ci`. Then VS Code → "TypeScript: Restart TS Server".           |
| `Cannot find package 'prettier-plugin-astro'`                                                                  | Incomplete `node_modules`.                                               | `npm ci`.                                                                                |
| `Cannot find name 'process'. Do you need to install type definitions for node?`                                | `@types/node` missing or not listed in `tsconfig.json` `types`.          | `npm i -D @types/node@22`; keep `"types": ["node"]` in `tsconfig.json`.                  |
| `⚠️ SITE_URL is not set`                                                                                       | No `SITE_URL` in the environment or `.env`.                              | `cp .env.example .env` and set it.                                                       |
| npm `EBADENGINE` warning                                                                                       | Your Node is older than `engines.node` (≥ 22.23.4).                      | `nvm install 22 && nvm use`.                                                             |
| CI: `npm ci` → `Missing: … from lock file`                                                                     | `package-lock.json` out of sync with `package.json`.                     | `npm install`, commit the lock file (regenerate on Linux/WSL if it's platform-specific). |

### Build, types and content

| You see                                                                                      | Cause                                                          | Fix                                                               |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| `✖ architecture rule violation(s)` with a file:line                                          | Hardcoded `href="/…"` or `getCollection()` in UI code.         | Use `routes.*`; add/use a getter in `@lib/content`.               |
| `InvalidContentEntryDataError` … `description: String must contain at least 70 character(s)` | Frontmatter doesn't match the schema; the field is named.      | Fix that field in the Markdown file.                              |
| `… could not find image ../../assets/images/x.jpg`                                           | `cover` path wrong or file missing.                            | Check the relative path from the Markdown file.                   |
| `Cannot apply unknown utility class 'text-gray-700'`                                         | Tailwind's default palette is disabled (`--color-*: initial`). | Use a token (`text-muted`) or add one in `global.css`.            |
| `Type 'undefined' is not assignable … exactOptionalPropertyTypes`                            | Passing `undefined` to an optional prop typed `foo?: string`.  | Type the prop `foo?: string \| undefined`, or don't pass the key. |
| `'X' is declared but its value is never read`                                                | Unused import/variable (strictest).                            | Delete it.                                                        |
| `Object is possibly 'undefined'` on `arr[0]`                                                 | `noUncheckedIndexedAccess`.                                    | Guard: `const [first] = arr; if (first) …`.                       |
| Content change not showing in dev                                                            | Generated types / content cache stale.                         | `npx astro sync`, or restart `npm run dev`.                       |

### seo-guard

| You see                                             | Fix                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/x/: missing meta description` / `missing <title>` | The page didn't pass `seo` correctly to its layout.                                                                  |
| `/x/: has 0 <h1>` / `has 2 <h1>`                    | Use `PageLayout`'s `heading`; change extra `<h1>`s to `<h2>`.                                                        |
| `duplicate <title> on /a/ and /b/`                  | Make titles unique (check `pages.ts` and frontmatter `seo.title`).                                                   |
| `duplicate description on /a/ and /b/`              | Make descriptions unique — common when two services share a `summary`.                                               |
| `/x/: canonical points to /y/`                      | A `seo.canonical` override is wrong, or a URL was built without `normalizePath`.                                     |
| `/x/: broken link → /contact/`                      | The route exists in `routes.ts` / nav but the page doesn't (or a Markdown link has a typo / missing trailing slash). |
| `/x/: non-descriptive link text "Learn more"`       | Make the link text say where it goes.                                                                                |

### Runtime / browser

| You see                                                       | Cause / fix                                                                                                                                   |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/about` returns 404 in dev                                   | Expected: URLs end with `/`. Use `/about/` — `routes.*` always does.                                                                          |
| Lighthouse "Page is blocked from indexing"                    | Local build without `DEPLOY_ENV=production`. Expected.                                                                                        |
| Lighthouse scores low locally                                 | You audited `npm run dev`. Audit `npm run preview` in an Incognito window.                                                                    |
| `prettier --check` fails on files you didn't change (Windows) | Line endings. Configure `git config core.autocrlf input` (or add a `.gitattributes` with `* text=auto eol=lf`) and `git add --renormalize .`. |

### Git

| You see                                         | Fix                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| `header must not be longer than 100 characters` | Shorten the first line; move details to the body (`-m "…" -m "…"`). |
| `subject must not be sentence-case`             | Start the subject in lower case: `feat: add…`.                      |
| `type must be one of [feat, fix, content, …]`   | Use one of the ten allowed types.                                   |
| Hooks don't run                                 | `npm run prepare` to reinstall husky hooks.                         |

---

## 10.2 Known gaps in the codebase

An honest list of what is unfinished or inconsistent **as of this handbook's writing**. Pick these up as tasks;
remove an item from this list in the PR that fixes it.

### Functional

| #   | Gap                                                                                                                                                                                                         | Where                                      | Suggested fix                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1   | **Mobile menu is empty.** The `<details>` "Menu" opens nothing — its `<nav>` is commented out. Phone visitors have no navigation.                                                                           | `components/layout/Header.astro`           | Restore the mobile `<nav>` using `mainNav` (add the contact item once the route exists). |
| 2   | **"Start a project" buttons go nowhere.** They render as `<button>` with no `href` because the contact page doesn't exist.                                                                                  | `Header.astro`, `sections/CtaBanner.astro` | [Recipe 8.3](./08-recipes.md#83-static-page--contact-enable-a-planned-route).            |
| 3   | **Missing public files.** `site.logo` (`/logo.svg`) and `site.defaultOgImage` (`/og-default.png`) are referenced but `public/` contains only favicons. Organization JSON-LD and social cards point at 404s. | `public/`, `config/site.ts`                | Add the real logo and a 1200×630 OG image.                                               |
| 4   | **Blog pagination is wired but not built.** `routes.blogPage`, `getPostPages()` and the sitemap filter exist, but there is no `pages/blog/page/[page].astro`; `/blog/` lists every post as plain links.     | `pages/blog/`                              | Add the paginated route (with `PostCard`s) when posts exceed `POSTS_PER_PAGE`.           |
| 5   | **Home hero has no call to action.** The hero buttons are commented out (they wait for contact/projects).                                                                                                   | `pages/index.astro`                        | Re-enable once those routes exist.                                                       |
| 6   | **`foundingYear: 2020` is unconfirmed.**                                                                                                                                                                    | `config/site.ts`                           | Confirm with the company.                                                                |

### Content & SEO

| #   | Gap                                                                                                                                                 | Suggested fix                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 7   | **Two near-duplicate services.** `web-development.md` and `web-sites.md` have almost the same summary, features and body, and both have `order: 1`. | Merge them, or rewrite one as a clearly different service; give unique `order` values.            |
| 8   | **Unconfirmed promise** "We reply within one business day" in `CtaBanner`'s default body.                                                           | Keep only if the business confirms it.                                                            |
| 9   | Footer hardcodes `", Nepal"` instead of deriving from `site.contact.address.country`.                                                               | Add a `countryName` field to `site.ts`, or derive it.                                             |
| 10  | About page and blog post contain placeholder copy.                                                                                                  | Replace with real content (see [Recipe 8.2](./08-recipes.md#82-static-page--about-build-it-out)). |
| 11  | No `_template.md` for services (the README mentions one).                                                                                           | Add `src/content/services/_template.md`.                                                          |

### Accessibility & design

| #   | Gap                                                                                                                                                                                                                                         | Suggested fix                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 12  | **`brand-600` used for small text and as the primary button fill** (≈ 3.8:1 on white, below WCAG AA 4.5:1): `Button` primary/ghost, nav active state, link hovers, `SectionHeading` eyebrow, `ServiceCard` "Learn more", 404 label.         | Switch small text and button fills to `brand-700` (≈ 5.5:1), as the README rule says. |
| 13  | **HTML comments ship to visitors.** `<!-- … -->` appears in `BaseLayout`, `Header` (two, one wrapping the old mobile nav), `CtaBanner`, `index.astro`, `SEO.astro`.                                                                         | Convert to `{/* … */}` (README rule 8).                                               |
| 14  | Inter is named in `--font-sans` but never loaded; visitors get the system font.                                                                                                                                                             | Self-host Inter or remove it from the stack.                                          |
| 15  | Design deviations from the house rules ([chapter 7 §7.6](./07-design-system.md#76-design-direction--the-house-rules-we-are-moving-towards)): hero gradient, eyebrows, `backdrop-blur` header, hover shadows on cards, identical card grids. | One design PR with the lead.                                                          |

### Docs & tooling

| #   | Gap                                                                                                                             | Suggested fix                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 16  | `lib/nav.ts` comments describe `build.format: 'file'`, but the config uses `'directory'`. `normalizePath` still works for both. | Update the comment.                                               |
| 17  | `README.md` mentions `.gitattributes`, but the file is not in the repository.                                                   | Add `.gitattributes` (`* text=auto eol=lf`) or update the README. |
| 18  | `@astrojs/markdown-satteri` is a dependency but is not referenced in `astro.config.mjs`.                                        | Confirm its purpose with the lead; remove if unused.              |
| 19  | CI listens on `master`; if the default branch becomes `main`, CI stops running on pushes.                                       | Keep `branches:` in `ci.yml` in sync with the default branch.     |

---

## 10.3 Where to get help

1. Search this handbook and `README.md`.
2. Read the error message to the end — seo-guard, the boundaries script and Zod all name the file and field.
3. Astro docs: <https://docs.astro.build> (routing, components, content collections, styling, images).
4. Ask in the team channel with: what you ran, the full error, and what you already tried.

[← Back to the handbook index](./README.md)
