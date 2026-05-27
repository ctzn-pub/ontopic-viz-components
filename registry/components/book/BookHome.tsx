// BookHome is a Server Component. It renders the TOC tree and a
// kicker/title/subtitle hero — no client state, no event handlers.
// Server-side rendering is faster, cheaper, and avoids the prop-
// boundary hassles BookShell hit when receiving a `findArticle`
// function across server→client.

import * as React from 'react';
import Link from 'next/link';
import type { Book } from '@/viz/utils/book-types';

/* ----------------------------------------------------------------------
 * BookHome — the table-of-contents landing page for a multi-chapter
 * book. Renders a tinted hero with the book title + subtitle, then a
 * nested Part → Chapter → Article tree. Each `published` article links
 * to /articles/<slug>; `draft` and `planned` articles render unlinked
 * with a status badge.
 *
 * Use as the default export of `app/page.tsx` in a consumer app:
 *
 *   import { book } from './components/book-toc';
 *   import { BookHome } from '@/viz/components/book/BookHome';
 *
 *   export default function Home() {
 *     return <BookHome book={book} />;
 *   }
 *
 * Styling matches BookShell — same design tokens (bg-surface, text-body,
 * etc.). Customize `attribution` to set the footer line; pass `null` to
 * suppress the footer entirely.
 * ---------------------------------------------------------------------- */

export interface BookHomeProps {
  /** The book's TOC. Pass `book` from your local `book-toc.ts`. */
  book: Book;
  /**
   * Optional kicker line above the title. Default: "A data-driven
   * analysis using the General Social Survey". Pass null to hide.
   */
  kicker?: string | null;
  /**
   * Optional footer attribution. Pass a string, a React node, or
   * null to hide the footer entirely.
   */
  attribution?: React.ReactNode | null;
}

const DEFAULT_KICKER = 'A data-driven analysis using the General Social Survey';

const DEFAULT_ATTRIBUTION: React.ReactNode = (
  <>
    Generated with{' '}
    <code className="rounded bg-surface px-1 py-0.5 text-[11px]">gss-article</code>,{' '}
    <code className="rounded bg-surface px-1 py-0.5 text-[11px]">gss-charts</code>
    , and{' '}
    <code className="rounded bg-surface px-1 py-0.5 text-[11px]">gss-literature</code>.
  </>
);

export function BookHome({ book, kicker = DEFAULT_KICKER, attribution = DEFAULT_ATTRIBUTION }: BookHomeProps) {
  return (
    <div className="min-h-screen bg-surface text-body">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-12">
          {kicker !== null && (
            <p className="text-xs uppercase tracking-wider text-muted">
              {kicker}
            </p>
          )}
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-body sm:text-5xl">
            {book.title}
          </h1>
          <p className="mt-3 text-lg text-subtle">{book.subtitle}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Contents
        </h2>

        <ol className="mt-6 space-y-10">
          {book.parts.map(part => (
            <li key={part.numeral}>
              <p className="text-xs uppercase tracking-wider text-muted">
                Part {part.numeral}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-body">
                {part.title}
              </h3>

              <ol className="mt-4 space-y-6">
                {part.chapters.map(chapter => (
                  <li key={chapter.number}>
                    <p className="text-sm font-medium text-body">
                      Chapter {chapter.number}. {chapter.title}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {chapter.articles.map(article => (
                        <li key={article.slug} className="flex items-baseline gap-3">
                          <span className="w-10 shrink-0 text-xs tabular-nums text-muted">
                            §{article.number}
                          </span>
                          {article.status === 'published' ? (
                            <Link
                              href={`/articles/${article.slug}`}
                              className="text-sm text-link hover:text-link-hover"
                            >
                              {article.title}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted">
                              {article.title}{' '}
                              <span className="ml-1 rounded bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-subtle">
                                {article.status}
                              </span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </main>

      {attribution !== null && (
        <footer className="border-t border-border bg-card">
          <div className="mx-auto max-w-3xl px-6 py-8 text-xs text-muted">
            {attribution}
          </div>
        </footer>
      )}
    </div>
  );
}

export default BookHome;
