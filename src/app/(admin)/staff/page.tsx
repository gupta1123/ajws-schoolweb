// src/app/(admin)/staff/page.tsx

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Plus, Edit, Trash2, Loader2, AlertTriangle, User, Phone, Shield, Key, Save, X, UserPlus, UserCog, Eye } from 'lucide-react';
import { useStaff } from '@/hooks/use-staff';
import type { Staff, UpdateStaffRequest } from '@/types/staff';
import Link from 'next/link';

// Extended interface for form handling
interface StaffFormData extends Partial<Staff> {
  password?: string;
}

// Available roles and departments for filtering
const availableRoles = ['All', 'Admin', 'Principal', 'Teacher'];
const availableStatuses = ['All', 'Active', 'Inactive'];

export default function StaffPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    staff,
    loading,
    error,
    clearError,
    updateStaff,
    deleteStaff,
    createStaffWithUser
  } = useStaff();

  // UI states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffFormData>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [localError, setLocalError] = useState<string | null>(null);

  // Filter staff based on search and filters
  const filteredStaff = useMemo(() => {
    return staff
      .filter(staffMember => 
        searchTerm === '' || 
        staffMember.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (staffMember.phone_number && staffMember.phone_number.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter(staffMember => roleFilter === 'All' || staffMember.role.toLowerCase() === roleFilter.toLowerCase())
      .filter(staffMember => {
        if (statusFilter === 'All') return true;
        const isActive = staffMember.is_active !== false; // Default to active if not specified
        return statusFilter === 'Active' ? isActive : !isActive;
      });
  }, [staff, searchTerm, roleFilter, statusFilter]);

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentStaff({ 
      full_name: '', 
      role: 'teacher', 
      phone_number: '', 
      password: '',
      is_active: true
    });
    setLocalError(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (staffMember: Staff) => {
    setIsEditing(true);
    setCurrentStaff({ 
      id: staffMember.id,
      full_name: staffMember.full_name,
      role: staffMember.role,
      phone_number: staffMember.phone_number,
      is_active: staffMember.is_active
    });
    setLocalError(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (staffId: string) => {
    const success = await deleteStaff(staffId);
    if (success) {
      // Staff list will be automatically refreshed
    }
  };

  const handleSave = async () => {
    console.log('handleSave called with:', currentStaff);
    
    if (!currentStaff.full_name || !currentStaff.role || !currentStaff.phone_number) {
      setLocalError('Please fill in all required fields');
      return; // Basic validation
    }

    // For new staff, password is required
    if (!isEditing && !currentStaff.password) {
      setLocalError('Password is required for new staff members');
      return;
    }

    let success = false;
    if (isEditing && currentStaff.id) {
      console.log('Updating staff member...');
      const updateData: UpdateStaffRequest = {
        full_name: currentStaff.full_name,
        role: currentStaff.role,
        department: currentStaff.role, // Use role as department
        phone_number: currentStaff.phone_number,
        designation: 'Teacher', // Default designation
        is_active: currentStaff.is_active
      };
      success = await updateStaff(currentStaff.id, updateData);
    } else {
      console.log('Creating new staff member...');
      // Use the with-user endpoint for creating staff with password
      const createData = {
        full_name: currentStaff.full_name!,
        phone_number: currentStaff.phone_number!,
        role: currentStaff.role!.toLowerCase(), // API expects lowercase
        department: currentStaff.role!, // Use role as department (e.g., "Mathematics", "Science")
        designation: 'Teacher', // Default designation
        password: currentStaff.password!,
        user_role: currentStaff.role!.toLowerCase() // API expects lowercase
      };
      console.log('Create data:', createData);
      success = await createStaffWithUser(createData);
    }

    console.log('Operation result:', success);
    if (success) {
      setIsDialogOpen(false);
      setCurrentStaff({});
      setLocalError(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentStaff({ ...currentStaff, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentStaff({ ...currentStaff, [name]: value });
  };

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
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search staff..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
            </select>
            <select 
              className="border rounded-md px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
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
            <CardTitle>Staff List</CardTitle>
            <CardDescription>
              List of all staff members in the school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Loading staff...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <span className="text-muted-foreground">
                          {searchTerm || roleFilter !== 'All' || statusFilter !== 'All'
                            ? 'No staff found matching the filters'
                            : 'No staff members found'
                          }
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.full_name}</TableCell>
                        <TableCell className="capitalize">{staff.role}</TableCell>
                        <TableCell>{staff.phone_number}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            staff.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {staff.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/staff/${staff.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/staff/${staff.id}/edit`}>
                              Edit
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(staff.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Delete
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
      
      {/* Add/Edit Staff Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <UserCog className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">
                  {isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {isEditing ? 'Update staff information' : 'Create a new staff account'}
                </p>
              </div>
            </div>
          </DialogHeader>
          
          {/* Local Error Display */}
          {localError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>{localError}</span>
                <Button variant="ghost" size="sm" onClick={() => setLocalError(null)} className="ml-auto">
                  ×
                </Button>
              </div>
            </div>
          )}
          
          <div className="py-6 space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-sm font-medium">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="full_name"
                          name="full_name"
                          value={currentStaff?.full_name || ''}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-sm font-medium">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={currentStaff?.phone_number || ''}
                          onChange={handleInputChange}
                          placeholder="Enter phone number"
                          className="pl-10 bg-muted cursor-not-allowed opacity-60"
                          readOnly
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Phone number cannot be changed. Contact admin for updates.
                      </p>
                    </div>
                  </div>
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Professional Information</h3>
              </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-medium">Role *</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                        <Select
                          name="role"
                          value={currentStaff?.role || ''}
                          onValueChange={(value) => handleSelectChange('role', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.filter(role => role !== 'All').map(role =>
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  {role}
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">Account Status</Label>
                      <Select
                        name="status"
                        value={currentStaff?.is_active !== false ? 'Active' : 'Inactive'}
                        onValueChange={(value) => handleSelectChange('is_active', value === 'Active' ? 'true' : 'false')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStatuses.filter(status => status !== 'All').map(status =>
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                {status === 'Active' ? (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                ) : (
                                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                )}
                                {status}
                              </div>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
            </div>

            {/* Account Security Section */}
            {!isEditing && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Key className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Account Security</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Initial Password *</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={currentStaff?.password || ''}
                        onChange={handleInputChange}
                        placeholder="Set initial password"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will be the initial password for the staff member&apos;s user account
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Update Staff' : 'Create Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}