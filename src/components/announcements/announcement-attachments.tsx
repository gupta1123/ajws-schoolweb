'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Eye, File, Loader2, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createAnnouncementsAPI, type Attachment } from '@/lib/api/announcements';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = 'image/*,application/pdf,text/plain,text/csv,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentPreview {
  name: string;
  type: string;
  size: number;
  url?: string;
  text?: string;
  revokeOnClose?: boolean;
}

function AttachmentPreviewDialog({ preview, onClose }: {
  preview: AttachmentPreview | null;
  onClose: () => void;
}) {
  const isImage = preview?.type.startsWith('image/');
  const isPdf = preview?.type === 'application/pdf';
  const canEmbed = isPdf || preview?.type.startsWith('text/') || preview?.type === 'text/csv';

  const close = () => {
    if (preview?.revokeOnClose && preview.url) URL.revokeObjectURL(preview.url);
    onClose();
  };

  return (
    <Dialog open={!!preview} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-8 break-all">{preview?.name}</DialogTitle>
          <DialogDescription>{preview ? `${preview.type || 'Unknown file type'} · ${formatSize(preview.size)}` : ''}</DialogDescription>
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
              <p>This file type cannot be previewed inside the browser.</p>
            </div>
          )}
        </div>
        {preview?.url && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => window.open(preview.url, '_blank', 'noopener,noreferrer')}>
              <ExternalLink className="mr-2 h-4 w-4" /> Open original
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementFilePicker({ files, onChange, disabled = false }: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [preview, setPreview] = useState<AttachmentPreview | null>(null);

  const addFiles = (selected: File[]) => {
    const oversized = selected.find(file => file.size > MAX_SIZE);
    if (oversized) {
      toast({ title: 'File too large', description: `${oversized.name} exceeds the 10 MB limit.`, variant: 'error' });
      return;
    }
    const combined = [...files, ...selected];
    if (combined.length > MAX_FILES) {
      toast({ title: 'Too many files', description: 'You can attach up to 5 files per upload.', variant: 'error' });
      return;
    }
    onChange(combined);
  };

  const previewFile = async (file: File) => {
    if (file.type.startsWith('text/') || file.type === 'text/csv') {
      setPreview({ name: file.name, type: file.type || 'text/plain', size: file.size, text: await file.text() });
      return;
    }
    setPreview({
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url: URL.createObjectURL(file),
      revokeOnClose: true,
    });
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} className="hidden" type="file" multiple accept={ACCEPT} disabled={disabled} onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
      <Button type="button" variant="outline" disabled={disabled || files.length >= MAX_FILES} onClick={() => inputRef.current?.click()}>
        <Paperclip className="mr-2 h-4 w-4" /> Attach files
      </Button>
      <p className="text-xs text-muted-foreground">Up to 5 files, 10 MB each. Images, PDF, text, CSV, and Word documents are supported.</p>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <button type="button" className="min-w-0 text-left hover:text-primary" onClick={() => previewFile(file)}>
                <p className="truncate font-medium underline-offset-4 hover:underline">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(file.size)} · Click to preview</p>
              </button>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => previewFile(file)} aria-label={`Preview ${file.name}`}><Eye className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange(files.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AttachmentPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

export function AnnouncementAttachments({ announcementId, token, canManage = false }: {
  announcementId: string;
  token: string;
  canManage?: boolean;
}) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<AttachmentPreview | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await createAnnouncementsAPI(token).getAttachments(announcementId);
      setAttachments(response.data.attachments || []);
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to load attachments.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [announcementId, toast, token]);

  useEffect(() => { load(); }, [load]);

  const previewAttachment = async (attachment: Attachment) => {
    setWorkingId(attachment.id);
    try {
      const response = await createAnnouncementsAPI(token).getAttachmentDownload(announcementId, attachment.id);
      setPreview({
        name: response.data.file_name,
        type: response.data.mime_type || response.data.file_type || attachment.mime_type || attachment.file_type,
        size: response.data.file_size,
        url: response.data.file_url,
      });
    } catch (error) {
      toast({ title: 'Preview failed', description: error instanceof Error ? error.message : 'Unable to preview this file.', variant: 'error' });
    } finally {
      setWorkingId(null);
    }
  };

  const remove = async (attachment: Attachment) => {
    setWorkingId(attachment.id);
    try {
      await createAnnouncementsAPI(token).deleteAttachment(announcementId, attachment.id);
      setAttachments(current => current.filter(item => item.id !== attachment.id));
      toast({ title: 'Success', description: 'Attachment deleted successfully.' });
    } catch (error) {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Unable to delete this file.', variant: 'error' });
    } finally {
      setWorkingId(null);
    }
  };

  const upload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const response = await createAnnouncementsAPI(token).uploadAttachments(announcementId, files);
      setAttachments(current => [...current, ...response.data.attachments]);
      setFiles([]);
      toast({ title: 'Success', description: 'Attachments uploaded successfully.' });
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Unable to upload files.', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="rounded-lg border border-dashed p-4">
          <AnnouncementFilePicker files={files} onChange={setFiles} disabled={uploading} />
          {files.length > 0 && <Button type="button" className="mt-3" onClick={upload} disabled={uploading}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload selected</Button>}
        </div>
      )}
      {loading ? (
        <div className="flex items-center py-4 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading attachments...</div>
      ) : attachments.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">No files attached.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <button type="button" className="flex min-w-0 items-center gap-3 text-left hover:text-primary" onClick={() => previewAttachment(attachment)}>
                <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0"><p className="truncate text-sm font-medium underline-offset-4 hover:underline">{attachment.file_name}</p><p className="text-xs text-muted-foreground">{formatSize(attachment.file_size)} · Click to preview</p></div>
              </button>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" disabled={workingId === attachment.id} onClick={() => previewAttachment(attachment)} aria-label={`Preview ${attachment.file_name}`}>{workingId === attachment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}</Button>
                {canManage && <Button type="button" variant="ghost" size="sm" disabled={workingId === attachment.id} onClick={() => remove(attachment)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <AttachmentPreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
