// src/app/(admin)/staff/[id]/edit/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { staffServices } from '@/lib/api';
import type { Staff, UpdateStaffRequest } from '@/types/staff';
import { Loader2, AlertTriangle, User, Phone, Shield, ArrowLeft, Save, X } from 'lucide-react';

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [staffId, setStaffId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    role: '',
    phone: '',
    isActive: true
  });

  // Extract staff ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setStaffId(resolvedParams.id);
    };
    extractId();
  }, [params]);

  // Available roles and departments
  const availableRoles = ['teacher', 'principal', 'admin'];

  // Fetch staff details
  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (!token || !staffId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Since there's no specific endpoint for single staff member,
        // we'll fetch all staff and find the one we need
        const response = await staffServices.getStaff(token);
        
        if (response.status === 'success') {
          const foundStaff = response.data.staff.find(s => s.id === staffId);
          if (foundStaff) {
            setStaff(foundStaff);
            setFormData({
              fullName: foundStaff.full_name,
              role: foundStaff.role,
              phone: foundStaff.phone_number,
              isActive: foundStaff.is_active !== false
            });
          } else {
            setError('Staff member not found');
          }
        } else {
          setError('Failed to fetch staff details');
        }
      } catch (err) {
        console.error('Fetch staff details error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch staff details');
      } finally {
        setLoading(false);
      }
    };

    if (token && staffId) {
      fetchStaffDetails();
    }
  }, [token, staffId]);

  // Only allow admins and principals to access this page
  if (user?.role !== 'admin' && user?.role !== 'principal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only admins and principals can access this page.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !staff) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updateData: UpdateStaffRequest = {
        full_name: formData.fullName,
        role: formData.role,
        phone_number: formData.phone,
        is_active: formData.isActive
      };

      const response = await staffServices.updateStaff(staff.id, updateData, token);
      
      if (response.status === 'success') {
        router.push(`/staff/${staffId}`);
      } else {
        setError('Failed to update staff member');
      }
    } catch (err) {
      console.error('Update staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update staff member');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading staff details...</span>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !staff) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen p-4 md:p-8">
          <main className="max-w-4xl mx-auto pt-16">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error Loading Staff Details</h2>
                <p className="text-gray-600 mb-4">{error || 'Staff member not found'}</p>
                <Button onClick={() => router.back()}>Go Back</Button>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-4xl mx-auto pt-16">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Staff Details
            </Button>
            <h1 className="text-3xl font-bold mb-2">Edit Staff Member</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Update staff member information
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                  ×
                </Button>
              </div>
            </div>
          )}

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Staff Information</CardTitle>
                <CardDescription>
                  Update the staff member&apos;s personal and professional information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <User className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Enter full name"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          className="pl-10"
                          required
                        />
                      </div>
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
                          value={formData.role}
                          onValueChange={(value) => handleSelectChange('role', value)}
                        >
                          <SelectTrigger className="pl-10">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map(role => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isActive" className="text-sm font-medium">Account Status</Label>
                      <Select
                        name="isActive"
                        value={formData.isActive ? 'active' : 'inactive'}
                        onValueChange={(value) => handleSelectChange('isActive', value === 'active' ? 'true' : 'false')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              Active
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full" />
                              Inactive
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Staff Member
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}