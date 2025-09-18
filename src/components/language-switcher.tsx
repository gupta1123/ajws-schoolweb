'use client';

import { useI18n, type Lang } from '@/lib/i18n/context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();

  const label = lang === 'en' ? 'Language' : lang === 'hi' ? 'भाषा' : 'भाषा';

  return (
    <div className="flex items-center gap-2">
      {!compact && <span className="text-xs text-muted-foreground hidden sm:inline">{label}</span>}
      <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="hi">हिन्दी</SelectItem>
          <SelectItem value="mr">मराठी</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

