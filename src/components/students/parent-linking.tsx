// src/components/students/parent-linking.tsx
//
// Body of the "Link parent" side panel: find a parent, pick how they relate to
// the student, link them. Fills the height of its container, with the
// relationship picker and buttons pinned to the bottom.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Plus, Search, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, IconChip, Pill } from '@/components/ui/page-kit';
import { PickField } from '@/components/students/student-fields';
import { initialsOf } from '@/components/staff/staff-form';
import { parentServices } from '@/lib/api/parents';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { type } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';
import { CreateParentModal } from './create-parent-modal';

interface ParentData {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  children?: Array<{ id: string; full_name: string }>;
}

interface ParentLinkingProps {
  onLinkParent: (parentId: string, relationship: string, isPrimary: boolean, accessLevel: string) => void | Promise<void>;
  onCancel: () => void;
  existingParentMappings?: Array<{ relationship: string; parent: { id: string; full_name: string } }>;
  studentAdmissionNumber?: string;
  relationship?: string;
  /** called when a parent created here was linked to the student straight away */
  onParentCreated?: () => void | Promise<void>;
}

const RELATIONSHIPS = ['father', 'mother', 'guardian', 'grandparent', 'other'] as const;

export function ParentLinking({ onLinkParent, onCancel, existingParentMappings = [], studentAdmissionNumber, relationship, onParentCreated }: ParentLinkingProps) {
  const { token } = useAuth();
  const { t } = useI18n();

  const [query, setQuery] = useState('');
  const [parents, setParents] = useState<ParentData[]>([]);
  const [found, setFound] = useState<ParentData[] | null>(null); // server results for the current query
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState('');
  const [rel, setRel] = useState('father');
  const [linking, setLinking] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchParents = useCallback(
    async (search?: string) => {
      if (!token) return null;
      const r = await parentServices.getAllParents(token, search ? { search, limit: 50 } : { limit: 10 });
      if (r instanceof Blob || !('status' in r) || r.status !== 'success' || !r.data) throw new Error();
      return (r.data.parents ?? []) as ParentData[];
    },
    [token]
  );

  const loadInitial = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchParents()
      .then((list) => list && setParents(list))
      .catch(() => setError(t('students.link.loadFailed', 'Could not load parents. Please try again.')))
      .finally(() => setLoading(false));
  }, [fetchParents, t]);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // instant filter on what is already loaded, then a server search to find the rest
  const term = query.trim().toLowerCase();
  const local = useMemo(
    () => (term ? parents.filter((p) => p.full_name.toLowerCase().includes(term) || p.phone_number.includes(term) || (p.email ?? '').toLowerCase().includes(term)) : parents),
    [parents, term]
  );

  useEffect(() => {
    setFound(null);
    if (!term) return;
    setSearching(true);
    const timer = setTimeout(() => {
      fetchParents(query.trim())
        .then((list) => setFound(list))
        .catch(() => setFound(null))
        .finally(() => setSearching(false));
    }, 350);
    return () => {
      clearTimeout(timer);
      setSearching(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const results = term ? found ?? local : parents;

  // relationships the student already has can't be used twice
  const available = RELATIONSHIPS.filter((r) => !existingParentMappings.some((m) => m.relationship === r));
  useEffect(() => {
    if (available.length > 0 && !available.includes(rel as (typeof RELATIONSHIPS)[number])) setRel(available[0]);
  }, [available, rel]);

  const link = async () => {
    if (!selected || linking) return;
    setLinking(true);
    try {
      await onLinkParent(selected, rel, true, 'full');
    } finally {
      setLinking(false);
    }
  };

  const relLabel = (r: string) => t(`students.relationship.${r}`, r.charAt(0).toUpperCase() + r.slice(1));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* search */}
      <div className="flex gap-2 border-b p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('students.link.search', 'Search by name, phone or email')} className="pl-8 pr-8" aria-label={t('students.link.search', 'Search by name, phone or email')} />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-1.5 top-1.5 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={t('actions.clear', 'Clear')}>
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button type="button" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus />
          {t('students.link.newParent', 'New parent')}
        </Button>
      </div>

      {/* results */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className={cn(type.caption, 'px-5 pt-3')}>
          {term ? t('students.link.found', '{n} found').replace('{n}', String(results.length)) : t('students.link.firstTen', 'Showing the first 10 parents. Search to find others.')}
        </p>
        {error ? (
          <div className="p-5">
            <p role="alert" className="text-sm text-tone-danger">
              {error}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadInitial}>
              {t('actions.refresh', 'Refresh')}
            </Button>
          </div>
        ) : loading || (searching && found === null && local.length === 0) ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState icon={<Users />} title={t('students.link.none', 'No parents found')} help={t('students.link.noneHelp', 'Try another search, or add a new parent.')} />
        ) : (
          <ul role="radiogroup" aria-label={t('students.link.parents', 'Parents')} className="mt-2 divide-y border-y">
            {results.map((p) => {
              const on = selected === p.id;
              const kids = p.children?.length ?? 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSelected(p.id)}
                    className={cn('flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', on && 'bg-tone-primary-soft')}
                  >
                    <IconChip tone={on ? 'primary' : 'neutral'}>{initialsOf(p.full_name)}</IconChip>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.full_name}</span>
                      <span className={cn(type.caption, 'block truncate')}>{[p.phone_number, p.email].filter(Boolean).join(' · ')}</span>
                    </span>
                    {kids > 0 && <Pill tone="neutral">{t('students.link.children', '{n} child(ren)').replace('{n}', String(kids))}</Pill>}
                    {on && <Check className="size-4 shrink-0 text-tone-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* link */}
      <div className="space-y-3 border-t bg-background p-4">
        {available.length > 0 ? (
          <PickField id="link-relationship" optional={false} label={t('students.link.relationship', 'Relationship')} value={rel} onChange={setRel} placeholder={t('students.detail.choose', 'Choose')} options={available.map((r) => ({ value: r, label: relLabel(r) }))} />
        ) : (
          <p className="text-sm text-tone-warning">{t('students.link.allUsed', 'All relationship types are already assigned to this student.')}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={linking}>
            {t('actions.cancel', 'Cancel')}
          </Button>
          <Button onClick={link} disabled={!selected || linking || available.length === 0}>
            {linking && <Loader2 className="animate-spin" />}
            {linking ? t('students.link.linking', 'Linking...') : t('students.detail.linkParent', 'Link parent')}
          </Button>
        </div>
      </div>

      <CreateParentModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(id) => {
          // with an admission number the new parent is already linked to this student
          if (studentAdmissionNumber && onParentCreated) {
            void onParentCreated();
            return;
          }
          loadInitial();
          setSelected(id);
        }}
        studentAdmissionNumber={studentAdmissionNumber}
        relationship={relationship}
      />
    </div>
  );
}
