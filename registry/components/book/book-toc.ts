// Book table of contents — the binder's source of truth for navigation.
//
// This file is a TEMPLATE. After `viz add book/book-toc`, edit the
// `book` constant below to match your book's structure (parts,
// chapters, articles, slugs, statuses). The TYPES live in
// @/viz/utils/book-types and shouldn't be modified; the `findArticle`
// helper at the bottom is generic and shouldn't either.
//
// Conventions:
//   - Two-level depth: parts contain chapters contain articles.
//   - Single-article chapter = one MDX file. Multi-article chapter
//     = the chapter is split into sub-section articles, each its own
//     MDX file at app/articles/<slug>/article.mdx.
//   - `slug` matches the folder name under app/articles/.
//   - `number` is the display label (e.g. "2.2", or "8" for a single-
//     article chapter).
//   - `status: 'published'` makes the home page link to the article;
//     'draft' / 'planned' keep it visible but unlinked.

import type { Article, Book } from '@/viz/utils/book-types';

// ---- TEMPLATE: replace with your book's structure ----------------

export const book: Book = {
  title: 'My Book Title',
  subtitle: 'Subtitle goes here',
  parts: [
    {
      numeral: 'I',
      title: 'Part Title',
      chapters: [
        {
          number: 1,
          title: 'Chapter Title',
          articles: [
            {
              slug: 'ch01-introduction',
              number: '1',
              title: 'Introduction',
              status: 'planned',
            },
          ],
        },
      ],
    },
  ],
};

// ---- Generic helpers (don't edit) --------------------------------

/** Flat list of all articles in reading order. Used for prev/next nav. */
export const allArticles: Array<Article & { partNumeral: string; chapter: number }> =
  book.parts.flatMap(part =>
    part.chapters.flatMap(ch =>
      ch.articles.map(a => ({ ...a, partNumeral: part.numeral, chapter: ch.number }))
    )
  );

/**
 * Look up an article by slug; returns the article + its prev/next
 * neighbors in reading order. BookShell uses this for breadcrumb +
 * footer navigation.
 */
export function findArticle(slug: string) {
  const idx = allArticles.findIndex(a => a.slug === slug);
  if (idx === -1) return null;
  return {
    article: allArticles[idx],
    prev: idx > 0 ? allArticles[idx - 1] : null,
    next: idx < allArticles.length - 1 ? allArticles[idx + 1] : null,
  };
}
