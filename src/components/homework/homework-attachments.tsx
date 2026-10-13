// src/components/homework/homework-attachments.tsx
//
// Files already on a homework (edit page): open, replace, delete, and add more.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, File as FileIcon, FileText, Image as ImageIcon, Loader2, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnnouncementFilePicker } from '@/components/announcements/announcement-attachments';
import { homeworkServices } from '@/lib/api/homework';
import type { Attachment } from '@/types/homework';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n/context';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ajws-school-ba8ae5e3f955.herokuapp.com';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(type: string) {
  if (type?.startsWith('image/')) return <ImageIcon className="text-tone-success" />;
  if (type?.includes('pdf')) return <FileText className="text-tone-danger" />;
  if (type?.includes('word') || type?.includes('document')) return <FileText className="text-tone-info" />;
  return <FileIcon className="text-muted-foreground" />;
}

export function HomeworkAttachments({ homeworkId, token }: { homeworkId: string; token: string }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Attachment | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<Attachment | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await homeworkServices.getHomeworkAttachments(homeworkId, token);
      if (response.status === 'success' && 'data' in response) setItems(response.data?.attachments ?? []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  }, [homeworkId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const urlFor = (a: Attachment) =>
    a.download_url ||
    (a.download_endpoint ? `${API_BASE}${a.download_endpoint}` : `${API_BASE}/api/homework/${homeworkId}/attachments/${a.id}`);

  const fail = (description: string) => toast({ title: t('common.error', 'Error'), description, variant: 'error' });

  const upload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const response = await homeworkServices.uploadAttachments(homeworkId, files, token);
      if (response.status !== 'success') throw new Error('upload failed');
      toast({ title: t('common.success', 'Success'), description: t('homeworkTeacher.form.filesAdded', 'Files added.'), variant: 'success' });
      setFiles([]);
      await load();
    } catch (error) {
      console.error('Error uploading files:', error);
      fail(t('homeworkTeacher.create.uploadFailed', 'Failed to upload files. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const replace = async (attachment: Attachment, file: File) => {
    setWorkingId(attachment.id);
    try {
      const body = new FormData();
      body.append('files', file);
      const response = await homeworkServices.updateAttachment(homeworkId, attachment.id, body, token);
      if (response.status !== 'success') throw new Error('replace failed');
      toast({ title: t('common.success', 'Success'), description: t('homeworkTeacher.form.fileReplaced', 'File replaced.'), variant: 'success' });
      await load();
    } catch (error) {
      console.error('Error updating attachment:', error);
      fail(t('homeworkTeacher.form.replaceFailed', 'Failed to replace the file. Please try again.'));
    } finally {
      setWorkingId(null);
    }
  };

  const remove = async (attachment: Attachment) => {
    setWorkingId(attachment.id);
    try {
      const response = await homeworkServices.deleteAttachment(homeworkId, attachment.id, token);
      if (response.status !== 'success') throw new Error('delete failed');
      setItems((prev) => prev.filter((a) => a.id !== attachment.id));
      toast({ title: t('common.success', 'Success'), description: t('homeworkTeacher.form.fileRemoved', 'File removed.'), variant: 'success' });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      fail(t('homeworkTeacher.form.removeFailed', 'Failed to remove the file. Please try again.'));
    } finally {
      setWorkingId(null);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={replaceInput}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceTarget.current) replace(replaceTarget.current, file);
          replaceTarget.current = null;
          e.target.value = '';
        }}
      />

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t('common.loading', 'Loading...')}
        </p>
      ) : items.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2">
              <span className="shrink-0 [&_svg]:size-5">{fileIcon(a.file_type)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight" title={a.file_name}>
                  {a.file_name}
                </p>
                <p className="text-xs text-muted-foreground">{formatSize(a.file_size)}</p>
              </div>
              {workingId === a.id ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" asChild title={t('homeworkTeacher.form.open', 'Open')}>
                    <a href={urlFor(a)} target="_blank" rel="noopener noreferrer" aria-label={t('homeworkTeacher.form.open', 'Open')}>
                      <ExternalLink />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-foreground"
                    title={t('homeworkTeacher.form.replace', 'Replace')}
                    aria-label={t('homeworkTeacher.form.replace', 'Replace')}
                    onClick={() => {
                      replaceTarget.current = a;
                      replaceInput.current?.click();
                    }}
                  >
                    <RefreshCw />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:bg-tone-danger-soft hover:text-tone-danger"
                    title={t('actions.delete', 'Delete')}
                    aria-label={t('actions.delete', 'Delete')}
                    onClick={() => setPendingDelete(a)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t('homeworkTeacher.form.noFiles', 'No files attached yet.')}</p>
      )}

      <div className="space-y-3">
        <AnnouncementFilePicker files={files} onChange={setFiles} disabled={uploading} />
        {files.length > 0 && (
          <Button type="button" onClick={upload} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {t('homeworkTeacher.form.uploadSelected', 'Upload selected')}
          </Button>
        )}
      </div>

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('homeworkTeacher.form.removeFileTitle', 'Remove this file?')}</DialogTitle>
            <DialogDescription className="break-all">{pendingDelete?.file_name}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              {t('actions.cancel', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={() => pendingDelete && remove(pendingDelete)}>
              {t('actions.delete', 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
