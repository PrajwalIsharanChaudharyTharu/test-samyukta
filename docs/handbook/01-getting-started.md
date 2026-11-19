# 1. Getting started

[← Handbook index](./README.md)

This chapter takes you from an empty machine to a running site, and explains every `npm run` command.

---

## 1.1 What you need installed

| Tool               | Version                                         | Why                                                                      |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------ |
| **Node.js**        | 22 (see `.nvmrc`); `package.json` asks ≥22.23.4 | Runs Astro, TypeScript, Prettier and every script.                       |
| **npm**            | Comes with Node                                 | Installs dependencies from `package-lock.json`.                          |
| **nvm** (or nvm4w) | Any                                             | Switches to the right Node version with one command: `nvm use`.          |
| **Git**            | Any recent                                      | Version control. Git hooks run automatically (chapter 2).                |
| **VS Code**        | Any recent                                      | The repo recommends the **Astro** extension (`.vscode/extensions.json`). |

> **Windows users:** use Git Bash or PowerShell. Both work. Read §1.6 before running `npm install` with VS Code
> open — it is the most common day-one problem on this project.

## 1.2 First-time setup

```bash
git clone <repo-url> samyukta-frontend
cd samyukta-frontend

nvm use                 # reads .nvmrc → Node 22
npm install             # installs dependencies AND the git hooks (via the "prepare" script)
cp .env.example .env    # local environment variables
npm run dev             # → http://localhost:4321
```

Open <http://localhost:4321/> in your browser. You should see the home page with the Services section.

### What `npm install` actually does here

1. Installs everything listed in `package.json`, at the exact versions recorded in `package-lock.json`.
2. Applies the `overrides` block (forces a patched `postcss-selector-parser`; see chapter 2).
3. Runs the `prepare` script → `husky` → installs the Git hooks in `.husky/` into your local `.git`.

## 1.3 Environment variables

The site reads two variables. Neither is secret.

| Variable     | Where it is read                               | What it does                                                                                                  |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`   | `astro.config.mjs` → `site`                    | The production origin, **no trailing slash**. Every canonical, OG URL, sitemap and RSS link is built from it. |
| `DEPLOY_ENV` | `src/pages/robots.txt.ts` (`process.env` only) | When it equals `production`, `robots.txt` allows crawling. Anything else → `Disallow: /`.                     |

```dotenv
# .env.example  (copy to .env)
SITE_URL=https://www.example.com
```

Rules:

- **Never set `DEPLOY_ENV=production` in your `.env`.** A local or preview build must never invite Google in.
  CI and the real production deploy set it themselves.
- If `SITE_URL` is missing, `astro.config.mjs` prints a warning and falls back to
  `https://samyuktatechnology.com/`. Canonicals in that build may be wrong for the environment.
- `.env`, `.env.production` and every `.env.*` file except `.env.example` are git-ignored. Do not commit them.

## 1.4 Every `npm run` script

These live in `package.json` → `scripts`.

| Command                    | Runs                                  | Use it when                                                                                    |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`              | `astro dev`                           | Everyday work. Hot reload, drafts visible, SEO warnings printed in the terminal.               |
| `npm run check`            | `check:boundaries` then `astro check` | Before you push (the `pre-push` hook runs it for you). Architecture rules + full type check.   |
| `npm run check:boundaries` | `node scripts/check-boundaries.mjs`   | Quick check that you did not hardcode a URL or call `getCollection()` in UI code.              |
| `npm run build`            | `npm run check` then `astro build`    | Produce `dist/`. Also runs **seo-guard**, which fails on SEO problems and broken links.        |
| `npm run preview`          | `astro preview`                       | Serve the built `dist/` locally, exactly as a host would. Use this for Lighthouse in DevTools. |
| `npm run lighthouse`       | `npx -y @lhci/cli@0.15.1 autorun`     | Run the Lighthouse budgets from `lighthouserc.json` against `dist/`. Build first.              |
| `npm run format`           | `prettier --write .`                  | Reformat the whole repo.                                                                       |
| `npm run lint:format`      | `prettier --check .`                  | Check formatting without changing files. This is what CI runs.                                 |
| `npm run astro -- <cmd>`   | `astro <cmd>`                         | Any other Astro CLI command, e.g. `npm run astro -- sync`.                                     |
| `npm run prepare`          | `husky`                               | Runs automatically after `npm install`. Re-run it if your hooks stop working.                  |

### Running the dev server in the background

The project's `AGENTS.md` asks automated tools to use background mode:

```bash
npx astro dev --background   # start
npx astro dev status         # is it running?
npx astro dev logs           # show its output
npx astro dev stop           # stop it (do this before npm install on Windows)
```

## 1.5 A tour of the repository

```
samyukta-frontend/
├── .github/workflows/ci.yml   ← CI pipeline (chapter 2)
├── .husky/                    ← Git hooks: pre-commit, commit-msg, pre-push
├── .vscode/                   ← Recommended extension + "Development server" launch config
├── docs/handbook/             ← you are here
├── integrations/seo-guard.ts  ← build-time SEO checks (chapter 3)
├── public/                    ← copied as-is to the site root (favicons, logo, default OG image)
├── scripts/check-boundaries.mjs ← architecture checks (chapter 3)
├── src/                       ← the website itself (chapters 4–5)
│   ├── assets/images/         ← images processed by astro:assets
│   ├── components/            ← layout/ · seo/ · sections/ · ui/
│   ├── config/                ← site.ts · routes.ts · pages.ts
│   ├── content/               ← Markdown: blog/ · services/
│   ├── content.config.ts      ← content schemas
│   ├── layouts/               ← BaseLayout · PageLayout
│   ├── lib/                   ← content · seo · schema · nav · utils
│   ├── pages/                 ← file = URL
│   └── styles/global.css      ← design tokens + base styles
├── .env.example  .gitignore  .nvmrc  .prettierrc
├── astro.config.mjs  commitlint.config.js  lighthouserc.json
├── package.json  package-lock.json  tsconfig.json
├── AGENTS.md                  ← instructions for AI coding assistants
└── README.md                  ← one-page quick reference
```

Generated folders you will see but never commit: `node_modules/`, `dist/` (build output), `.astro/` (generated
types), `.lighthouseci/` (Lighthouse reports).

## 1.6 Windows: the `EPERM` trap

On Windows, VS Code's Astro extension loads a native compiler file from `node_modules` and keeps it open. If you
run `npm install` or `npm ci` while VS Code is open, npm cannot replace that file and stops half-way with:

```
npm error EPERM: operation not permitted, unlink '...\astro.win32-x64-msvc.node'
```

The install is then **half finished**: `node_modules/astro` may be missing its `package.json`, and every command
fails strangely (for example `Tsconfig not found astro/tsconfigs/strictest`, or `npx` trying to download Astro).

**Fix:** `npx astro dev stop` → close **all** VS Code windows → run `npm ci` in a normal terminal → reopen VS Code.

## 1.7 Your first-day checklist

- [ ] `npm run dev` shows the home page.
- [ ] `npm run build` ends with `seo-guard ✓ … indexable pages passed SEO checks`.
- [ ] You made a test commit on a branch and saw the `pre-commit` and `commit-msg` hooks run.
- [ ] You read chapters 2, 3 and 4.
- [ ] You followed the "New blog post" recipe in chapter 8 as a draft, saw it in dev, then deleted it.

Next: [2. Tooling, Git hooks & CI →](./02-tooling-and-ci.md)
