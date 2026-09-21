'use client';

import { Download, File } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface MonthlyMenuPreview {
  name: string;
  type: string;
  size: number;
  url?: string;
  text?: string;
  revokeOnClose?: boolean;
}

export const MONTHLY_MENU_ACCEPT = '.jpg,.jpeg,.png,.pdf,.txt,.csv,.doc,.docx';
export const MONTHLY_MENU_MAX_SIZE = 10 * 1024 * 1024;
export const MONTHLY_MENU_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
export const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(new Date(2026, index, 1))
);

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MonthlyMenuPreviewDialog({
  preview,
  onClose,
}: {
  preview: MonthlyMenuPreview | null;
  onClose: () => void;
}) {
  const close = () => {
    if (preview?.revokeOnClose && preview.url) URL.revokeObjectURL(preview.url);
    onClose();
  };
  const isImage = preview?.type.startsWith('image/');
  const canEmbed = preview?.type === 'application/pdf' || preview?.type.startsWith('text/');

  return (
    <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8 break-all">{preview?.name}</DialogTitle>
          <DialogDescription>
            {preview ? `${preview.type || 'Unknown file type'} · ${formatFileSize(preview.size)}` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/20">
          {preview?.text !== undefined ? (
            <pre className="min-h-80 whitespace-pre-wrap break-words p-4 text-sm">{preview.text}</pre>
          ) : isImage && preview?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt={preview.name} className="mx-auto max-h-[65vh] max-w-full object-contain p-2" />
          ) : canEmbed && preview?.url ? (
            <iframe src={preview.url} title={preview.name} className="h-[65vh] w-full bg-white" />
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
              <File className="h-16 w-16 opacity-50" />
              <p>This file type cannot be previewed in the browser.</p>
            </div>
          )}
        </div>
        {preview?.url && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}>
              <Download className="mr-2 h-4 w-4" /> Open or Download
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
