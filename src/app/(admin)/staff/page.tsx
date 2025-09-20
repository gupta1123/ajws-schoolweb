// src/app/(admin)/staff/page.tsx

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Search, Plus, Loader2, AlertTriangle, UserCog } from 'lucide-react';
import { useStaff } from '@/hooks/use-staff';
import { useI18n } from '@/lib/i18n/context';

import Link from 'next/link';
import type { Staff as StaffType } from '@/types/staff';



export default function StaffPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useI18n();
  const {
    staff,
    loading,
    error,
    clearError,
    deleteStaff
  } = useStaff();

  // UI states
  const [searchTerm, setSearchTerm] = useState('');

  // Filter staff based on search only (removed role and status filters)
  const filteredStaff = useMemo(() => {
    return staff
      .filter(staffMember => 
        searchTerm === '' || 
        staffMember.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staffMember.phone_number && staffMember.phone_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [staff, searchTerm]);

  const handleAddNew = () => {
    router.push('/staff/create');
  };

  const handleDelete = async (staffId: string) => {
    const success = await deleteStaff(staffId);
    if (success) {
      // Staff list will be automatically refreshed
    }
  };

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('access.deniedTitle', 'Access Denied')}</h2>
          <p className="text-gray-600">{t('access.adminsOnly', 'Only admins and principals can access this page.')}</p>
        </div>
      </div>
    );
  }

  // Format class teacher information
  const formatClassTeacherInfo = (classTeacherOf: Array<{
    class_division_id: string;
    class_name: string;
    academic_year: string;
    is_primary?: boolean;
    is_legacy?: boolean;
  }>) => {
    if (!classTeacherOf || classTeacherOf.length === 0) return t('common.none', 'None');
    return classTeacherOf.map((cls) => cls.class_name).join(', ');
  };

  // Build display string for subjects taught (from teachers API enrichment only)
  const getSubjectsText = (staffMember: StaffType): string => {
    const subjects = staffMember.teaching_details?.subjects_taught || [];
    return subjects.length > 0 ? subjects.join(', ') : t('common.none', 'None');
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={t('staff.searchPlaceholder', 'Search staff...')} 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              {t('staff.addStaff', 'Add Staff')}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/staff/assign-subjects')}
              className="flex items-center gap-2"
            >
              <UserCog className="mr-2 h-4 w-4" />
              {t('staff.assignSubjects', 'Assign Subjects')}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('staff.list.title', 'Staff List')}</CardTitle>
            <CardDescription>
              {t('staff.list.subtitle', 'List of all staff members in the school')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('staff.cols.name', 'Name')}</TableHead>
                    <TableHead>{t('staff.cols.phone', 'Phone')}</TableHead>
                    <TableHead>{t('staff.cols.classTeacherOf', 'Class Teacher Of')}</TableHead>
                    <TableHead>{t('staff.cols.subjectsTaught', 'Subjects Taught')}</TableHead>
                    <TableHead className="text-right">{t('academicSetup.cols.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{t('staff.loading', 'Loading staff...')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <span className="text-muted-foreground">
                          {searchTerm ? t('staff.empty.noMatch', 'No staff found matching the search term') : t('staff.empty.noStaff', 'No staff members found')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff) => (
                        <TableRow key={staff.id}>
                          <TableCell className="font-medium">{staff.full_name}</TableCell>
                          <TableCell>{staff.phone_number}</TableCell>
                          <TableCell>
                            {staff.teaching_details?.class_teacher_of && staff.teaching_details.class_teacher_of.length > 0
                              ? formatClassTeacherInfo(staff.teaching_details.class_teacher_of)
                              : t('common.none', 'None')}
                          </TableCell>
                          <TableCell>{getSubjectsText(staff)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/staff/${staff.id}`}>
                              {t('actions.view', 'View')}
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/staff/${staff.id}/edit`}>
                              {t('actions.edit', 'Edit')}
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(staff.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {t('actions.delete', 'Delete')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
