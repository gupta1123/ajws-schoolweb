'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Bold, Highlighter, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
  AnnouncementFormatMark,
  AnnouncementTextFormat,
} from '@/lib/api/announcements';
import { cn } from '@/lib/utils';

const EMPTY_FORMAT: AnnouncementTextFormat = { version: 1, spans: [] };

function rebaseFormat(format: AnnouncementTextFormat, previous: string, next: string): AnnouncementTextFormat {
  let prefix = 0;
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < previous.length - prefix
    && suffix < next.length - prefix
    && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) suffix += 1;

  const previousChangeEnd = previous.length - suffix;
  const delta = next.length - previous.length;

  // Span ends are exclusive (start <= i < end), matching the backend
  // validation, the mobile renderer and browser selections.
  return {
    version: 1,
    spans: format.spans.flatMap(span => {
      if (span.end <= prefix) return [span];
      if (span.start >= previousChangeEnd) {
        return [{ ...span, start: span.start + delta, end: span.end + delta }];
      }
      return [];
    }).filter(span => span.start >= 0 && span.end <= next.length && span.start < span.end),
  };
}

interface FormattedTextEditorProps {
  id: string;
  value: string;
  format: AnnouncementTextFormat;
  onChange: (value: string) => void;
  onFormatChange: (format: AnnouncementTextFormat) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  /** 'clean' = borderless, document-style field with a quiet icon toolbar. */
  variant?: 'default' | 'clean';
  className?: string;
}

export function FormattedTextEditor({
  id,
  value,
  format,
  onChange,
  onFormatChange,
  placeholder,
  multiline = false,
  rows = 6,
  variant = 'default',
  className,
}: FormattedTextEditorProps) {
  const clean = variant === 'clean';
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [feedback, setFeedback] = useState<string | null>(null);

  const updateSelection = () => {
    const input = inputRef.current;
    if (!input) return;
    setSelection({
      start: input.selectionStart ?? 0,
      end: input.selectionEnd ?? 0,
    });
  };

  const isMarkActive = (mark: AnnouncementFormatMark) => format.spans.some(span => (
    span.start <= selection.start
    && span.end >= selection.end
    && selection.start < selection.end
    && span.marks.includes(mark)
  ));

  const applyMark = (mark: AnnouncementFormatMark) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const selectionEnd = input.selectionEnd ?? 0;
    if (start === selectionEnd) {
      setFeedback('Select some text before applying a style.');
      return;
    }
    const end = selectionEnd;

    const exactIndex = format.spans.findIndex(span => span.start === start && span.end === end && span.marks.includes(mark));
    if (exactIndex >= 0) {
      const spans = format.spans.flatMap((span, index) => {
        if (index !== exactIndex) return [span];
        const marks = span.marks.filter(item => item !== mark);
        return marks.length ? [{ ...span, marks, color: marks.includes('highlight') ? span.color : undefined }] : [];
      });
      onFormatChange({ version: 1, spans });
      setFeedback(`${mark.charAt(0).toUpperCase() + mark.slice(1)} removed from the selected text.`);
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start, selectionEnd);
      });
      return;
    }

    onFormatChange({
      version: 1,
      spans: [
        ...format.spans,
        {
          start,
          end,
          marks: [mark],
          ...(mark === 'highlight' ? { color: '#FFF176' } : {}),
        },
      ].slice(-200),
    });
    setFeedback(`${mark.charAt(0).toUpperCase() + mark.slice(1)} applied to the selected text.`);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start, selectionEnd);
    });
  };

  const handleTextChange = (next: string) => {
    onFormatChange(rebaseFormat(format || EMPTY_FORMAT, value, next));
    onChange(next);
    setFeedback(null);
  };

  const toolbarButton = (mark: AnnouncementFormatMark, label: string, icon: React.ReactNode) => {
    const active = isMarkActive(mark);
    return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      aria-label={label}
      aria-pressed={active}
      title={`${label} selected text`}
      className={cn(
        'gap-1.5',
        active && mark === 'highlight' && 'bg-yellow-300 text-gray-950 hover:bg-yellow-400'
      )}
      onMouseDown={event => {
        event.preventDefault();
      }}
      onClick={() => applyMark(mark)}
    >
      {icon}
      <span>{label}</span>
    </Button>
    );
  };

  const mirrorSegments = useMemo(() => {
    if (!clean) return [];
    const spans = format.spans.filter(span => span.start >= 0 && span.end <= value.length && span.start < span.end);
    const cuts = Array.from(new Set([0, value.length, ...spans.flatMap(span => [span.start, span.end])])).sort((x, y) => x - y);
    return cuts.slice(0, -1).map((start, index) => {
      const end = cuts[index + 1];
      const active = spans.filter(span => span.start <= start && span.end >= end);
      const marks = new Set(active.flatMap(span => span.marks));
      const highlight = [...active].reverse().find(span => span.marks.includes('highlight'));
      return { start, end, value: value.slice(start, end), marks, color: highlight?.color || '#FFF176' };
    });
  }, [clean, format, value]);

  if (clean) {
    // Live formatting: a mirror layer paints the styles behind a transparent
    // textarea. Bold is faked with a text-shadow so glyph widths (and the
    // caret) never drift from the real text.
    const typography = cn(
      'w-full whitespace-pre-wrap break-words p-0',
      multiline ? 'min-h-[7rem] text-[15px] leading-relaxed md:text-[15px]' : 'text-xl font-semibold leading-snug md:text-xl',
      className
    );
    const markButton = (mark: AnnouncementFormatMark, label: string, icon: React.ReactNode) => {
      const active = isMarkActive(mark);
      return (
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          title={`${label} selected text`}
          onMouseDown={event => event.preventDefault()}
          onClick={() => applyMark(mark)}
          className={cn(
            'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5',
            active && (mark === 'highlight' ? 'bg-yellow-300 text-gray-950 hover:bg-yellow-300' : 'bg-primary/10 text-primary')
          )}
        >
          {icon}
        </button>
      );
    };
    return (
      <div className="group/editor">
        <div className="relative">
          <div aria-hidden className={cn(typography, 'pointer-events-none absolute inset-0 overflow-hidden text-foreground')}>
            {mirrorSegments.map(segment => (
              <span
                key={`${segment.start}-${segment.end}`}
                className={cn(segment.marks.has('underline') && 'underline decoration-2 underline-offset-2', segment.marks.has('highlight') && 'text-gray-950')}
                style={{
                  ...(segment.marks.has('bold') ? { textShadow: '0.6px 0 currentColor, -0.6px 0 currentColor' } : null),
                  ...(segment.marks.has('highlight') ? { backgroundColor: segment.color } : null),
                }}
              >
                {segment.value}
              </span>
            ))}
            {'\n'}
          </div>
          <Textarea
            id={id}
            ref={element => { inputRef.current = element; }}
            value={value}
            rows={multiline ? rows : 1}
            onChange={event => handleTextChange(multiline ? event.target.value : event.target.value.replace(/\n/g, ' '))}
            onKeyDown={event => { if (!multiline && event.key === 'Enter') event.preventDefault(); }}
            onSelect={updateSelection}
            onKeyUp={updateSelection}
            onMouseUp={updateSelection}
            placeholder={placeholder}
            className={cn(
              typography,
              'relative block resize-none rounded-none border-0 bg-transparent text-transparent shadow-none caret-foreground outline-none selection:bg-primary/20 placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent',
              !multiline && 'min-h-0'
            )}
          />
        </div>
        <div className="mt-1 flex items-center gap-0.5">
          {markButton('bold', 'Bold', <Bold />)}
          {markButton('underline', 'Underline', <Underline />)}
          {markButton('highlight', 'Highlight', <Highlighter />)}
          <span className="ml-2 text-[11px] text-muted-foreground/70" role="status">
            {feedback ?? 'Select text to style it'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 rounded-md border bg-muted/30 p-1">
        {toolbarButton('bold', 'Bold', <Bold className="h-4 w-4" />)}
        {toolbarButton('underline', 'Underline', <Underline className="h-4 w-4" />)}
        {toolbarButton('highlight', 'Highlight', <Highlighter className="h-4 w-4" />)}
        <span className="ml-2 text-xs text-muted-foreground">Select text, then choose a style</span>
      </div>
      {multiline ? (
        <Textarea
          id={id}
          ref={element => { inputRef.current = element; }}
          value={value}
          onChange={event => handleTextChange(event.target.value)}
          onSelect={updateSelection}
          onKeyUp={updateSelection}
          onMouseUp={updateSelection}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <Input
          id={id}
          ref={element => { inputRef.current = element; }}
          value={value}
          onChange={event => handleTextChange(event.target.value)}
          onSelect={updateSelection}
          onKeyUp={updateSelection}
          onMouseUp={updateSelection}
          placeholder={placeholder}
        />
      )}
      {feedback && (
        <p className="text-xs font-medium text-primary" role="status">{feedback}</p>
      )}
      {format.spans.length > 0 && (
        <div className="rounded-md border bg-background p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Live formatted preview</p>
          <FormattedText text={value} format={format} className={multiline ? 'whitespace-pre-wrap text-sm' : 'font-semibold'} />
        </div>
      )}
    </div>
  );
}

interface FormattedTextProps {
  text: string;
  format?: AnnouncementTextFormat | null;
  className?: string;
}

export function FormattedText({ text, format, className }: FormattedTextProps) {
  const segments = useMemo(() => {
    const validSpans = (format?.spans || []).filter(span => span.start >= 0 && span.end <= text.length && span.start < span.end);
    const boundaries = Array.from(new Set([0, text.length, ...validSpans.flatMap(span => [span.start, span.end])])).sort((a, b) => a - b);

    return boundaries.slice(0, -1).map((start, index) => {
      const end = boundaries[index + 1];
      const active = validSpans.filter(span => span.start <= start && span.end >= end);
      const marks = new Set(active.flatMap(span => span.marks));
      const highlight = [...active].reverse().find(span => span.marks.includes('highlight'));
      return { start, end, value: text.slice(start, end), marks, color: highlight?.color || '#FFF176' };
    });
  }, [format, text]);

  return (
    <span className={cn(className)}>
      {segments.map(segment => (
        <span
          key={`${segment.start}-${segment.end}`}
          className={cn(
            segment.marks.has('bold') && 'font-bold',
            segment.marks.has('underline') && 'underline decoration-2 underline-offset-2',
            segment.marks.has('highlight') && 'rounded-sm px-0.5 text-gray-950'
          )}
          style={segment.marks.has('highlight') ? { backgroundColor: segment.color } : undefined}
        >
          {segment.value}
        </span>
      ))}
    </span>
  );
}

export const emptyAnnouncementFormat = (): AnnouncementTextFormat => ({ version: 1, spans: [] });
