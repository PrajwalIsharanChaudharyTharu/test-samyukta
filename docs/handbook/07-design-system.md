# 7. Design system & UI rules

[← Handbook index](./README.md)

How the site looks is decided in **one file** (`src/styles/global.css`) and expressed through a handful of
components. This chapter covers the tokens, how Tailwind v4 is set up, component conventions, accessibility
rules, and the design direction we are moving towards.

---

## 7.1 Tailwind CSS v4 in this project

- Tailwind runs as a **Vite plugin** (`@tailwindcss/vite` in `astro.config.mjs`). There is **no
  `tailwind.config.js`**. Configuration is CSS: `@theme { … }` in `global.css`.
- `@plugin '@tailwindcss/typography'` provides the `prose` classes for rendered Markdown.
- `prettier-plugin-tailwindcss` sorts class names automatically. Let it.
- **The default palette is disabled** (`--color-*: initial`). Only our tokens exist as colours. `text-gray-500`
  fails the build with `Cannot apply unknown utility class`.

### v4 syntax you will see

| Syntax                         | Meaning                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `rounded-(--radius-card)`      | Use a CSS variable as the value (v4 shorthand for `rounded-[var(--radius-card)]`). |
| `max-w-(--container-content)`  | Same, for the content width.                                                       |
| `bg-linear-to-b`               | v4 name for linear gradients (was `bg-gradient-to-b`).                             |
| `aria-[current=page]:text-…`   | Style based on an ARIA attribute.                                                  |
| `after:absolute after:inset-0` | Pseudo-element utilities (used for "whole card is a link").                        |
| `text-balance`, `text-pretty`  | Better line breaking for headings and paragraphs.                                  |

## 7.2 Tokens

```css
@theme {
  --color-*: initial;
  --color-white: #fff;
  --color-black: #000;

  /* Brand scale (primitive colours) */
  --color-brand-50: #ecfdf5;
  --color-brand-100: #d1fae5;
  --color-brand-500: #10b981;
  --color-brand-600: #079669; /* the brand green used on samyuktatechnology.com */
  --color-brand-700: #047857;
  --color-brand-900: #064e3b;

  /* Semantic tokens (what the colour is FOR) */
  --color-ink: #0f172a; /* headings, body text */
  --color-muted: #64748b; /* secondary text */
  --color-surface: #f8fafc; /* light section background */
  --color-line: #e2e8f0; /* borders, dividers */

  --font-sans: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, …;
  --radius-card: 1rem;
  --container-content: 72rem;
}
```

Two kinds of colour token:

- **Primitive** (`brand-50 … brand-900`) — the raw scale.
- **Semantic** (`ink`, `muted`, `surface`, `line`) — named by purpose. **Prefer semantic tokens in components.**
  If the brand changes, only the token values change.

> **Font note:** `--font-sans` lists Inter first, but no Inter font file is loaded in the project, so visitors see
> their system UI font. If the design calls for Inter, self-host it (e.g. via `@fontsource-variable/inter`) and
> check the performance budget.

### Adding a token

1. Add it to `@theme` in `global.css` with a comment saying what it is for.
2. Use the generated utility (`--color-accent` → `bg-accent`, `text-accent`).
3. Lead/designer review — tokens are the design system's public API.

Never use arbitrary values for design decisions (`bg-[#079669]`, `p-[13px]`, `rounded-[7px]`). If you need a value
that does not exist, that is a design conversation, not a workaround.

## 7.3 Colour contrast (accessibility)

WCAG AA requires **4.5:1** for normal text and **3:1** for large text (≥ 24 px, or ≥ 18.7 px bold). Measured
ratios for our tokens:

| Foreground → background         | Ratio   | Normal text | Large text |
| ------------------------------- | ------- | ----------- | ---------- |
| `ink` on `white`                | ≈ 17:1  | ✓           | ✓          |
| `muted` on `white`              | ≈ 4.8:1 | ✓           | ✓          |
| `muted` on `surface`            | ≈ 4.6:1 | ✓ (barely)  | ✓          |
| `brand-700` on `white`          | ≈ 5.5:1 | ✓           | ✓          |
| **`brand-600` on `white`**      | ≈ 3.8:1 | **✗**       | ✓          |
| `white` on `brand-600` (button) | ≈ 3.8:1 | **✗**       | ✓          |
| `white` on `brand-700`          | ≈ 5.5:1 | ✓           | ✓          |

**Rule:** green **text** and green **buttons with small white text** use `brand-700` or darker. `brand-600` is for
large text, icons, borders and focus rings. Several components still use `brand-600` for small text — see
[chapter 10](./10-troubleshooting.md#102-known-gaps-in-the-codebase).

## 7.4 Component conventions

- **Props are typed** with an `interface Props` in the frontmatter. Optional props in strictest mode:
  `foo?: string | undefined` if callers may pass `undefined`.
- **Accept a `class` prop** on layout-ish components and merge with `cx()`:
  ```astro
  ---
  import { cx } from '@lib/utils';
  const { class: className, ...rest } = Astro.props;
  ---

  <div class={cx('base classes', className)} {...rest}>
    <slot />
  </div>
  ```
- **Polymorphic elements** via an `as` prop (`Container`) or `headingLevel` (`ServiceCard`, `PostCard`):
  ```astro
  const { headingLevel: Heading = 'h3' } = Astro.props;
  <Heading class="text-lg font-semibold">…</Heading>
  ```
- **Links vs buttons:** `Button` renders `<a>` if it has `href`, `<button>` otherwise. A button that navigates
  must have an `href`. A `<button>` with no `href` and no handler does nothing — don't ship one.
- **Whole-card links:** put the real link on the title and stretch it with `after:absolute after:inset-0` on a
  `relative` card. Don't wrap the whole card in `<a>` (screen readers read everything as one link).
- **Comments in `.astro` templates:** use `{/* … */}`. `<!-- … -->` is shipped to every visitor's browser.
- **Astro 7 whitespace:** put mixed text and expressions in one template string:
  ``{`© ${year} ${site.legalName}`}`` instead of `© {year} {site.legalName}`.
- **No content fetching in components.** Pages fetch via `@lib/content` and pass data down as props.

### Where a new component goes

| It is…                                                    | Folder                 | Example                          |
| --------------------------------------------------------- | ---------------------- | -------------------------------- |
| Generic, no knowledge of our content                      | `components/ui/`       | `Input`, `Tag`, `Icon`           |
| Composed from primitives, knows a content type or section | `components/sections/` | `ProjectCard`, `FaqList`, `Hero` |
| Part of every page's frame                                | `components/layout/`   | `Header`, `Footer`, `Container`  |
| Only for `<head>`                                         | `components/seo/`      | `SEO`, `JsonLd`                  |

## 7.5 Accessibility rules (built in — keep them)

- **Skip link** to `#main` is the first focusable element (BaseLayout).
- **Visible focus** — `:focus-visible` ring in `global.css`. Never remove outlines.
- **Landmarks:** one `<header>`, `<main id="main">`, `<footer>`; every `<nav>` has an `aria-label`
  (`Main`, `Breadcrumb`, `On this page`, footer group names).
- **Current page:** `aria-current="page"` on the active nav link and the last breadcrumb.
- **Reduced motion:** `prefers-reduced-motion` disables animations and smooth scroll.
- **Decorative bits** (separators, arrows) get `aria-hidden="true"`.
- **Images:** meaningful `alt`; decorative `alt=""`.
- **Forms (when added):** every input has a visible `<label>`; constraints are visible and linked with
  `aria-describedby`.

## 7.6 Design direction — the house rules we are moving towards

The current UI is a clean starter. When you design new sections or restyle existing ones, follow these house rules
(adapted from the project's frontend design guidelines). They exist because the "average" AI-or-template page —
centred headline, little label above it, a row of identical icon cards, a soft gradient — looks like every other
site and says nothing specific about Samyukta.

| Do                                                                                 | Instead of                                                                  |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Headlines that fit in **two lines or fewer** at every width; cut words first.      | Long, four-line headlines.                                                  |
| A clear title in the page's one `<h1>`, and a heading on every section.            | Sections without headings.                                                  |
| Put the information in the heading or first sentence.                              | **Eyebrows** — small uppercase labels above headings ("What we do").        |
| Flat colour fields, real photographs or real UI screenshots.                       | **Gradients** as backgrounds, on buttons or text.                           |
| Separate surfaces with a step in tone (`white` → `surface`).                       | Hairline borders around everything; shadows on things at rest.              |
| Shadows only on what truly floats (menus, dialogs).                                | Hover shadows on every card.                                                |
| A plain header bar: wordmark, 3–5 links, one action.                               | Glassy blurred bars (`backdrop-blur`), floating pill navigation.            |
| Show real work: client project screenshots, real interface fragments, team photos. | Stock illustrations, emoji, icon-in-a-tinted-square cards, fake dashboards. |
| Vary the composition from section to section.                                      | The same three-card grid in every section.                                  |
| Order by position and size; a real `<ol>` when order matters.                      | Decorative "01 / 02 / 03" numbering.                                        |
| Sentence case at a readable size.                                                  | Tiny uppercase letter-spaced labels.                                        |
| One typeface (two at most), two or three sizes doing the visible work.             | Many sizes and families.                                                    |
| One ground, one ink, one accent; the accent on the primary action.                 | Accent colour everywhere.                                                   |
| Running text in full `ink` at 16 px+; `muted` for secondary notes only.            | Body text in light grey.                                                    |
| Proof that is real: named clients and projects the company actually delivered.     | Invented testimonials, logos or statistics.                                 |

**Where the current code differs from these rules** (change them in a dedicated design PR, with the lead):
the home hero uses a gradient (`bg-linear-to-b from-brand-50`), `SectionHeading` supports an `eyebrow`, the
header uses `bg-white/90 backdrop-blur`, and `ServiceCard` adds `hover:shadow-lg`.

### Use the subject

The strongest material Samyukta has is its own: real projects (Medmax E-commerce, Khatamandu, MTEF-MIS, Alpine
Voyagers, Texas Yeti Homes), the services it actually sells (MVPs, DevOps, QA, UI/UX, websites), its place
(Lalitpur), and its brand green. Build sections from those — a project's real interface cropped large beats any
icon grid.

## 7.7 Responsive rules

- Mobile first: unprefixed classes are for phones; `md:` (≥ 768 px) and `lg:` (≥ 1024 px) add up.
- Use `Container` for consistent side margins (`px-5`, `md:px-8`) and max width.
- Grids collapse to one column on phones: `grid gap-6 md:grid-cols-2 lg:grid-cols-3`.
- Test at 390 px, 768 px and 1440 px before opening a PR.

Next: [8. Recipes — step-by-step workflows →](./08-recipes.md)
