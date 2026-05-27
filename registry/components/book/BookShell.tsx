// BookShell is a Server Component. It only renders TOC-derived nav
// links and breadcrumb text — no client state. Keeping it server-side
// matters because Next forbids passing function props (like
// `findArticle`) across the server→client boundary unless they're
// marked as server actions, and `findArticle` is plain sync TOC code.

import * as React from 'react';
import Link from 'next/link';
import type { Article, Book, ArticleLookup } from '@/viz/utils/book-types';

/* ----------------------------------------------------------------------
 * BookShell — wraps a single article inside a multi-chapter book's
 * binder chrome. Use for long-form structured projects (a 15-chapter
 * book, a multi-part report) where each article is its own MDX file
 * and the reader benefits from prev/next nav + a TOC home page.
 *
 * For single-article projects, use ArticleShell from the
 * gss-article skill's references/ folder instead — it has no TOC,
 * no breadcrumb, no prev/next.
 *
 * Layout:
 *   - Slim top header with book title (linked to home) + subtitle.
 *   - Breadcrumb showing this article's part / chapter context.
 *   - Constrained `prose` column for the article body. Figures break
 *     out wider via Figure / SmallMultiples per the article-shell
 *     contract.
 *   - Footer with prev/next article navigation.
 *
 * Style isolation: the shell uses design tokens from the registry's
 * theme (bg-surface, text-body, border-border). When this app folds
 * into a larger host, host styles can land in a separate cascade
 * layer (e.g. `@layer site, book` in globals.css) so they don't fight
 * book-specific rules.
 * ---------------------------------------------------------------------- */

export interface BookShellProps {
  /** Slug of the current article. Looked up against `book` to find part/chapter context. */
  slug: string;
  /**
   * The book's TOC. Pass the `book` constant from your local
   * `book-toc.ts`; the registry template ships with placeholder
   * content the consumer customizes.
   */
  book: Book;
  /**
   * Resolver returning `{ article, prev, next }` for a slug. Pass
   * the `findArticle` function from your local `book-toc.ts`.
   * Decoupling this lets the consumer keep their TOC wherever they
   * want without the shell needing to know the file path.
   */
  findArticle: (slug: string) => ArticleLookup;
  children: React.ReactNode;
}

export function BookShell({ slug, book, findArticle, children }: BookShellProps) {
  const found = findArticle(slug);
  if (!found) {
    throw new Error(`BookShell: no article found for slug "${slug}"`);
  }
  const { article, prev, next } = found;

  // Find this article's part + chapter for the breadcrumb.
  const part = book.parts.find(p =>
    p.chapters.some(c => c.articles.some(a => a.slug === slug))
  );
  const chapter = part?.chapters.find(c => c.articles.some(a => a.slug === slug));

  return (
    <div className="min-h-screen bg-surface text-body">
      <BookHeader title={book.title} subtitle={book.subtitle} />

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-3xl px-6 pt-8 text-sm text-muted">
        <Link href="/" className="hover:text-link">
          {book.title}
        </Link>
        {part && (
          <>
            <span className="mx-2 text-subtle">/</span>
            <span>Part {part.numeral}: {part.title}</span>
          </>
        )}
        {chapter && (
          <>
            <span className="mx-2 text-subtle">/</span>
            <span>Chapter {chapter.number}</span>
          </>
        )}
      </nav>

      {/* Article body (prose column; figures handle their own breakout) */}
      <article className="mx-auto max-w-3xl px-6 py-10 prose prose-neutral">
        <header className="mb-10 not-prose">
          <p className="text-xs uppercase tracking-wider text-muted">
            §{article.number}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-body sm:text-4xl">
            {article.title}
          </h1>
        </header>
        {children}
      </article>

      <BookFooter prev={prev} next={next} />
    </div>
  );
}

function BookHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-body hover:text-link">
          {title}
        </Link>
        <span className="text-xs text-muted">{subtitle}</span>
      </div>
    </header>
  );
}

function BookFooter({ prev, next }: { prev: Article | null; next: Article | null }) {
  return (
    <footer className="border-t border-border bg-card">
      <nav className="mx-auto flex max-w-3xl items-stretch gap-4 px-6 py-8">
        <div className="flex-1">
          {prev && (
            <Link
              href={`/articles/${prev.slug}`}
              className="block rounded-md border border-border p-4 hover:border-border-strong"
            >
              <p className="text-xs uppercase tracking-wider text-muted">
                ← Previous
              </p>
              <p className="mt-1 text-sm font-medium text-body">
                §{prev.number} {prev.title}
              </p>
            </Link>
          )}
        </div>
        <div className="flex-1">
          {next && (
            <Link
              href={`/articles/${next.slug}`}
              className="block rounded-md border border-border p-4 text-right hover:border-border-strong"
            >
              <p className="text-xs uppercase tracking-wider text-muted">
                Next →
              </p>
              <p className="mt-1 text-sm font-medium text-body">
                §{next.number} {next.title}
              </p>
            </Link>
          )}
        </div>
      </nav>
    </footer>
  );
}
