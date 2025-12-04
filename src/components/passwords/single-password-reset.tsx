// src/components/passwords/single-password-reset.tsx

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
import { SearchableClassDropdown } from '@/components/ui/searchable-class-dropdown';
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
import type { Parent } from '@/lib/api/parents';
import type { ClassDivision as SearchableClassDivision } from '@/components/ui/searchable-class-dropdown';

type FilterType = 'staff' | 'classes';
type UserType = 'staff' | 'parent';

interface SinglePasswordResetProps {
  onBack: () => void;
}

export function SinglePasswordReset({ onBack }: SinglePasswordResetProps) {
  const { token } = useAuth();
  const { t } = useI18n();
  const { staff, loading: staffLoading, fetchStaff } = useStaff();

  // State
  const [filterType, setFilterType] = useState<FilterType>('staff');
  const [userType, setUserType] = useState<UserType>('parent');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [classDivisions, setClassDivisions] = useState<SearchableClassDivision[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingParents, setLoadingParents] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch class divisions
  useEffect(() => {
    const fetchClasses = async () => {
      if (!token || filterType !== 'classes') return;
      try {
        setLoadingClasses(true);
        const response = await academicServices.getClassDivisions(token);
        if (response.status === 'success' && response.data) {
          // Filter and map to match SearchableClassDropdown format
          const divisions: SearchableClassDivision[] = (response.data.class_divisions || [])
            .filter((div): boolean => !!div.class_level && !!div.academic_year)
            .map((div): SearchableClassDivision => ({
              id: div.id,
              division: div.division,
              class_level: div.class_level!,
              academic_year: div.academic_year!
            }));
          setClassDivisions(divisions);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [token, filterType]);

  // Students fetching removed - only parents are available for classes filter

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

  // Students filtering removed - only parents are available for classes filter

  const filteredParents = useMemo(() => {
    if (filterType !== 'classes' || userType !== 'parent') return [];
    return parents.filter(p => 
      p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone_number?.includes(searchTerm)
    );
  }, [parents, searchTerm, filterType, userType]);

  // Get selected user details
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    if (filterType === 'staff') {
      return staff.find(s => s.user_id === selectedUserId || s.id === selectedUserId);
    }
    if (filterType === 'classes' && userType === 'parent') {
      return parents.find(p => p.id === selectedUserId);
    }
    return null;
  }, [selectedUserId, filterType, userType, staff, parents]);

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword || !confirmPassword) {
      setError(t('passwords.errors.fillAllFields', 'Please fill all fields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwords.errors.passwordMismatch', 'Passwords do not match'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwords.errors.passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }

    if (!token) {
      setError(t('passwords.errors.noToken', 'Authentication required'));
      return;
    }

    setError(null);
    setSuccess(null);
    setResetting(true);

    try {
      let userId = selectedUserId;
      
      // For staff, use their user_id if available, otherwise use id
      if (filterType === 'staff' && selectedUser && 'user_id' in selectedUser) {
        userId = selectedUser.user_id || selectedUserId;
      }
      // For parents, use their id directly (parent.id is the user_id, no separate user_id field)

      const success = await passwordServices.resetPassword(token, userId, newPassword);
      
      if (success) {
        setSuccess(t('passwords.success.resetSuccess', 'Password reset successfully'));
        setNewPassword('');
        setConfirmPassword('');
        setSelectedUserId('');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(t('passwords.errors.resetFailed', 'Failed to reset password'));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('passwords.errors.resetFailed', 'Failed to reset password');
      setError(errorMessage);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back', 'Back')}
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <Key className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('passwords.single.title', 'Single Password Reset')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('passwords.single.subtitle', 'Select a user and reset their password')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Filters and User Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t('passwords.selectUser', 'Select User')}</CardTitle>
            <CardDescription>
              {t('passwords.selectUserDescription', 'Filter and select the user to reset password')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter Type */}
            <div className="space-y-2">
              <Label>{t('passwords.filterBy', 'Filter By')}</Label>
              <Select value={filterType} onValueChange={(v) => {
                setFilterType(v as FilterType);
                setSelectedClassId('');
                setSelectedUserId('');
                setUserType('parent');
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

            {/* User Type (only for classes) - Only Parents */}
            {filterType === 'classes' && (
              <div className="space-y-2">
                <Label>{t('passwords.userType', 'User Type')}</Label>
                <Select value="parent" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <SearchableClassDropdown
                  classes={classDivisions}
                  value={selectedClassId}
                  onValueChange={(v) => {
                    setSelectedClassId(v);
                    setSelectedUserId('');
                  }}
                  placeholder={t('passwords.selectClassPlaceholder', 'Select a class')}
                  label={t('passwords.selectClass', 'Select Class')}
                  disabled={loadingClasses}
                  showAcademicYear={true}
                />
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
                      filteredStaff.map((s) => (
                        <TableRow 
                          key={s.id} 
                          className={selectedUserId === (s.user_id || s.id) ? 'bg-primary/10' : 'cursor-pointer'}
                          onClick={() => setSelectedUserId(s.user_id || s.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedUserId === (s.user_id || s.id)}
                              onCheckedChange={() => setSelectedUserId(selectedUserId === (s.user_id || s.id) ? '' : (s.user_id || s.id))}
                            />
                          </TableCell>
                          <TableCell>{s.full_name}</TableCell>
                          <TableCell>{s.phone_number || '-'}</TableCell>
                        </TableRow>
                      ))
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
                      filteredParents.map((p) => (
                        <TableRow 
                          key={p.id} 
                          className={selectedUserId === p.id ? 'bg-primary/10' : 'cursor-pointer'}
                          onClick={() => setSelectedUserId(p.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedUserId === p.id}
                              onCheckedChange={() => setSelectedUserId(selectedUserId === p.id ? '' : p.id)}
                            />
                          </TableCell>
                          <TableCell>{p.full_name}</TableCell>
                          <TableCell>{p.phone_number || '-'}</TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Password Reset Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('passwords.resetPassword', 'Reset Password')}</CardTitle>
            <CardDescription>
              {selectedUser 
                ? t('passwords.resetPasswordFor', 'Reset password for: {name}').replace('{name}', selectedUser.full_name)
                : t('passwords.selectUserFirst', 'Select a user first')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {selectedUser && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {'phone_number' in selectedUser ? selectedUser.phone_number : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('passwords.newPassword', 'New Password')}</Label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('passwords.enterNewPassword', 'Enter new password')}
                disabled={!selectedUser || resetting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('passwords.confirmPassword', 'Confirm Password')}</Label>
              <Input
                id="confirmPassword"
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('passwords.confirmNewPassword', 'Confirm new password')}
                disabled={!selectedUser || resetting}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleResetPassword}
              disabled={!selectedUser || !newPassword || !confirmPassword || resetting}
            >
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('passwords.resetting', 'Resetting...')}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {t('passwords.resetPassword', 'Reset Password')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

