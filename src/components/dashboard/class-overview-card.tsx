// src/components/dashboard/class-overview-card.tsx

'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { academicServices } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';
import { Panel, EmptyState, Pill } from '@/components/ui/page-kit';
import { Skeleton } from '@/components/ui/skeleton';

interface TeacherClass {
  id: string;
  name: string;
  division: string;
  studentCount: number;
  teacherRole: 'class_teacher' | 'subject_teacher';
  subject?: string;
  classDivisionId: string;
  assignmentId: string;
}

export function ClassOverviewCard() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const fetchTeacherClasses = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await academicServices.getMyTeacherClasses(token);
        
        if (response.status === 'success' && response.data.assigned_classes) {
          // Transform the API data to match our interface
          const transformedClasses = response.data.assigned_classes.map((assignment: {
            assignment_id: string;
            class_division_id: string;
            class_level: string;
            division: string;
            assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
            subject?: string;
          }) => {
            // Extract class name from class_level
            const className = assignment.class_level || 'Unknown Class';
            const division = assignment.division || 'Unknown Division';
            
            return {
              id: `${assignment.assignment_id}-${assignment.class_division_id}`,
              name: className,
              division: division,
              studentCount: 0, // Will be fetched separately
              teacherRole: assignment.assignment_type === 'class_teacher' ? 'class_teacher' : 'subject_teacher' as 'class_teacher' | 'subject_teacher',
              subject: assignment.subject,
              classDivisionId: assignment.class_division_id,
              assignmentId: assignment.assignment_id
            };
          });

          // Fetch student count for each class
          const classesWithStudentCounts = await Promise.all(
            transformedClasses.map(async (cls) => {
              try {
                const studentsResponse = await academicServices.getStudentsByClass(cls.classDivisionId, token);
                if (studentsResponse.status === 'success') {
                  cls.studentCount = studentsResponse.data.students?.length || 0;
                }
              } catch (error) {
                console.error(`Error fetching students for class ${cls.classDivisionId}:`, error);
                cls.studentCount = 0;
              }
              return cls;
            })
          );

          setClasses(classesWithStudentCounts);
        }
      } catch (error) {
        console.error('Error fetching teacher classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherClasses();
  }, [token]);

  // Separate classes by role
  const classTeacherClasses = classes.filter(cls => cls.teacherRole === 'class_teacher');
  const subjectTeacherClasses = classes.filter(cls => cls.teacherRole === 'subject_teacher');

  const renderGroup = (label: string, items: TeacherClass[], showSubject: boolean) => (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((classItem) => (
          <div
            key={classItem.assignmentId}
            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {classItem.name} - {classItem.division}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                {classItem.studentCount} {t('dashboard.teacher.classOverview.students', 'students')}
              </p>
            </div>
            <Pill tone={showSubject ? 'violet' : 'primary'} className="max-w-[50%] truncate">
              {showSubject
                ? classItem.subject || t('dashboard.teacher.classOverview.subject', 'Subject')
                : t('dashboard.teacher.classOverview.classTeacher', 'Class Teacher')}
            </Pill>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Panel
      title={t('dashboard.teacher.classOverview.title', 'Class Overview')}
      icon={<GraduationCap />}
      href="/classes"
      hrefLabel={t('common.viewAll', 'View All')}
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[52px] rounded-md" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={<GraduationCap />}
          title={t('dashboard.teacher.classOverview.noClasses', 'No classes assigned yet.')}
        />
      ) : (
        <div className="space-y-4">
          {classTeacherClasses.length > 0 &&
            renderGroup(t('dashboard.teacher.classOverview.asClassTeacher', 'As Class Teacher'), classTeacherClasses, false)}
          {subjectTeacherClasses.length > 0 &&
            renderGroup(t('dashboard.teacher.classOverview.asSubjectTeacher', 'As Subject Teacher'), subjectTeacherClasses, true)}
        </div>
      )}
    </Panel>
  );
}
