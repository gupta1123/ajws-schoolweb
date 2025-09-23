// src/components/timetable/timetable-grid.tsx

import { TimetableEntry, dayNames } from '@/lib/api/timetable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Edit,
  Trash2,
  User,
  Clock
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface TimetableGridProps {
  timetableData: Record<string, TimetableEntry[]>;
  config: {
    total_periods: number;
    days_per_week: number;
  } | null;
  onEditEntry?: (entry: TimetableEntry) => void;
  onDeleteEntry?: (entryId: string) => void;
  className?: string;
}

export function TimetableGrid({
  timetableData,
  config,
  onEditEntry,
  onDeleteEntry,
  className = ''
}: TimetableGridProps) {
  const { t } = useI18n();
  const dayKeyMap: Record<string, string> = {
    Monday: 'days.monday',
    Tuesday: 'days.tuesday',
    Wednesday: 'days.wednesday',
    Thursday: 'days.thursday',
    Friday: 'days.friday',
    Saturday: 'days.saturday',
    Sunday: 'days.sunday',
  };
  if (!config) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('timetable.noConfigSelected')}</p>
        </CardContent>
      </Card>
    );
  }

  const renderPeriodCell = (dayIndex: number, periodNumber: number) => {
    const dayName = dayNames[dayIndex];
    const dayEntries = timetableData[dayName] || [];
    const entry = dayEntries.find(e => e.period_number === periodNumber);

    if (!entry) {
      return (
        <TableCell key={`${dayIndex}-${periodNumber}`} className="border border-gray-200 p-2 min-h-[80px] bg-gray-50/50">
          <div className="text-center text-muted-foreground text-sm">
            -
          </div>
        </TableCell>
      );
    }

    return (
      <TableCell
        key={`${dayIndex}-${periodNumber}`}
        className="border border-gray-200 p-2 min-h-[80px] hover:bg-primary/5 transition-colors"
      >
        <div className="space-y-2">
          <div className="font-medium text-sm">
            {entry.subject_info?.display_name || entry.subject_info?.name || entry.subject}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">
              {entry.teacher?.full_name || t('timetable.unknownTeacher')}
            </span>
          </div>

          <div className="flex gap-1 pt-1">
            {onEditEntry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-primary/10"
                onClick={() => onEditEntry(entry)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}

            {onDeleteEntry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                onClick={() => onDeleteEntry(entry.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </TableCell>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('timetable.classTimetable')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="border border-gray-200 bg-muted/50 font-semibold text-center">
                  {t('timetable.period')}
                </TableHead>
                {Array.from({ length: config.days_per_week }, (_, i) => (
                  <TableHead
                    key={i}
                    className="border border-gray-200 bg-muted/50 font-semibold text-center min-w-[150px]"
                  >
                    {t(dayKeyMap[dayNames[i]] || dayNames[i])}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: config.total_periods }, (_, periodIndex) => (
                <TableRow key={periodIndex}>
                  <TableCell className="border border-gray-200 bg-muted/30 font-medium text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-semibold">
                        {t('timetable.period')} {periodIndex + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatPeriodTime(periodIndex + 1)}
                      </span>
                    </div>
                  </TableCell>

                  {Array.from({ length: config.days_per_week }, (_, dayIndex) =>
                    renderPeriodCell(dayIndex, periodIndex + 1)
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <h4 className="font-medium mb-3">{t('timetable.legend.title')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{t('timetable.legend.assigned')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
              <span>{t('timetable.legend.noClass')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit className="h-3 w-3" />
              <span>{t('timetable.legend.editHint')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format period times (you can customize this)
function formatPeriodTime(periodNumber: number): string {
  const startTimes = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  return startTimes[periodNumber - 1] || `${periodNumber}:00`;
}
