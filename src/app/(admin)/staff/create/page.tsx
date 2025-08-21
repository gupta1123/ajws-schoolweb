// src/app/(admin)/staff/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Loader2, AlertTriangle, User, Phone, Shield, Key, ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { staffServices } from '@/lib/api';
import type { CreateStaffWithUserRequest } from '@/types/staff';

export default function CreateStaffPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    role: 'teacher',
    department: '',
    designation: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available roles and departments
  const availableRoles = ['teacher', 'principal', 'admin'];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const createData: CreateStaffWithUserRequest = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        role: formData.role.toLowerCase(), // API expects lowercase
        department: formData.role, // Use role as department (e.g., "Mathematics", "Science")
        designation: 'Teacher', // Default designation
        password: formData.password,
        user_role: formData.role.toLowerCase() // API expects lowercase
      };

      const response = await staffServices.createStaffWithUser(createData, token);
      
      if (response.status === 'success') {
        router.push('/staff');
      } else {
        setError('Failed to create staff member');
      }
    } catch (err) {
      console.error('Create staff error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create staff member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-4 md:p-8">
        <main className="max-w-2xl mx-auto pt-16">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Staff
            </Button>
            <h1 className="text-3xl font-bold mb-2">Add New Staff</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Add a new staff member to the school system
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

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Enter the staff member&apos;s personal details
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
                          onChange={handleInputChange}
                          placeholder="Enter staff member's full name"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="e.g., 9876543210"
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
                  <div className="grid grid-cols-1 gap-4">
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
                  </div>
                </div>

                {/* Account Security Section */}
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
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Set initial password"
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-sm text-gray-500">
                        This will be the initial password for the staff member&apos;s user account
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Add Staff
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}