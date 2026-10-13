// src/components/attendance/attendance-overview-cards.tsx
//
// One quiet strip answering the three questions an admin has about a day:
// how many students are in, how many classes have reported, and how many are out.

import type { ClassAttendanceSummary } from '@/lib/api/attendance';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { surface, type } from '@/lib/design/tokens';
import { classStatus, rateTone } from './attendance-utils';

export function AttendanceOverviewCards({ classes, loading }: { classes: ClassAttendanceSummary[]; loading: boolean }) {
  const { t } = useI18n();

  const marked = classes.filter((c) => classStatus(c) === 'marked');
  const pending = classes.filter((c) => classStatus(c) === 'pending').length;
  const holiday = classes.filter((c) => classStatus(c) === 'holiday').length;
  // weighted by students, and only over classes that have actually reported
  const students = marked.reduce((sum, c) => sum + c.total_students, 0);
  const present = marked.reduce((sum, c) => sum + c.present_count, 0);
  const absent = marked.reduce((sum, c) => sum + c.absent_count, 0);
  const rate = students > 0 ? (present / students) * 100 : null;
  const total = classes.length;

  const cell = 'space-y-1.5 px-5 py-4';

  if (loading && classes.length === 0) {
    return (
      <div className={cn(surface.panel, 'grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0')} aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className={cell}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    );
  }

  const seg = (count: number) => (total > 0 ? `${(count / total) * 100}%` : '0%');

  return (
    <div className={cn(surface.panel, 'grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0')}>
      <div className={cell}>
        <p className={type.label}>{t('attendanceMgmt.summary.present', 'Present')}</p>
        <p className={cn('text-3xl font-semibold tabular-nums leading-none', rate === null ? 'text-muted-foreground' : rateTone(rate).text)}>
          {rate === null ? '—' : `${rate.toFixed(1)}%`}
        </p>
        <p className={type.caption}>
          {t('attendanceMgmt.summary.presentHelp', '{present} of {total} students in marked classes')
            .replace('{present}', String(present))
            .replace('{total}', String(students))}
        </p>
      </div>

      <div className={cell}>
        <p className={type.label}>{t('attendanceMgmt.summary.classesMarked', 'Classes marked')}</p>
        <p className="text-3xl font-semibold tabular-nums leading-none">
          {marked.length}
          <span className="text-lg font-normal text-muted-foreground"> / {total}</span>
        </p>
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className="bg-tone-success" style={{ width: seg(marked.length) }} />
          <span className="bg-tone-violet" style={{ width: seg(holiday) }} />
        </div>
        <p className={type.caption}>
          {t('attendanceMgmt.summary.classesHelp', '{pending} pending · {holiday} on holiday')
            .replace('{pending}', String(pending))
            .replace('{holiday}', String(holiday))}
        </p>
      </div>

      <div className={cell}>
        <p className={type.label}>{t('attendanceMgmt.summary.absent', 'Absent')}</p>
        <p className={cn('text-3xl font-semibold tabular-nums leading-none', absent > 0 && 'text-tone-danger')}>{absent}</p>
        <p className={type.caption}>{t('attendanceMgmt.summary.absentHelp', 'students across marked classes')}</p>
      </div>
    </div>
  );
}
