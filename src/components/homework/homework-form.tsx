// src/components/homework/homework-form.tsx
//
// Create form for homework. Reads like a worksheet: the title and instructions
// are the page, attachments and the student picker sit underneath, and a quiet
// rail on the right answers "who is it for, and by when?".

'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Loader2, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateField, toISODate } from '@/components/calendar/event-pickers';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { type } from '@/lib/design/tokens';
import type { HomeworkTargetType } from '@/types/homework';

export interface ClassOption {
  id: string;
  label: string;
}

export interface ClassStudent {
  id: string;
  full_name: string;
  admission_number: string;
}

export interface HomeworkFormValues {
  class_division_id: string;
  subject: string;
  title: string;
  description: string;
  due_date: string; // yyyy-MM-dd, optional
  target_type: HomeworkTargetType;
  student_ids: string[];
}

interface HomeworkFormProps {
  mode: 'create' | 'edit';
  initial?: Partial<HomeworkFormValues>;
  /** File picker (create) or the manager for existing files (edit). */
  attachments: ReactNode;
  classes: ClassOption[];
  loadingClasses: boolean;
  fetchSubjects: (classId: string) => Promise<string[]>;
  fetchStudents: (classId: string) => Promise<ClassStudent[]>;
  submitting: boolean;
  onSubmit: (values: HomeworkFormValues) => void;
  onCancel: () => void;
}

const rail = 'text-xs font-medium text-muted-foreground';

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t pt-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={type.sectionTitle}>{title}</h2>
        {hint && <p className={type.caption}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function HomeworkForm({ mode, initial, attachments, classes, loadingClasses, fetchSubjects, fetchStudents, submitting, onSubmit, onCancel }: HomeworkFormProps) {
  const { t, lang } = useI18n();
  const [values, setValues] = useState<HomeworkFormValues>({
    class_division_id: '',
    subject: '',
    title: '',
    description: '',
    due_date: '',
    target_type: 'class',
    student_ids: [],
    ...initial,
  });
  const isEdit = mode === 'edit';
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');

  const set = <K extends keyof HomeworkFormValues>(key: K, value: HomeworkFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const classId = values.class_division_id;

  // subjects follow the chosen class; a single option is picked for you
  useEffect(() => {
    let cancelled = false;
    if (!classId) {
      setSubjects([]);
      return;
    }
    setLoadingSubjects(true);
    fetchSubjects(classId)
      .then((list) => {
        if (cancelled) return;
        // when editing, the saved subject stays selectable even if the class no longer lists it
        const saved = isEdit && classId === initial?.class_division_id ? initial?.subject : undefined;
        const options = saved && !list.includes(saved) ? [saved, ...list] : list;
        setSubjects(options);
        setValues((prev) => ({ ...prev, subject: options.includes(prev.subject) ? prev.subject : options.length === 1 ? options[0] : '' }));
      })
      .catch(() => !cancelled && setSubjects([]))
      .finally(() => !cancelled && setLoadingSubjects(false));
    return () => {
      cancelled = true;
    };
  }, [classId, fetchSubjects, isEdit, initial?.class_division_id, initial?.subject]);

  // students are only needed when targeting individuals
  useEffect(() => {
    let cancelled = false;
    if (!classId || values.target_type !== 'students') {
      setStudents([]);
      return;
    }
    setLoadingStudents(true);
    fetchStudents(classId)
      .then((list) => !cancelled && setStudents(list))
      .catch(() => !cancelled && setStudents([]))
      .finally(() => !cancelled && setLoadingStudents(false));
    return () => {
      cancelled = true;
    };
  }, [classId, values.target_type, fetchStudents]);

  const chooseClass = (id: string) => setValues((prev) => ({ ...prev, class_division_id: id, subject: '', student_ids: [] }));
  const chooseTarget = (target: HomeworkTargetType) =>
    setValues((prev) => ({ ...prev, target_type: target, student_ids: target === 'class' ? [] : prev.student_ids }));
  const toggleStudent = (id: string) =>
    setValues((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(id) ? prev.student_ids.filter((s) => s !== id) : [...prev.student_ids, id],
    }));

  const visibleStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    return q ? students.filter((s) => s.full_name.toLowerCase().includes(q) || s.admission_number.toLowerCase().includes(q)) : students;
  }, [students, studentQuery]);
  const allVisibleSelected = visibleStudents.length > 0 && visibleStudents.every((s) => values.student_ids.includes(s.id));
  const toggleAllVisible = () =>
    setValues((prev) => {
      const ids = new Set(prev.student_ids);
      visibleStudents.forEach((s) => (allVisibleSelected ? ids.delete(s.id) : ids.add(s.id)));
      return { ...prev, student_ids: Array.from(ids) };
    });

  const today = toISODate(new Date());
  const pastDate = !isEdit && !!values.due_date && values.due_date < today;
  const needsStudents = values.target_type === 'students' && values.student_ids.length === 0;
  const canSubmit = !submitting && !!classId && !!values.subject && !!values.title.trim() && !needsStudents && !pastDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSubmit(values);
  };

  const classLabel = classes.find((c) => c.id === classId)?.label;
  const dueLabel = values.due_date
    ? (() => {
        const [y, m, d] = values.due_date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
      })()
    : null;
  const summary = [
    classLabel,
    values.subject || null,
    values.target_type === 'students' && values.student_ids.length > 0
      ? `${values.student_ids.length} ${t('homeworkTeacher.list.students', 'students')}`
      : null,
    dueLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const segment = (active: boolean) =>
    cn(
      'h-8 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      active ? 'bg-background font-medium text-tone-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
    );

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-6xl">
      <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* Worksheet: title + instructions, then attachments and students */}
        <div className="min-w-0 space-y-8 lg:col-start-1">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="sr-only">
                {t('homeworkTeacher.create.titleLabel', 'Title')}
              </Label>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder={t('homeworkTeacher.form.titlePlaceholder', 'Homework title, e.g. Chapter 3 exercises')}
                autoComplete="off"
                className="h-auto border-0 bg-transparent px-0 py-1 text-2xl font-semibold shadow-none placeholder:font-normal placeholder:text-muted-foreground/60 focus-visible:ring-0 md:text-2xl"
              />
            </div>
            <div className="border-t pt-4">
              <Label htmlFor="description" className="sr-only">
                {t('homeworkTeacher.create.description', 'Description')}
              </Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder={t('homeworkTeacher.form.instructionsPlaceholder', 'What should students do? Add page numbers, instructions, anything they need.')}
                rows={6}
                className="resize-none border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 md:text-base"
              />
            </div>
          </div>

          <Block
            title={t('homeworkTeacher.form.attachments', 'Attachments')}
            hint={isEdit ? undefined : t('homeworkTeacher.form.attachmentsHint', 'Uploaded after the homework is created.')}
          >
            {attachments}
          </Block>

          {values.target_type === 'students' && (
            <Block
              title={t('homeworkTeacher.create.students', 'Students')}
              hint={
                values.student_ids.length > 0
                  ? `${values.student_ids.length} ${t('common.selected', 'selected')}`
                  : t('homeworkTeacher.form.pickStudents', 'Pick at least one student.')
              }
            >
              {!classId ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {t('homeworkTeacher.create.selectClassFirst', 'Select a class first to load students.')}
                </p>
              ) : loadingStudents ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t('homeworkTeacher.create.loadingStudents', 'Loading students...')}
                </p>
              ) : students.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  {t('homeworkTeacher.create.noStudents', 'No students found for this class.')}
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                        placeholder={t('homeworkTeacher.form.searchStudents', 'Search students...')}
                        className="pl-8"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={toggleAllVisible} disabled={visibleStudents.length === 0}>
                      {allVisibleSelected ? t('homeworkTeacher.form.clear', 'Clear') : t('homeworkTeacher.form.selectAll', 'Select all')}
                    </Button>
                  </div>
                  <ul className="grid max-h-72 gap-x-4 overflow-y-auto sm:grid-cols-2">
                    {visibleStudents.map((student) => {
                      const checked = values.student_ids.includes(student.id);
                      return (
                        <li key={student.id}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60',
                              checked && 'bg-tone-primary-soft/60'
                            )}
                          >
                            <Checkbox checked={checked} onCheckedChange={() => toggleStudent(student.id)} />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium leading-tight">{student.full_name}</span>
                              <span className="block text-xs text-muted-foreground">{student.admission_number}</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                    {visibleStudents.length === 0 && (
                      <li className="col-span-full py-4 text-center text-sm text-muted-foreground">
                        {t('homeworkTeacher.empty.noMatch', 'No homework matches your search.')}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </Block>
          )}
        </div>

        {/* Rail: who is it for, and by when */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:border-l lg:pl-8">
          <div className="space-y-2">
            <Label htmlFor="class" className={rail}>
              {t('homeworkTeacher.form.classLabel', 'Class')} *
            </Label>
            <Select value={classId} onValueChange={chooseClass} disabled={loadingClasses || classes.length === 0}>
              <SelectTrigger id="class" className="w-full">
                <SelectValue
                  placeholder={
                    loadingClasses
                      ? t('classes.loading', 'Loading classes...')
                      : classes.length === 0
                      ? t('classes.emptyTitle', 'No classes found')
                      : t('homeworkTeacher.labels.selectClass', 'Select a class')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className={rail}>
              {t('homeworkTeacher.create.subject', 'Subject')} *
            </Label>
            <Select value={values.subject} onValueChange={(v) => set('subject', v)} disabled={!classId || loadingSubjects || subjects.length === 0}>
              <SelectTrigger id="subject" className="w-full">
                <SelectValue
                  placeholder={
                    !classId
                      ? t('homeworkTeacher.form.selectClassFirst', 'Select a class first')
                      : loadingSubjects
                      ? t('common.loading', 'Loading...')
                      : subjects.length === 0
                      ? t('homeworkTeacher.filters.noSubjects', 'No subjects assigned')
                      : t('homeworkTeacher.create.selectSubject', 'Select a subject')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label id="target-label" className={rail}>
              {t('homeworkTeacher.create.assignTo', 'Assign to')}
            </Label>
            <div role="radiogroup" aria-labelledby="target-label" className="grid grid-cols-2 gap-0.5 rounded-lg bg-muted/60 p-0.5">
              <button type="button" role="radio" aria-checked={values.target_type === 'class'} onClick={() => chooseTarget('class')} className={segment(values.target_type === 'class')}>
                {t('homeworkTeacher.create.entireClass', 'Entire class')}
              </button>
              <button type="button" role="radio" aria-checked={values.target_type === 'students'} onClick={() => chooseTarget('students')} className={segment(values.target_type === 'students')}>
                {t('homeworkTeacher.create.selectedStudents', 'Selected students')}
                {values.student_ids.length > 0 && <span className="ml-1 tabular-nums">({values.student_ids.length})</span>}
              </button>
            </div>
          </div>

          <div className="space-y-2 border-t pt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="due_date" className={rail}>
                {t('homeworkTeacher.create.dueDate', 'Due Date')}
                <span className="ml-1 font-normal">· {t('homeworkTeacher.form.optional', 'optional')}</span>
              </Label>
              {values.due_date && (
                <button
                  type="button"
                  onClick={() => set('due_date', '')}
                  className="rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('homeworkTeacher.form.removeDue', 'Remove')}
                </button>
              )}
            </div>
            <DateField id="due_date" value={values.due_date} onChange={(v) => set('due_date', v)} invalid={pastDate} min={isEdit ? undefined : today} />
            {pastDate && (
              <p className="text-xs font-medium text-tone-danger">{t('homeworkTeacher.form.pastDate', 'Due date cannot be in the past.')}</p>
            )}
          </div>

          {/* Actions (floating bar on mobile) */}
          <div className="space-y-3 border-t pt-6 max-lg:fixed max-lg:inset-x-3 max-lg:bottom-3 max-lg:z-30 max-lg:space-y-0 max-lg:rounded-xl max-lg:border max-lg:bg-background max-lg:p-3 max-lg:shadow-lg">
            {summary && <p className={cn(type.caption, 'max-lg:hidden')}>{summary}</p>}
            <div className="flex items-center gap-2 lg:flex-col-reverse lg:items-stretch">
              <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting} className="max-lg:flex-1">
                {t('actions.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={!canSubmit} className="max-lg:flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {isEdit ? t('homeworkTeacher.detail.saving', 'Saving...') : t('homeworkTeacher.create.creating', 'Creating...')}
                  </>
                ) : isEdit ? (
                  t('homeworkTeacher.edit.cta', 'Update Homework')
                ) : (
                  t('homeworkTeacher.create.cta', 'Create Homework')
                )}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* room so the floating mobile action bar never covers content */}
      <div className="h-24 lg:hidden" aria-hidden />
    </form>
  );
}
