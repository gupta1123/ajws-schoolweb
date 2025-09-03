// src/app/(admin)/parents/[id]/edit/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Phone, 
  Mail,
  ArrowLeft,
  Loader2,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parentServices, Parent } from '@/lib/api/parents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function EditParentPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [parent] = useState<Parent | null>(null);
  const [parentId, setParentId] = useState<string>('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extract parent ID from params
  useEffect(() => {
    const extractId = async () => {
      const resolvedParams = await params;
      setParentId(resolvedParams.id);
    };
    extractId();
  }, [params]);

  // Fetch parent data
  useEffect(() => {
    const fetchParent = async () => {
      if (!token || !parentId) return;
      
      try {
        setFetching(true);
        setError(null);
        
        // Since parent details endpoint doesn't exist, show a message
        setError('Parent editing is not yet implemented. Please use the students page to view and manage parent information.');
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parent data';
        setError(errorMessage);
        console.error('Error fetching parent:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchParent();
  }, [parentId, token]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
    setSuccess(null);
    
    try {
      const updateData = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        email: formData.email || undefined
      };

      const response = await parentServices.updateParent(parentId, updateData, token);
      
      if (response.status === 'success') {
        setSuccess('Parent information updated successfully!');
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/parents/${parentId}`);
        }, 1500);
      } else {
        setError('Failed to update parent information');
      }
    } catch (err: unknown) {
      console.error('Update parent error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update parent information';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (fetching) {
    return (
      <ProtectedRoute>
        <div className="container max-w-2xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading parent data...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !parent) {
    return (
      <ProtectedRoute>
        <div className="container max-w-2xl mx-auto py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-2xl mx-auto py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href={`/parents/${parentId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Parent
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Parent</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Update parent information
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {success && (
          <div className="mb-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Parent Information</CardTitle>
              <CardDescription>
                Update the parent&apos;s personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Parent Profile</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Update profile information
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter parent&apos;s full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <div className="flex items-center">
                  <Phone className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center">
                  <Mail className="absolute ml-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>

              {parent && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">Account Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Registration Status:</span>
                      <span className={parent.is_registered ? 'text-green-600' : 'text-yellow-600'}>
                        {parent.is_registered ? 'Registered' : 'Pending Registration'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span>{parent.role}</span>
                    </div>
                    {parent.created_at && (
                      <div className="flex justify-between">
                        <span>Account Created:</span>
                        <span>{new Date(parent.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/parents/${parentId}`}>
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Parent
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </ProtectedRoute>
  );
}