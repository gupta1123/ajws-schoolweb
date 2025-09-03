// src/components/classes/class-card.tsx

'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface ClassCardProps {
  name: string;
  division: string;
  studentCount: number;
  teacherRole: 'class_teacher' | 'subject_teacher';
  subject?: string;
}

export function ClassCard({
  name,
  division,
  studentCount,
  teacherRole,
  subject
}: ClassCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {name} - {division}
          </CardTitle>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20">
            <span className="text-blue-600 dark:text-blue-300">
              {teacherRole === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <span>{studentCount} students</span>
        </div>
        {teacherRole === 'subject_teacher' && subject && (
          <div className="text-sm text-muted-foreground">
            Subject: <span className="font-medium">{subject}</span>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}