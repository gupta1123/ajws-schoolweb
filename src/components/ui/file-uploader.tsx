// src/components/ui/file-uploader.tsx

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useState, useRef } from 'react';

interface FileUploaderProps {
  onFilesSelected?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUploader({
  onFilesSelected,
  onUpload,
  accept,
  maxFiles = 5,
  maxSize = 10, // 10MB default
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<Array<{
    file: File;
    status: 'pending' | 'success' | 'error';
    message?: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file count
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files.`);
      return;
    }
    
    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(file => 
      file.size > maxSize * 1024 * 1024
    );
    
    if (oversizedFiles.length > 0) {
      alert(`Files must be smaller than ${maxSize}MB. The following files are too large: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);
    
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    // Initialize upload results
    const initialResults = files.map(file => ({
      file,
      status: 'pending' as const
    }));
    setUploadResults(initialResults);
    
    try {
      if (onUpload) {
        await onUpload(files);
      }
      
      // Update results to success
      const successResults = files.map(file => ({
        file,
        status: 'success' as const,
        message: 'Upload successful'
      }));
      setUploadResults(successResults);
    } catch (error) {
      // Update results to error
      const errorResults = files.map(file => ({
        file,
        status: 'error' as const,
        message: error instanceof Error ? error.message : 'Upload failed'
      }));
      setUploadResults(errorResults);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Upload
        </CardTitle>
        <CardDescription>
          Drag and drop files or click to browse. Max {maxFiles} files, {maxSize}MB each.
          {accept && ` Accepted formats: ${accept}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            multiple={maxFiles > 1}
            accept={accept}
          />
          
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">Click to upload files</p>
          <p className="text-sm text-muted-foreground">
            or drag and drop files here
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Selected Files ({files.length})</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFiles([]);
                    setUploadResults([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Clear All
                </Button>
                <Button 
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {files.map((file, index) => {
                const result = uploadResults[index];
                return (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      {result ? getStatusIcon(result.status) : <File className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                          {result?.message && (
                            <span className={`ml-2 ${getStatusColor(result.status)}`}>
                              {result.message}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}