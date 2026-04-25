// Article-layout component library.
//
// MDX articles import these via:
//   import { Callout, TabSet, Tab, SmallMultiples, ... } from '@/app/components/article';
//
// See:
//   ./README.md                                                 — component API reference
//   ~/.claude/skills/gss-article/references/layouts.md          — when to use which
//   ~/.claude/skills/gss-charts/references/page-shell.md        — page shell + prose-leak rules

export { Callout } from './Callout';
export type { CalloutVariant, CalloutProps } from './Callout';

export { TabSet, Tab } from './TabSet';
export type { TabSetProps, TabProps } from './TabSet';

export { SmallMultiples, SmallMultiplesLegendItem } from './SmallMultiples';
export type { SmallMultiplesProps } from './SmallMultiples';

export { SideNote } from './SideNote';
export type { SideNoteProps } from './SideNote';

export { KeyNumber } from './KeyNumber';
export type { KeyNumberProps } from './KeyNumber';

export { DataTable, DeltaCell } from './DataTable';
export type { DataTableProps, DataTableColumn } from './DataTable';

export { Quote } from './Quote';
export type { QuoteProps } from './Quote';

export { PullQuote } from './PullQuote';
export type { PullQuoteProps } from './PullQuote';

export { DropCap } from './DropCap';
export type { DropCapProps } from './DropCap';

export { SectionDivider } from './SectionDivider';
export type { SectionDividerProps } from './SectionDivider';

export { Annotation } from './Annotation';
export type { AnnotationProps } from './Annotation';

export { Step } from './Step';
export type { StepProps } from './Step';

export { Figure } from './Figure';
export type { FigureProps, FigureWidth } from './Figure';
