// src/components/passwords/bulk-password-reset.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ArrowLeft, Key, User, Users, GraduationCap, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useStaff } from '@/hooks/use-staff';
import { studentServices } from '@/lib/api/students';
import { parentServices } from '@/lib/api/parents';
import { academicServices } from '@/lib/api/academic';
import { passwordServices } from '@/lib/api/passwords';
import { Checkbox } from '@/components/ui/checkbox';
import type { Staff } from '@/types/staff';
import type { ClassDivision } from '@/types/academic';
import type { Student } from '@/lib/api/students';
import type { Parent } from '@/lib/api/parents';

type FilterType = 'staff' | 'classes';
type UserType = 'staff' | 'parent';

interface BulkPasswordResetProps {
  onBack: () => void;
}

export function BulkPasswordReset({ onBack }: BulkPasswordResetProps) {
  const { token } = useAuth();
  const { t } = useI18n();
  const { staff, loading: staffLoading, fetchStaff } = useStaff();

  // State
  const [filterType, setFilterType] = useState<FilterType>('staff');
  const [userType, setUserType] = useState<UserType>('staff');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [userPasswords, setUserPasswords] = useState<Map<string, string>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [classDivisions, setClassDivisions] = useState<ClassDivision[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetProgress, setResetProgress] = useState<{ total: number; completed: number; failed: number } | null>(null);

  // Fetch class divisions
  useEffect(() => {
    const fetchClasses = async () => {
      if (!token || filterType !== 'classes') return;
      try {
        setLoadingClasses(true);
        const response = await academicServices.getClassDivisions(token);
        if (response.status === 'success' && response.data) {
          setClassDivisions(response.data.class_divisions || []);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [token, filterType]);

  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudentsData = async () => {
      if (!token || !selectedClassId || filterType !== 'classes' || userType !== 'staff') return;
      try {
        setLoadingStudents(true);
        const response = await studentServices.getAllStudents(token, {
          class_division_id: selectedClassId,
          limit: 1000
        });
        if (!(response instanceof Blob) && 'status' in response && response.status === 'success' && 'data' in response) {
          setStudents(response.data.students || []);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudentsData();
  }, [token, selectedClassId, filterType, userType]);

  // Fetch parents when class is selected
  useEffect(() => {
    const fetchParentsData = async () => {
      if (!token || !selectedClassId || filterType !== 'classes' || userType !== 'parent') return;
      try {
        setLoadingParents(true);
        const response = await parentServices.getAllParents(token, {
          class_division_id: selectedClassId,
          limit: 1000
        });
        if (!(response instanceof Blob) && 'status' in response && response.status === 'success' && 'data' in response) {
          setParents(response.data.parents || []);
        }
      } catch (err) {
        console.error('Error fetching parents:', err);
      } finally {
        setLoadingParents(false);
      }
    };
    fetchParentsData();
  }, [token, selectedClassId, filterType, userType]);

  // Fetch staff when filter type is staff
  useEffect(() => {
    if (filterType === 'staff' && token) {
      fetchStaff();
    }
  }, [filterType, token, fetchStaff]);

  // Filter users based on search
  const filteredStaff = useMemo(() => {
    if (filterType !== 'staff') return [];
    return staff.filter(s => 
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone_number && s.phone_number.includes(searchTerm))
    );
  }, [staff, searchTerm, filterType]);

  const filteredStudents = useMemo(() => {
    if (filterType !== 'classes' || userType !== 'staff') return [];
    return students.filter(s => 
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm, filterType, userType]);

  const filteredParents = useMemo(() => {
    if (filterType !== 'classes' || userType !== 'parent') return [];
    return parents.filter(p => 
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone_number?.includes(searchTerm)
    );
  }, [parents, searchTerm, filterType, userType]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
        // Remove password when user is deselected
        setUserPasswords(prevPasswords => {
          const newPasswords = new Map(prevPasswords);
          newPasswords.delete(userId);
          return newPasswords;
        });
      } else {
        newSet.add(userId);
        // Initialize password field for new user
        setUserPasswords(prevPasswords => {
          const newPasswords = new Map(prevPasswords);
          newPasswords.set(userId, '');
          return newPasswords;
        });
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    let allUserIds: string[] = [];
    if (filterType === 'staff') {
      allUserIds = filteredStaff.map(s => s.user_id || s.id);
    } else if (filterType === 'classes' && userType === 'staff') {
      allUserIds = filteredStudents.map(s => s.id);
    } else if (filterType === 'classes' && userType === 'parent') {
      allUserIds = filteredParents.map(p => p.id);
    }

    if (selectedUserIds.size === allUserIds.length) {
      setSelectedUserIds(new Set());
      setUserPasswords(new Map());
    } else {
      setSelectedUserIds(new Set(allUserIds));
      // Initialize passwords for all users
      const newPasswords = new Map<string, string>();
      allUserIds.forEach(id => {
        newPasswords.set(id, '');
      });
      setUserPasswords(newPasswords);
    }
  };

  const updateUserPassword = (userId: string, value: string) => {
    setUserPasswords(prev => {
      const newPasswords = new Map(prev);
      newPasswords.set(userId, value);
      return newPasswords;
    });
  };

  const handleBulkResetPassword = async () => {
    if (selectedUserIds.size === 0) {
      setError(t('passwords.errors.selectUsers', 'Please select at least one user'));
      return;
    }

    // Validate all passwords
    const userIds = Array.from(selectedUserIds);
    const validationErrors: string[] = [];

    for (const userId of userIds) {
      const userPassword = userPasswords.get(userId);
      if (!userPassword || userPassword.trim() === '') {
        validationErrors.push(t('passwords.errors.userPasswordMissing', 'Password missing for one or more users'));
        break;
      }
      if (userPassword.length < 6) {
        validationErrors.push(t('passwords.errors.passwordTooShort', 'Password must be at least 6 characters for all users'));
        break;
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    if (!token) {
      setError(t('passwords.errors.noToken', 'Authentication required'));
      return;
    }

    setError(null);
    setSuccess(null);
    setResetting(true);
    setResetProgress({ total: userIds.length, completed: 0, failed: 0 });

    try {
      let successCount = 0;
      let failedCount = 0;
      const errors: Array<{ user_id: string; error: string }> = [];

      // Reset passwords individually for each user
      for (const userId of userIds) {
        const userPassword = userPasswords.get(userId);
        if (!userPassword) continue;

        try {
          const success = await passwordServices.resetPassword(token, userId, userPassword);
          if (success) {
            successCount++;
            setResetProgress(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
          } else {
            failedCount++;
            errors.push({ user_id: userId, error: 'Failed to reset password' });
            setResetProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
          }
        } catch (err: unknown) {
          failedCount++;
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push({ user_id: userId, error: errorMessage });
          setResetProgress(prev => prev ? { ...prev, failed: prev.failed + 1 } : null);
        }
      }

      if (failedCount === 0) {
        setSuccess(
          t('passwords.success.bulkResetSuccess', 'Successfully reset passwords for {count} users').replace('{count}', successCount.toString())
        );
        setSelectedUserIds(new Set());
        setUserPasswords(new Map());
        setResetProgress(null);
        setTimeout(() => {
          setSuccess(null);
          setResetProgress(null);
        }, 5000);
      } else {
        setError(
          t('passwords.errors.bulkResetPartial', 'Reset completed with {failed} failures out of {total}')
            .replace('{failed}', failedCount.toString())
            .replace('{total}', userIds.length.toString())
        );
        setResetProgress(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('passwords.errors.bulkResetFailed', 'Failed to reset passwords');
      setError(errorMessage);
      setResetProgress(null);
    } finally {
      setResetting(false);
    }
  };

  const allSelected = useMemo(() => {
    let allUserIds: string[] = [];
    if (filterType === 'staff') {
      allUserIds = filteredStaff.map(s => s.user_id || s.id);
    } else if (filterType === 'classes' && userType === 'staff') {
      allUserIds = filteredStudents.map(s => s.id);
    } else if (filterType === 'classes' && userType === 'parent') {
      allUserIds = filteredParents.map(p => p.id);
    }
    return allUserIds.length > 0 && allUserIds.every(id => selectedUserIds.has(id));
  }, [filterType, userType, filteredStaff, filteredStudents, filteredParents, selectedUserIds]);

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back', 'Back')}
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <Key className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('passwords.bulk.title', 'Bulk Password Reset')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('passwords.bulk.subtitle', 'Select multiple users and reset their passwords at once')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - Filters and User Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('passwords.selectUsers', 'Select Users')}</CardTitle>
            <CardDescription>
              {t('passwords.selectUsersDescription', 'Filter and select multiple users to reset passwords')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Type */}
            <div className="space-y-2">
              <Label>{t('passwords.filterBy', 'Filter By')}</Label>
              <Select value={filterType} onValueChange={(v) => {
                setFilterType(v as FilterType);
                setSelectedClassId('');
                setSelectedUserIds(new Set());
                setUserType('staff');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('passwords.staff', 'Staff')}
                    </div>
                  </SelectItem>
                  <SelectItem value="classes">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      {t('passwords.classes', 'Classes')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Type (only for classes) */}
            {filterType === 'classes' && (
              <div className="space-y-2">
                <Label>{t('passwords.userType', 'User Type')}</Label>
                <Select value={userType} onValueChange={(v) => {
                  setUserType(v as UserType);
                  setSelectedUserIds(new Set());
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        {t('passwords.students', 'Students')}
                      </div>
                    </SelectItem>
                    <SelectItem value="parent">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {t('passwords.parents', 'Parents')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Class Selection (only for classes filter) */}
            {filterType === 'classes' && (
              <div className="space-y-2">
                <Label>{t('passwords.selectClass', 'Select Class')}</Label>
                <Select 
                  value={selectedClassId} 
                  onValueChange={(v) => {
                    setSelectedClassId(v);
                    setSelectedUserIds(new Set());
                  }}
                  disabled={loadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('passwords.selectClassPlaceholder', 'Select a class')} />
                  </SelectTrigger>
                  <SelectContent>
                    {classDivisions.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.class_level?.name} {cls.division} ({cls.academic_year?.year_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <Label>{t('common.search', 'Search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('passwords.searchPlaceholder', 'Search by name or phone...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Select All */}
            <div className="flex items-center justify-between">
              <Label>{t('passwords.selectedCount', 'Selected: {count}').replace('{count}', selectedUserIds.size.toString())}</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                disabled={
                  (filterType === 'staff' && filteredStaff.length === 0) ||
                  (filterType === 'classes' && userType === 'staff' && filteredStudents.length === 0) ||
                  (filterType === 'classes' && userType === 'parent' && filteredParents.length === 0)
                }
              >
                {allSelected ? t('passwords.deselectAll', 'Deselect All') : t('passwords.selectAll', 'Select All')}
              </Button>
            </div>

            {/* User List */}
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>{t('common.name', 'Name')}</TableHead>
                    <TableHead>{t('common.phone', 'Phone')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterType === 'staff' && (
                    staffLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          {t('passwords.noUsersFound', 'No users found')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((s) => {
                        const userId = s.user_id || s.id;
                        const isSelected = selectedUserIds.has(userId);
                        return (
                          <TableRow 
                            key={s.id} 
                            className={isSelected ? 'bg-primary/10' : 'cursor-pointer'}
                            onClick={() => toggleUserSelection(userId)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    toggleUserSelection(userId);
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell>{s.full_name}</TableCell>
                            <TableCell>{s.phone_number || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                  {filterType === 'classes' && userType === 'staff' && (
                    loadingStudents ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          {t('passwords.noUsersFound', 'No users found')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((s) => {
                        const isSelected = selectedUserIds.has(s.id);
                        return (
                          <TableRow 
                            key={s.id} 
                            className={isSelected ? 'bg-primary/10' : 'cursor-pointer'}
                            onClick={() => toggleUserSelection(s.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    toggleUserSelection(s.id);
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell>{s.full_name}</TableCell>
                            <TableCell>{s.admission_number || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                  {filterType === 'classes' && userType === 'parent' && (
                    loadingParents ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredParents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          {t('passwords.noUsersFound', 'No users found')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredParents.map((p) => {
                        const isSelected = selectedUserIds.has(p.id);
                        return (
                          <TableRow 
                            key={p.id} 
                            className={isSelected ? 'bg-primary/10' : 'cursor-pointer'}
                            onClick={() => toggleUserSelection(p.id)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    toggleUserSelection(p.id);
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell>{p.full_name}</TableCell>
                            <TableCell>{p.phone_number || '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Password Reset Table */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>{t('passwords.resetPasswords', 'Reset Passwords')}</CardTitle>
            <CardDescription>
              {selectedUserIds.size > 0
                ? t('passwords.resetPasswordsFor', 'Reset passwords for {count} users').replace('{count}', selectedUserIds.size.toString())
                : t('passwords.selectUsersFirst', 'Select users first')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {resetProgress && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  {t('passwords.progress', 'Progress: {completed}/{total} completed, {failed} failed')
                    .replace('{completed}', resetProgress.completed.toString())
                    .replace('{total}', resetProgress.total.toString())
                    .replace('{failed}', resetProgress.failed.toString())}
                </AlertDescription>
              </Alert>
            )}

            {selectedUserIds.size > 0 ? (
              <>
                <div className="flex-1 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/2">{t('common.name', 'Name')}</TableHead>
                        <TableHead className="w-1/2">{t('passwords.password', 'Password')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from(selectedUserIds).map((userId) => {
                        // Get user details
                        let user: Staff | Student | Parent | null = null;
                        if (filterType === 'staff') {
                          user = filteredStaff.find(s => (s.user_id || s.id) === userId) ?? null;
                        } else if (filterType === 'classes' && userType === 'staff') {
                          user = filteredStudents.find(s => s.id === userId) ?? null;
                        } else if (filterType === 'classes' && userType === 'parent') {
                          user = filteredParents.find(p => p.id === userId) ?? null;
                        }

                        if (!user) return null;

                        const userPassword = userPasswords.get(userId) || '';
                        const isValid = userPassword && userPassword.length >= 6;

                        // Get display value for phone/admission number
                        const getDisplayValue = (u: Staff | Student | Parent): string => {
                          if ('phone_number' in u) {
                            return u.phone_number || '-';
                          }
                          if ('admission_number' in u) {
                            return u.admission_number || '-';
                          }
                          return '-';
                        };

                        return (
                          <TableRow key={userId}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {getDisplayValue(user)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  value={userPassword}
                                  onChange={(e) => updateUserPassword(userId, e.target.value)}
                                  placeholder={t('passwords.enterNewPassword', 'Enter new password')}
                                  disabled={resetting}
                                  className="text-sm"
                                />
                                {userPassword && userPassword.length < 6 && (
                                  <p className="text-xs text-red-500">{t('passwords.errors.passwordTooShort', 'Password must be at least 6 characters')}</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    className="w-full"
                    onClick={handleBulkResetPassword}
                    disabled={selectedUserIds.size === 0 || resetting || Array.from(selectedUserIds).some(userId => {
                      const pwd = userPasswords.get(userId);
                      return !pwd || pwd.trim() === '' || pwd.length < 6;
                    })}
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('passwords.resetting', 'Resetting...')}
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        {t('passwords.save', 'Save')}
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex-1 flex items-center justify-center">
                <div>
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t('passwords.selectUsersFirst', 'Select users first')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

