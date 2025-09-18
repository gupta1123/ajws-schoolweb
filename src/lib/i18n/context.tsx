'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import mr from '@/locales/mr.json';

export type Lang = 'en' | 'hi' | 'mr';

type Dictionary = Record<string, string | Record<string, unknown>>;

const dictionaries: Record<Lang, Dictionary> = { en, hi, mr };

function getByPath(obj: Dictionary, path: string): string | undefined {
  return path.split('.').reduce<string | undefined>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      const value = acc[key];
      return typeof value === 'string' ? value : undefined;
    }
    return undefined;
  }, obj as unknown as string | undefined);
}

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && (localStorage.getItem('lang') as Lang)) || 'en';
    setLangState(saved);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', l);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback((key: string, fallback?: string) => {
    const dict = dictionaries[lang] ?? dictionaries.en;
    const val = getByPath(dict, key);
    if (typeof val === 'string') return val;
    return fallback ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

