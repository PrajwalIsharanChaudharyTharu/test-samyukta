# 9. Git workflow & code review

[← Handbook index](./README.md)

---

## 9.1 Branches

- `master` is the protected main branch. CI runs on every push to it and on every pull request.
- Never commit directly to `master`. Create a branch per task:

| Prefix     | For                   | Example                       |
| ---------- | --------------------- | ----------------------------- |
| `feat/`    | New feature or page   | `feat/contact-page`           |
| `fix/`     | Bug fix               | `fix/mobile-menu-links`       |
| `content/` | Markdown-only changes | `content/devops-service`      |
| `style/`   | Visual/design changes | `style/hero-without-gradient` |
| `docs/`    | Handbook / README     | `docs/handbook-recipes`       |
| `chore/`   | Dependencies, config  | `chore/update-astro`          |

```bash
git checkout master
git pull
git checkout -b feat/contact-page
```

## 9.2 Commit messages (Conventional Commits)

Format: **`type(scope): subject`**, checked by commitlint on every commit.

| Type       | Use for                                      | Example                                                |
| ---------- | -------------------------------------------- | ------------------------------------------------------ |
| `feat`     | New functionality, page or component         | `feat(pages): add contact page`                        |
| `fix`      | Bug fix                                      | `fix(header): link mobile menu items`                  |
| `content`  | Markdown content (posts, services, projects) | `content(blog): add core web vitals post`              |
| `style`    | Visual changes, no behaviour change          | `style(home): replace hero gradient with flat surface` |
| `refactor` | Code change with no behaviour change         | `refactor(lib): extract tag grouping`                  |
| `perf`     | Performance improvement                      | `perf(images): lazy-load related post covers`          |
| `docs`     | Documentation                                | `docs(handbook): add projects recipe`                  |
| `chore`    | Tooling, dependencies                        | `chore(deps): update astro to 7.5`                     |
| `ci`       | CI configuration                             | `ci: upload lighthouse reports on failure`             |
| `test`     | Tests                                        | `test(seo): cover resolveSeo canonical`                |

Rules that commitlint enforces:

- **Header ≤ 100 characters.** Aim for ≤ 72. Put details in the body:
  ```bash
  git commit -m "feat(schema): add JSON-LD schema builders" \
             -m "Adds Organization, WebSite, BreadcrumbList, Service and BlogPosting builders."
  ```
- Lower-case subject start (`add…`, not `Add…`), no trailing full stop, a type and a subject are required.

Common failure:

```
✖   header must not be longer than 100 characters, current length is 106 [header-max-length]
husky - commit-msg script failed (code 1)
```

Nothing was committed; your files are still staged. Re-run `git commit` with a shorter header.

## 9.3 Before you push

The `pre-push` hook runs `npm run check` for you. Also run `npm run build` once — the hook does not run seo-guard,
CI does.

## 9.4 Pull requests

1. Push: `git push -u origin feat/contact-page`.
2. Open a PR into `master`. Fill in:
   - **What** changed and **why**.
   - **Screenshots** at phone and desktop width for any visual change.
   - **How you tested** (`npm run build` passed; pages you clicked through).
   - Any content facts that need confirmation (prices, client names, claims).
3. Wait for CI to be green. If Lighthouse fails, download the `lighthouse-reports` artifact.
4. Address review comments with new commits (don't force-push during review unless asked).
5. The reviewer merges.

## 9.5 What reviewers check

| Area          | Questions                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture  | Imports flow one way? Content read via `@lib/content`? URLs via `routes.*`? Facts via `site.*`?                                                                     |
| Ownership     | Did the PR touch Lead files (`content.config.ts`, `lib/`, `layouts/`, `routes.ts`, `site.ts`, `global.css`, `integrations/`, `scripts/`)? Then a lead must approve. |
| SEO           | Unique title/description within limits? One `<h1>`? Breadcrumbs? `noindex` where appropriate?                                                                       |
| Accessibility | Heading order, alt text, labels, focus visible, contrast (no small text in `brand-600`)?                                                                            |
| Design        | Tokens only? Follows chapter 7 house rules? Works at 390 / 768 / 1440 px?                                                                                           |
| Content       | Every fact true and confirmed? No invented testimonials, numbers or promises?                                                                                       |
| Hygiene       | No `<!-- -->` comments in templates, no unused imports, no leftover commented-out code without a reason?                                                            |
| Docs          | If behaviour changed, is this handbook updated?                                                                                                                     |

## 9.6 Golden rules

- Small PRs. One concern per PR.
- Never use `--no-verify`.
- Never commit `.env`, secrets, `dist/` or `node_modules/`.
- Commit `package-lock.json` with any dependency change.
- If you are unsure whether a change is "Lead" territory, ask before you start.

Next: [10. Troubleshooting & known gaps →](./10-troubleshooting.md)
