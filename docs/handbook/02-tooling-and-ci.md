# 2. Tooling, Git hooks & CI

[← Handbook index](./README.md)

Every file in the repository root exists for a reason. This chapter explains each one, what reads it, and what
happens if you change it.

---

## 2.1 The pipeline at a glance

The same checks run at three moments. The earlier a problem is caught, the cheaper it is to fix.

```mermaid
flowchart LR
  A[You save a file] --> B[git commit]
  B --> B1[pre-commit:<br/>Prettier on staged files]
  B1 --> B2[commit-msg:<br/>commitlint]
  B2 --> C[git push]
  C --> C1[pre-push:<br/>npm run check]
  C1 --> D[Pull request / push to master]
  D --> D1[CI: npm ci]
  D1 --> D2[Prettier --check]
  D2 --> D3[npm run build<br/>boundaries + types + build + seo-guard]
  D3 --> D4[Lighthouse budgets]
```

| Check                      | Local (hook)          | CI  |
| -------------------------- | --------------------- | --- |
| Formatting (Prettier)      | `pre-commit` (staged) | ✓   |
| Commit message format      | `commit-msg`          | —   |
| Architecture boundaries    | `pre-push`            | ✓   |
| Type check (`astro check`) | `pre-push`            | ✓   |
| Build + seo-guard          | —                     | ✓   |
| Lighthouse budgets         | — (manual)            | ✓   |

---

## 2.2 `package.json`

The project manifest. Key parts:

| Field              | Value / meaning                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"type": "module"` | Every `.js`/`.mjs` file uses ES modules (`import`/`export`). That is why `commitlint.config.js` uses `export default`.                                                  |
| `engines.node`     | `>=22.23.4`. npm warns if your Node is older.                                                                                                                           |
| `scripts`          | See [chapter 1 §1.4](./01-getting-started.md#14-every-npm-run-script).                                                                                                  |
| `lint-staged`      | Files matching `*.{astro,ts,js,mjs,json,md,mdx,css}` are run through `prettier --write` before each commit.                                                             |
| `overrides`        | Forces `postcss-selector-parser@^7.2.1` (security advisory GHSA-rj75-hqrm-r3gf) because `@tailwindcss/typography` pins an older one. Remove it when typography updates. |

### Dependencies — what each one is for

| Package                                                              | Kind    | Purpose                                                                                                               |
| -------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `astro`                                                              | runtime | The framework: routing, `.astro` components, content collections, image pipeline.                                     |
| `@astrojs/mdx`                                                       | runtime | Lets content files be `.mdx` (Markdown + components).                                                                 |
| `@astrojs/sitemap`                                                   | runtime | Generates `sitemap-index.xml` and `sitemap-0.xml` at build time.                                                      |
| `@astrojs/rss`                                                       | runtime | Builds `rss.xml` in `src/pages/rss.xml.ts`.                                                                           |
| `@astrojs/markdown-satteri`                                          | runtime | Listed in `package.json` but **not referenced** in `astro.config.mjs`. Ask the lead before relying on or removing it. |
| `tailwindcss`, `@tailwindcss/vite`                                   | runtime | Tailwind CSS v4 and its Vite plugin (registered in `astro.config.mjs`).                                               |
| `@tailwindcss/typography`                                            | runtime | The `prose` classes used for rendered Markdown (service and blog bodies).                                             |
| `@astrojs/check`, `typescript`                                       | dev     | `astro check`: type-checks `.astro` and `.ts` files.                                                                  |
| `@types/node`                                                        | dev     | Types for `process`, `node:fs`, etc. (used in config, integrations, robots.txt).                                      |
| `prettier` + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` | dev     | Formatting, including `.astro` files and Tailwind class sorting.                                                      |
| `husky`                                                              | dev     | Installs the Git hooks in `.husky/`.                                                                                  |
| `lint-staged`                                                        | dev     | Runs Prettier only on staged files during `pre-commit`.                                                               |
| `@commitlint/cli` + `@commitlint/config-conventional`                | dev     | Validates commit messages.                                                                                            |

Lighthouse CI is **not** a dependency. It runs through `npx -y @lhci/cli@0.15.1`, pinned so scores do not drift
between runs.

## 2.3 `package-lock.json`

Records the exact version of every installed package (including sub-dependencies). `npm ci` (used in CI) installs
**only** what this file says and fails if it disagrees with `package.json`.

- Commit it whenever you add, remove or upgrade a dependency.
- Never edit it by hand.
- If CI fails with `Missing: … from lock file`, regenerate it with `npm install` (on Linux/WSL/Codespaces if the
  problem is platform-specific) and commit the result.

## 2.4 `.nvmrc`

```
22
```

One line: the Node major version. `nvm use` reads it locally, and CI reads it through
`actions/setup-node` → `node-version-file: .nvmrc`, so your machine and CI run the same Node.

## 2.5 `.prettierrc`

```json
{
  "printWidth": 110,
  "singleQuote": true,
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

| Option                        | Effect                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `printWidth: 110`             | Lines wrap at 110 characters (wider than the default 80, comfortable for Tailwind classes). |
| `singleQuote: true`           | `'single'` quotes in JS/TS.                                                                 |
| `prettier-plugin-astro`       | Teaches Prettier the `.astro` syntax (frontmatter + template).                              |
| `prettier-plugin-tailwindcss` | **Sorts Tailwind classes** into the official order. Do not fight it.                        |
| `overrides` for `*.astro`     | Forces the Astro parser for `.astro` files.                                                 |

Turn on "Format on save" in VS Code with Prettier as the formatter, and you will never see a formatting failure.

## 2.6 `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strictest",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "types": ["node"],
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@layouts/*": ["./src/layouts/*"],
      "@styles/*": ["./src/styles/*"],
      "@config/*": ["./src/config/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

- **`strictest`** is Astro's strictest preset. Notable consequences you will hit:
  - `exactOptionalPropertyTypes`: an optional prop typed `foo?: string` cannot receive `undefined` explicitly.
    That is why many props in this codebase are typed `foo?: string | undefined`.
  - `noUnusedLocals` / `noUnusedParameters`: an unused import is an error, not a warning.
  - `noUncheckedIndexedAccess`: `array[0]` has type `T | undefined`.
- **`types: ["node"]`** — TypeScript 6 no longer auto-loads `@types/*`, so Node's types are listed explicitly.
  Without it, `process` in `astro.config.mjs` is an error.
- **`.astro/types.d.ts`** is generated by `astro sync`/`astro dev` and contains the types of your content
  collections (`CollectionEntry<'blog'>` etc.).
- **Path aliases** — always import with them, never with long relative paths:

  ```ts
  import { site } from '@config/site'; // ✓
  import { site } from '../../config/site'; // ✗
  ```

  Note: there is no `@content/*` or `@pages/*` alias on purpose. Content is read through `@lib/content`, and
  pages are never imported.

## 2.7 `.gitignore`

Ignores build output (`dist/`), generated types (`.astro/`), `node_modules/`, logs, every `.env*` except
`.env.example`, `.DS_Store`, `.idea/` and `.lighthouseci/`.

## 2.8 `.env.example`

The template for `.env`. It documents `SITE_URL`. When you introduce a new environment variable, add it here with
a comment, and document it in chapter 1 §1.3 and in `README.md`.

## 2.9 `.vscode/`

| File              | Purpose                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `extensions.json` | Recommends `astro-build.astro-vscode` (syntax, IntelliSense and type errors in `.astro`). |
| `launch.json`     | A "Development server" launch configuration (Run & Debug panel) that runs `astro dev`.    |

## 2.10 Git hooks (`.husky/`)

Husky installs these into `.git/hooks` during `npm install`. They run automatically.

| Hook                | Command                            | What it protects                                                                              |
| ------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `.husky/pre-commit` | `npx lint-staged`                  | Formats the staged files with Prettier and re-stages them. You never commit unformatted code. |
| `.husky/commit-msg` | `npx --no -- commitlint --edit $1` | Rejects commit messages that are not Conventional Commits (see §2.11).                        |
| `.husky/pre-push`   | `npm run check`                    | Blocks a push that breaks architecture rules or types.                                        |

When `lint-staged` runs, it first backs up your working state, formats, re-stages, and cleans up. If anything
fails, your original state is restored. In CI, hooks are disabled with `HUSKY: 0`.

> Do **not** bypass hooks with `--no-verify`. If a hook fails, fix the cause. CI runs the same checks and will
> fail anyway.

## 2.11 `commitlint.config.js`

```js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'content', 'style', 'refactor', 'perf', 'docs', 'chore', 'ci', 'test'],
    ],
  },
};
```

Commit messages must look like `type(optional-scope): subject`. The allowed types are the ten above (note the
project-specific **`content`** type for Markdown-only changes). From `config-conventional` you also inherit,
among others:

- **`header-max-length: 100`** — the first line must be ≤ 100 characters.
- `subject-case` — do not start the subject with a capital letter as in a sentence ("Add…" fails; "add…" passes).
- `subject-empty`, `type-empty` — both must be present.

Examples and the full workflow are in [chapter 9](./09-git-workflow.md).

## 2.12 CI — `.github/workflows/ci.yml`

```yaml
on:
  pull_request:
  push:
    branches: [master]
```

Runs on **every pull request** and on **every push to `master`**. One job, `verify`, on `ubuntu-latest`:

| Step                                    | What it does                                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `actions/checkout@v4`                   | Clones the repository.                                                                         |
| `actions/setup-node@v4`                 | Installs the Node version from `.nvmrc`, with an npm cache for speed.                          |
| `npm ci`                                | Clean install of the exact versions in `package-lock.json`.                                    |
| `npm run lint:format`                   | Fails if any file is not Prettier-formatted.                                                   |
| `npm run build`                         | Boundaries → `astro check` → `astro build` → **seo-guard**. Any failure stops the pipeline.    |
| `npm run lighthouse`                    | Lighthouse budgets against `dist/` (see chapter 3 §3.5).                                       |
| `actions/upload-artifact@v4` (`always`) | Uploads `.lighthouseci/` as the **`lighthouse-reports`** artifact, even when Lighthouse fails. |

Job-level environment variables:

| Variable                                  | Why                                                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL=https://samyuktatechnology.com` | Canonicals and sitemap in the test build point at the real domain.                                                   |
| `DEPLOY_ENV=production`                   | Lighthouse's SEO audit fails on `Disallow: /`, so CI builds as production. **This build is tested, never deployed.** |
| `HUSKY=0`                                 | The `prepare` script would try to install Git hooks on the CI machine; this skips it.                                |

**When CI is red:** open the run on GitHub, find the first failing step, read its log. For Lighthouse failures,
download the `lighthouse-reports` artifact and open the HTML report for the failing URL.

> **Branch name check:** CI listens to pushes on `master`. If the repository's default branch is renamed to
> `main`, update `branches: [master]` in the same pull request.

Next: [3. Astro config, integrations & guards →](./03-astro-config.md)
