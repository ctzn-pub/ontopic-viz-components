# book/ — multi-chapter book layout

Components for long-form structured projects (a 15-chapter book, a
multi-part report) where each article is its own MDX file and the
reader benefits from prev/next navigation plus a TOC home page.

For single-article projects, use **ArticleShell** from the
`gss-article` skill's references/ folder instead — it has no TOC,
no breadcrumb, no prev/next.

## What's here

| File | What it is | Editable? |
| --- | --- | --- |
| `BookShell.tsx` | Binder chrome wrapping one article (header, breadcrumb, prose body, prev/next footer). | No — generic. |
| `BookHome.tsx` | TOC landing page: hero + nested Part → Chapter → Article tree with status badges. | No — generic. |
| `book-toc.ts` | **Template.** Types-pluralized TOC plus the `findArticle` helper. | **Yes** — replace the `book` constant with your book's structure. |

The shared types live one level up at `registry/utils/book-types.ts`
(installed by the CLI as `viz/utils/book-types.ts`) — the CLI walks
that import automatically when you `viz add book/BookShell`.

## Install

```bash
viz add book/BookShell      # → viz/components/book/BookShell.tsx
viz add book/BookHome       # → viz/components/book/BookHome.tsx
viz add book/book-toc       # → viz/components/book/book-toc.ts (template)
```

The CLI also drops the shared types at `viz/utils/book-types.ts` (and
fetches `next` as an npm dep — for the `<Link>` import).

After install, **edit `viz/components/book/book-toc.ts`** to set your
book's title, subtitle, parts, chapters, and article slugs. The types
and `findArticle` helper are generic — leave them alone. The `book`
constant at the top is content you own.

## Wire it into the consumer app

A typical book consumer has three Next 15 routes:

### 1. `app/page.tsx` — TOC home

```tsx
import { book } from '@/viz/components/book/book-toc';
import { BookHome } from '@/viz/components/book/BookHome';

export default function Home() {
  return <BookHome book={book} />;
}
```

`BookHome` accepts optional `kicker` and `attribution` props if you
want to override the defaults (kicker: "A data-driven analysis using
the General Social Survey"; attribution: a small "Generated with…"
footer). Pass `null` to either to hide it.

### 2. `app/articles/<slug>/page.tsx` — per-article wrapper

```tsx
import { book, findArticle } from '@/viz/components/book/book-toc';
import { BookShell } from '@/viz/components/book/BookShell';
import Article, { metadata as articleMetadata } from './article.mdx';

export const metadata = {
  title: `${articleMetadata.title} — ${book.title}`,
  description: articleMetadata.deck,
};

export default function Page() {
  return (
    <BookShell slug="ch01-introduction" book={book} findArticle={findArticle}>
      <Article />
    </BookShell>
  );
}
```

The `slug` prop must match the folder name under `app/articles/` AND
the `slug` field of one of your TOC entries. `BookShell` looks up
part/chapter context from the TOC and renders the breadcrumb +
prev/next links.

### 3. `app/articles/<slug>/article.mdx` — the article itself

Use the `article/` family of layout components (`Figure`, `Callout`,
`SmallMultiples`, `TabSet`, etc.) for in-article structure, and any
chart components (`recharts/gss/timeseries-line-v1`,
`recharts/gss/timeseries-index-v1`, `article/StaticChartV1`) for
figures.

## Style

`BookShell` and `BookHome` use the registry's design tokens
(`bg-surface`, `text-body`, `border-border`, `text-link`,
`text-muted`, `bg-card`, etc.) — make sure the `theme/` folder is
installed (see top-level README "Theme (separate flow)"). Without
the theme, classes will resolve to undefined CSS variables and the
shell will look unstyled.

## CSS layer isolation (optional)

If your book lives inside a larger host site, declare a cascade-
layer order in `app/globals.css` so the host's CSS lands in `site`
and yours in `book`:

```css
@layer site, book;
@import "../theme/theme.css";

@layer book {
  /* book-specific overrides go here */
}
```

The `BookShell` and `BookHome` components don't reference layer
names — they emit plain Tailwind classes. The layer wrapping is the
consumer's job, applied to whatever extra rules they add (figure
spacing, dropcap, recharts tooltip overrides, etc.).
