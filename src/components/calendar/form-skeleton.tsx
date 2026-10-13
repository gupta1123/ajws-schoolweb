// src/components/calendar/form-skeleton.tsx

import { Skeleton } from '@/components/ui/skeleton';

/** Placeholder shown while the event form (or the event being edited) loads. */
export function FormSkeleton({ label }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4" aria-busy="true" aria-label={label}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      {[3, 2, 2].map((rows, i) => (
        <div key={i} className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: rows }).map((_, j) => (
              <Skeleton key={j} className="h-9 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
