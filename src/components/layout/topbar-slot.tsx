// src/components/layout/topbar-slot.tsx
//
// Lets a page put its own title, subtitle and action buttons into the topbar
// (e.g. "Attendance Details: Grade 1 A" + a refresh icon) instead of spending
// a header row inside the page. The slot clears itself when the page unmounts.

'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';

export interface TopbarSlot {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

let slot: TopbarSlot | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useTopbarSlotValue(): TopbarSlot | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => slot,
    () => null
  );
}

export function useTopbarSlot(next: TopbarSlot) {
  useEffect(() => {
    slot = next;
    emit();
  });
  useEffect(
    () => () => {
      slot = null;
      emit();
    },
    []
  );
}
