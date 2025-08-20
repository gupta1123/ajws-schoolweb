// src/components/bulk-import/student-import.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { ImportPreview } from '@/components/bulk-import/import-preview';

interface StudentData {
  fullName: string;
  admissionNumber: string;
  dateOfBirth: string;
  classLevel: string;
  division: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  address: string;
}

export function StudentImport() {
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<StudentData[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'preview' | 'importing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File) => {
    // Check if file is CSV
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setImportStatus('uploading');

    // Simulate file processing
    setTimeout(() => {
      // Mock data for preview
      const mockData: StudentData[] = [
        {
          fullName: 'Aarav Patel',
          admissionNumber: '2025001',
          dateOfBirth: '2015-03-15',
          classLevel: 'Grade 5',
          division: 'A',
          fatherName: 'Rajesh Patel',
          motherName: 'Priya Patel',
          phone: '+91 98765 43210',
          email: 'aarav.patel@example.com',
          address: '123 Main Street, Mumbai'
        },
        {
          fullName: 'Diya Nair',
          admissionNumber: '2025002',
          dateOfBirth: '2015-07-22',
          classLevel: 'Grade 5',
          division: 'A',
          fatherName: 'Manoj Nair',
          motherName: 'Sunita Nair',
          phone: '+91 98765 43211',
          email: 'diya.nair@example.com',
          address: '456 Park Avenue, Mumbai'
        }
      ];

      setPreviewData(mockData);
      setImportStatus('preview');
    }, 1000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleImport = () => {
    setImportStatus('importing');
    
    // Simulate import process
    setTimeout(() => {
      setImportStatus('success');
    }, 2000);
  };

  const handleReset = () => {
    setPreviewData([]);
    setImportStatus('idle');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Student Import</CardTitle>
          <CardDescription>
            Upload a CSV file to import multiple students at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          {importStatus === 'idle' || importStatus === 'uploading' || importStatus === 'error' ? (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 font-medium">Drag and drop your CSV file</h3>
                <p className="text-sm text-gray-500 mt-2">
                  or <span className="text-primary hover:underline">browse files</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  CSV files only, max 5MB
                </p>
                <Input
                  id="file-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              <div className="text-sm text-gray-500">
                <p className="font-medium mb-2">Required CSV columns:</p>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <li>Full Name</li>
                  <li>Admission Number</li>
                  <li>Date of Birth</li>
                  <li>Class Level</li>
                  <li>Division</li>
                  <li>Father Name</li>
                  <li>Mother Name</li>
                  <li>Phone</li>
                  <li>Email</li>
                  <li>Address</li>
                </ul>
              </div>
            </div>
          ) : importStatus === 'preview' ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  File uploaded successfully. Please review the data before importing.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancel
                </Button>
                <Button onClick={handleImport}>
                  Import {previewData.length} Students
                </Button>
              </div>
            </div>
          ) : importStatus === 'importing' ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 font-medium">Importing students...</p>
              <p className="text-sm text-gray-500">This may take a few moments</p>
            </div>
          ) : importStatus === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="mt-4 font-medium text-lg">Import Successful!</h3>
              <p className="text-gray-500 mt-2">
                {previewData.length} students have been successfully imported.
              </p>
              <div className="mt-6">
                <Button onClick={handleReset}>
                  Import Another File
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {previewData.length > 0 && importStatus === 'preview' && (
        <ImportPreview data={previewData} type="students" />
      )}
    </div>
  );
}