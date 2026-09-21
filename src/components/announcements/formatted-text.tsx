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

  // API span ends are inclusive, while browser selections and the edit math
  // below use exclusive ends. Convert at the boundary in both directions.
  return {
    version: 1,
    spans: format.spans.flatMap(span => {
      const exclusiveEnd = span.end + 1;
      if (exclusiveEnd <= prefix) return [span];
      if (span.start >= previousChangeEnd) {
        return [{ ...span, start: span.start + delta, end: exclusiveEnd + delta - 1 }];
      }
      return [];
    }).filter(span => span.start >= 0 && span.end < next.length && span.start <= span.end),
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
}: FormattedTextEditorProps) {
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
    && span.end + 1 >= selection.end
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
    const end = selectionEnd - 1;

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
    const validSpans = (format?.spans || []).filter(span => span.start >= 0 && span.end < text.length && span.start <= span.end);
    const boundaries = Array.from(new Set([0, text.length, ...validSpans.flatMap(span => [span.start, span.end + 1])])).sort((a, b) => a - b);

    return boundaries.slice(0, -1).map((start, index) => {
      const end = boundaries[index + 1];
      const active = validSpans.filter(span => span.start <= start && span.end + 1 >= end);
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
