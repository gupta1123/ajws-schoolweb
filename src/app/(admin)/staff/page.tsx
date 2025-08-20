// src/app/(admin)/staff/page.tsx

'use client';

import { useState, useMemo } from 'react';
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
import { Search, Plus, Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useStaff } from '@/hooks/use-staff';
import type { Staff, UpdateStaffRequest } from '@/types/staff';

// Extended interface for form handling
interface StaffFormData extends Partial<Staff> {
  password?: string;
}

// Available roles and departments for filtering
const availableRoles = ['All', 'Admin', 'Principal', 'Teacher', 'Librarian', 'Accountant'];
const availableStatuses = ['All', 'Active', 'Inactive'];

export default function StaffPage() {
  const { user } = useAuth();
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
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage staff members and their information
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
                ×
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff List</CardTitle>
              <CardDescription>
                List of all staff members in the school
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search staff..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
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
                      filteredStaff.map((staffMember) => (
                        <TableRow key={staffMember.id}>
                          <TableCell className="font-medium">{staffMember.full_name}</TableCell>
                          <TableCell>{staffMember.role}</TableCell>
                          <TableCell>{staffMember.phone_number}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              staffMember.is_active !== false 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {staffMember.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEdit(staffMember)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(staffMember.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
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
      </div>
      
      {/* Add/Edit Staff Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
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
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input 
                id="full_name" 
                name="full_name" 
                value={currentStaff?.full_name || ''} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                name="role" 
                value={currentStaff?.role || ''} 
                onValueChange={(value) => handleSelectChange('role', value)}
              >
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {availableRoles.filter(role => role !== 'All').map(role => 
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone</Label>
              <Input 
                id="phone_number" 
                name="phone_number" 
                value={currentStaff?.phone_number || ''} 
                onChange={handleInputChange} 
              />
            </div>
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  value={currentStaff?.password || ''} 
                  onChange={handleInputChange} 
                  placeholder="Set initial password"
                  required
                />
                <p className="text-sm text-gray-500">
                  This will be the initial password for the staff member&apos;s user account
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                name="status" 
                value={currentStaff?.is_active !== false ? 'Active' : 'Inactive'} 
                onValueChange={(value) => handleSelectChange('is_active', value === 'Active' ? 'true' : 'false')}
              >
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {availableStatuses.filter(status => status !== 'All').map(status => 
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}