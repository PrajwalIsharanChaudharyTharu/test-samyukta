# Samyukta Frontend — Project Handbook

Welcome. This handbook explains **everything** in the `samyukta-frontend` repository: every config file, every
folder in `src/`, how the pieces talk to each other, the rules the build enforces, and step-by-step recipes for
the work you will actually do (new pages, services, blog posts, content types, components).

> **Who this is for:** interns and new developers in their first week, and anyone who needs to remember _why_
> something is the way it is.
>
> **How to read it:** chapters 1–4 once, in order, on day one. After that, use chapters 5–10 as a reference,
> and open chapter 8 (Recipes) whenever you start a task.

---

## Chapters

| #   | Chapter                                                     | Read it when…                                                                |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | [Getting started](./01-getting-started.md)                  | Day one. Install, run, and understand every `npm run` script.                |
| 2   | [Tooling, Git hooks & CI](./02-tooling-and-ci.md)           | You want to know what `.nvmrc`, `.prettierrc`, husky, commitlint and CI do.  |
| 3   | [Astro config, integrations & guards](./03-astro-config.md) | You touch `astro.config.mjs`, `seo-guard`, `check-boundaries` or Lighthouse. |
| 4   | [Architecture & data flow](./04-architecture.md)            | You need the big picture: layers, import rules, how a page gets built.       |
| 5   | [`src/` reference — file by file](./05-src-reference.md)    | You open a file in `src/` and want to know what it owns and who uses it.     |
| 6   | [SEO patterns](./06-seo.md)                                 | Anything with titles, descriptions, canonicals, JSON-LD, sitemap, robots.    |
| 7   | [Design system & UI rules](./07-design-system.md)           | You style something, add a token, or build a component.                      |
| 8   | [Recipes — step-by-step workflows](./08-recipes.md)         | You add a page (About, Contact, Demo), a service, a post, or a content type. |
| 9   | [Git workflow & code review](./09-git-workflow.md)          | Branching, commit messages, PRs, what reviewers look for.                    |
| 10  | [Troubleshooting & known gaps](./10-troubleshooting.md)     | Something is broken, or you want to know what is unfinished in the codebase. |

---

## The project in one paragraph

`samyukta-frontend` is the corporate website of **Samyukta Technology Pvt. Ltd.** It is a **static**,
**SEO-first** site built with **Astro 7**, **Tailwind CSS v4** and **TypeScript (strictest mode)**. There is no
server at runtime: `npm run build` turns Markdown content and `.astro` templates into plain HTML files in
`dist/`, which any static host can serve. Quality is enforced by machines, not by memory: a custom architecture
checker, a strict type check, a build-time SEO guard and Lighthouse budgets in CI all fail loudly when a rule is
broken.

## The five rules you must never break

If you remember nothing else, remember these. Most of them are enforced by the build.

1. **URLs come from `routes.*`** (`src/config/routes.ts`). Never write `href="/about"` by hand.
2. **Company details come from `site.*`** (`src/config/site.ts`). Never type the company name, email or phone
   into a component.
3. **Content is read only through `@lib/content`.** Never call `getCollection()` in a page or component.
4. **Pages never write `<title>` or `<meta>`.** They pass a `seo` object to a layout.
5. **Colours, fonts and radii come from tokens** in `src/styles/global.css`. Never write `bg-[#079669]`.

## Glossary

| Term                  | Meaning in this project                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **Static site (SSG)** | Every page is rendered to HTML at build time. Nothing runs on a server when a visitor arrives.           |
| **Collection**        | A typed group of content entries (`services`, `blog`), defined in `src/content.config.ts`.               |
| **Entry / `id`**      | One Markdown file in a collection. Its `id` is the file name without extension and becomes the URL slug. |
| **Frontmatter**       | The YAML block between `---` lines at the top of a Markdown file. Validated by a Zod schema.             |
| **Token**             | A named design value (`--color-brand-600`, `--radius-card`) defined once in `global.css`.                |
| **Canonical**         | The one official URL of a page, announced to search engines with `<link rel="canonical">`.               |
| **JSON-LD**           | Structured data (schema.org) in a `<script type="application/ld+json">` tag that search engines read.    |
| **seo-guard**         | Our custom Astro integration that inspects the built HTML and fails the build on SEO problems.           |
| **Draft**             | Content with `draft: true`. Visible in `npm run dev`, never included in a production build.              |
| **Slot**              | Astro's way of passing child markup into a component or layout (like `children` in React).               |
| **Path alias**        | A short import prefix such as `@config/site`, mapped to a folder in `tsconfig.json`.                     |

---

_Keep this handbook true._ When you change how something works, update the chapter that describes it in the same
pull request. A handbook that lies is worse than no handbook.
