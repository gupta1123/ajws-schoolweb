// src/components/ui/page-kit.tsx
//
// Shared page-level building blocks (compact density). Every dashboard-style
// page should compose these so spacing, type and color stay consistent.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { space, surface, toneClass, type, type Tone } from '@/lib/design/tokens';

/** Small colored icon container. */
export function IconChip({
  children,
  tone = 'primary',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md [&_svg]:size-4',
        toneClass[tone].chip,
        className
      )}
    >
      {children}
    </span>
  );
}

/** Small status / category pill. */
export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-4',
        toneClass[tone].chip,
        className
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconChip>{icon}</IconChip>}
        <div className="min-w-0">
          <h1 className={cn(type.pageTitle, 'truncate')}>{title}</h1>
          {subtitle && <p className={type.pageSubtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Section container: header (title, optional icon / count / link) + body. */
export function Panel({
  title,
  icon,
  count,
  href,
  hrefLabel,
  action,
  flush = false,
  className,
  children,
}: {
  title?: ReactNode;
  icon?: ReactNode;
  count?: ReactNode;
  href?: string;
  hrefLabel?: string;
  action?: ReactNode;
  /** Remove body padding (for divided row lists). */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(surface.panel, className)}>
      {title && (
        <header className={cn(space.panelHeader, 'border-b')}>
          <div className="flex min-w-0 items-center gap-2">
            {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
            <h2 className={cn(type.sectionTitle, 'truncate')}>{title}</h2>
            {count !== undefined && <Pill>{count}</Pill>}
          </div>
          <div className="flex items-center gap-1">
            {action}
            {href && (
              <Link
                href={href}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                {hrefLabel}
                <ChevronRight className="size-3.5" />
              </Link>
            )}
          </div>
        </header>
      )}
      <div className={flush ? undefined : space.panelBody}>{children}</div>
    </section>
  );
}

/** Divided list container for rows inside a flush Panel. */
export function RowList({ children }: { children: ReactNode }) {
  return <ul className="divide-y">{children}</ul>;
}

/** Standard list row: leading icon, title + trailing pill, one meta line. */
export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  meta,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** Short facts rendered on one wrapped line, separated by dots. */
  meta?: ReactNode[];
}) {
  const facts = (meta ?? []).filter(Boolean);
  return (
    <li className={cn(space.row, surface.rowHover)}>
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn(type.rowTitle, 'truncate')}>{title}</p>
            {subtitle && <p className={cn(type.caption, 'truncate')}>{subtitle}</p>}
          </div>
          {trailing}
        </div>
        {facts.length > 0 && (
          <p className={cn(type.caption, 'mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5')}>
            {facts.map((fact, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {i > 0 && <span aria-hidden>·</span>}
                {fact}
              </span>
            ))}
          </p>
        )}
      </div>
    </li>
  );
}

export function EmptyState({
  icon,
  title,
  help,
}: {
  icon?: ReactNode;
  title: ReactNode;
  help?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
      {icon && <span className="text-muted-foreground/60 [&_svg]:size-6">{icon}</span>}
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {help && <p className={type.caption}>{help}</p>}
    </div>
  );
}

export function InlineError({
  title,
  detail,
  onRetry,
  retryLabel,
}: {
  title: ReactNode;
  detail?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
      <p className="text-sm font-medium text-tone-danger">{title}</p>
      {detail && <p className={type.caption}>{detail}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-1 text-xs font-medium text-primary hover:underline">
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact KPI tile. */
export function StatTile({
  label,
  value,
  icon,
  tone = 'primary',
  loading = false,
}: {
  label: string;
  value: number | null | undefined;
  icon: ReactNode;
  tone?: Tone;
  loading?: boolean;
}) {
  const hasValue = typeof value === 'number';
  return (
    <div className={cn(surface.panel, 'flex items-center gap-3 px-4 py-3')}>
      <IconChip tone={tone} className="size-9">
        {icon}
      </IconChip>
      <div className="min-w-0">
        <p className={type.label}>{label}</p>
        {loading && !hasValue ? (
          <Skeleton className="mt-1.5 h-6 w-16" />
        ) : (
          <p className={cn(type.stat, 'mt-1')}>{hasValue ? value.toLocaleString() : '—'}</p>
        )}
      </div>
    </div>
  );
}

/** Compact navigation tile (quick actions). */
export function ActionTile({
  href,
  icon,
  label,
  tone = 'primary',
}: {
  href: string;
  icon: ReactNode;
  label: string;
  tone?: Tone;
}) {
  return (
    <Link
      href={href}
      className={cn(
        surface.panel,
        surface.rowHover,
        'group flex items-center gap-2.5 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <IconChip tone={tone}>{icon}</IconChip>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Label + value pair for read-only details. Empty values render a muted placeholder. */
export function Field({
  label,
  value,
  icon,
  emptyLabel = '—',
  hint,
}: {
  label: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;
  emptyLabel?: ReactNode;
  hint?: ReactNode;
}) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className="min-w-0">
      <dt className={type.label}>{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm">
        {icon && <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>}
        <span className={cn('truncate', empty ? 'text-muted-foreground' : 'font-medium')}>
          {empty ? emptyLabel : value}
        </span>
      </dd>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
