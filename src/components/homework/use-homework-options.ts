// src/components/homework/use-homework-options.ts
//
// Data the homework form needs, shared by the create and edit pages: the
// classes the user may set homework for, the subjects for a class, and a
// class's students.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { academicServices } from '@/lib/api/academic';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';
import type { ClassOption, ClassStudent } from '@/components/homework/homework-form';

interface AssignedClass {
  class_division_id: string;
  division: string;
  class_level: string;
  assignment_type: 'class_teacher' | 'subject_teacher' | 'assistant_teacher' | 'substitute_teacher';
  subject?: string;
}

export function useHomeworkOptions() {
  const { user, token } = useAuth();
  const { t } = useI18n();
  const isTeacher = user?.role === 'teacher';
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  // teachers can only set homework for the subjects they teach in each class
  const teacherSubjects = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (!token || !user?.role) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoadingClasses(true);

        if (user.role === 'teacher') {
          const response = await academicServices.getMyTeacherClasses(token);
          if (response.status !== 'success' || !response.data) return;
          const bySubject = (response.data.assigned_classes as AssignedClass[]).filter((c) => c.assignment_type === 'subject_teacher');
          const map = new Map<string, string[]>();
          const options = new Map<string, ClassOption>();
          bySubject.forEach((c) => {
            options.set(c.class_division_id, { id: c.class_division_id, label: `${c.class_level} · ${c.division}` });
            const list = map.get(c.class_division_id) ?? [];
            if (c.subject && !list.includes(c.subject)) list.push(c.subject);
            map.set(c.class_division_id, list);
          });
          teacherSubjects.current = map;
          if (!cancelled) setClasses(Array.from(options.values()));
          return;
        }

        const response = await academicServices.getClassDivisionsSummary(token);
        if (response.status !== 'success' || !response.data) return;
        // the summary spans every academic year; only the active one is useful here
        const all = response.data.divisions;
        const active = all.filter((d) => d.academic_year?.is_active);
        const options = (active.length > 0 ? active : all)
          .slice()
          .sort((a, b) => a.level.sequence_number - b.level.sequence_number || a.division.localeCompare(b.division))
          .map((d) => ({ id: d.id, label: `${d.level.name} · ${d.division}` }));
        if (!cancelled) setClasses(options);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast({
          title: t('common.error', 'Error'),
          description: t('homeworkTeacher.create.fetchClassesFailed', 'Failed to fetch your assigned classes'),
          variant: 'error',
        });
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token, user?.role, t]);

  const fetchSubjects = useCallback(
    async (classId: string): Promise<string[]> => {
      if (isTeacher) return teacherSubjects.current.get(classId) ?? [];
      if (!token) return [];
      try {
        const response = await academicServices.getSubjectsByClassDivision(classId, token);
        let subjects = response.status === 'success' ? response.data.subjects.map((s) => s.name).filter(Boolean) : [];
        if (subjects.length === 0) {
          const all = await academicServices.getSubjects(token);
          subjects = all.status === 'success' ? all.data.subjects.map((s) => s.name).filter(Boolean) : [];
        }
        return Array.from(new Set(subjects));
      } catch (error) {
        console.error('Error fetching subjects for class:', error);
        toast({
          title: t('common.error', 'Error'),
          description: t('homeworkTeacher.create.fetchSubjectsFailed', 'Failed to fetch subjects for this class'),
          variant: 'error',
        });
        return [];
      }
    },
    [isTeacher, token, t]
  );

  const fetchStudents = useCallback(
    async (classId: string): Promise<ClassStudent[]> => {
      if (!token) return [];
      try {
        const response = await academicServices.getStudentsByClass(classId, token);
        return response.status === 'success' ? response.data.students || [] : [];
      } catch (error) {
        console.error('Error fetching class students:', error);
        toast({
          title: t('common.error', 'Error'),
          description: t('homeworkTeacher.create.fetchStudentsFailed', 'Failed to load students for this class'),
          variant: 'error',
        });
        return [];
      }
    },
    [token, t]
  );

  return { classes, loadingClasses, fetchSubjects, fetchStudents };
}
