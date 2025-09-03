// src/app/bulk-import/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Users, User, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function BulkImportPage() {
  const { user } = useAuth();

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle>Import Students</CardTitle>
              </div>
              <CardDescription>
                Bulk import student records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Upload a CSV file to import multiple students and their parent information.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/bulk-import/students">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Students
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-500" />
                <CardTitle>Import Parents</CardTitle>
              </div>
              <CardDescription>
                Bulk import parent records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Upload a CSV file to import multiple parents and link them to existing students.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/bulk-import/parents">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Parents
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <CardTitle>Import Teachers</CardTitle>
              </div>
              <CardDescription>
                Bulk import teacher records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Upload a CSV file to import multiple teachers and their professional details.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/bulk-import/teachers">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Teachers
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How to Use Bulk Import</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Download the CSV template for the type of records you want to import</li>
              <li>Fill in the required information in the CSV file</li>
              <li>Save the file and upload it using the import buttons above</li>
              <li>Review the data preview to ensure accuracy</li>
              <li>Click &quot;Import&quot; to add the records to the system</li>
            </ol>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Ensure all required fields are filled in the CSV</li>
                <li>Check data format (dates, phone numbers, etc.) before importing</li>
                <li>Large files may take several minutes to process</li>
                <li>You can review and edit records after import</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}