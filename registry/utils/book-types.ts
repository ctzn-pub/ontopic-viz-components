// Shared types for the `book/` component family (BookShell, BookHome,
// book-toc template). These describe the table-of-contents shape that
// BookShell consumes via its `book` and `findArticle` props.
//
// Keep this file types-only — the actual content (the `book` constant,
// `findArticle` implementation) lives in the consumer's app, copied
// from `registry/components/book/book-toc.ts` as a starting template.

export type ArticleStatus = 'published' | 'draft' | 'planned';

export type Article = {
  /** Folder name under app/articles/. Becomes the URL segment. */
  slug: string;
  /** Display label, e.g. "2.2" or "8". */
  number: string;
  /** Article title shown in the TOC and in the article header. */
  title: string;
  /** Controls whether the home page links to this article. */
  status: ArticleStatus;
};

export type Chapter = {
  /** Chapter number (1-indexed within the book, not within the part). */
  number: number;
  /** Chapter title shown in the TOC. */
  title: string;
  /**
   * If `articles` has length 1, this chapter is one article. Otherwise
   * the chapter is a group of sub-section articles.
   */
  articles: Article[];
};

export type Part = {
  /** Part numeral, e.g. "I", "II". Used in breadcrumbs and TOC. */
  numeral: string;
  /** Part title shown in the TOC. */
  title: string;
  chapters: Chapter[];
};

export type Book = {
  title: string;
  subtitle: string;
  parts: Part[];
};

/** Return shape of `findArticle(slug)` from a TOC. */
export type ArticleLookup = {
  article: Article;
  prev: Article | null;
  next: Article | null;
} | null;
