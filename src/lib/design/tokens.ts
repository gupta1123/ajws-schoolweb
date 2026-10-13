// src/lib/design/tokens.ts
//
// Single source of truth for typography, spacing and semantic colors.
// Colors resolve to CSS variables in app/globals.css (--tone-*), so light/dark
// and the brand palette change in one place. Pages should compose these
// instead of hand-picking `text-blue-600`, `text-xl`, `p-6`, etc.

export const type = {
  pageTitle: 'text-xl font-semibold tracking-tight',
  pageSubtitle: 'text-sm text-muted-foreground',
  sectionTitle: 'text-sm font-semibold',
  body: 'text-sm',
  rowTitle: 'text-sm font-medium leading-tight',
  caption: 'text-xs text-muted-foreground',
  label: 'text-xs font-medium text-muted-foreground',
  stat: 'text-2xl font-semibold tabular-nums leading-none',
} as const;

export const space = {
  page: 'mx-auto w-full max-w-7xl space-y-5',
  grid: 'grid gap-4',
  panelHeader: 'flex items-center justify-between gap-3 px-4 py-3',
  panelBody: 'p-4',
  row: 'flex items-start gap-3 px-4 py-2.5',
} as const;

export const surface = {
  panel: 'rounded-lg border bg-card text-card-foreground',
  rowHover: 'transition-colors hover:bg-muted/50',
} as const;

export type Tone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'violet'
  | 'rose'
  | 'neutral';

export const toneClass: Record<Tone, { text: string; soft: string; chip: string }> = {
  primary: { text: 'text-tone-primary', soft: 'bg-tone-primary-soft', chip: 'bg-tone-primary-soft text-tone-primary' },
  success: { text: 'text-tone-success', soft: 'bg-tone-success-soft', chip: 'bg-tone-success-soft text-tone-success' },
  warning: { text: 'text-tone-warning', soft: 'bg-tone-warning-soft', chip: 'bg-tone-warning-soft text-tone-warning' },
  danger: { text: 'text-tone-danger', soft: 'bg-tone-danger-soft', chip: 'bg-tone-danger-soft text-tone-danger' },
  info: { text: 'text-tone-info', soft: 'bg-tone-info-soft', chip: 'bg-tone-info-soft text-tone-info' },
  violet: { text: 'text-tone-violet', soft: 'bg-tone-violet-soft', chip: 'bg-tone-violet-soft text-tone-violet' },
  rose: { text: 'text-tone-rose', soft: 'bg-tone-rose-soft', chip: 'bg-tone-rose-soft text-tone-rose' },
  neutral: { text: 'text-muted-foreground', soft: 'bg-muted', chip: 'bg-muted text-muted-foreground' },
};
