// src/app/(admin)/parents/page.tsx

'use client';

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
import { Search, Plus, Edit, Trash2, User, Phone, Mail, Loader2, Eye, Users } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { parentServices } from '@/lib/api/parents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Extended parent interface to include student count
interface ExtendedParent {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  role: string;
  is_registered: boolean;
  studentCount: number;
  relationships: string[];
}

export default function ParentsPage() {
  const { user, token } = useAuth();
  const [parents, setParents] = useState<ExtendedParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);


  // Define types for better readability
  type StudentParentMapping = {
    parent: {
      id: string;
      full_name: string;
      phone_number: string;
      email: string;
      role: string;
      is_registered: boolean;
    };
    relationship: string;
  };

  type StudentWithParents = {
    parent_student_mappings: StudentParentMapping[];
  };

  // Fetch parents data
  const fetchParents = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await parentServices.getAllParents(token, {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        status: statusFilter === 'all' ? undefined : statusFilter
      });
      
      if (response.status === 'success' && response.data) {
        // Transform students data to extract unique parents
        const students = ((response.data as unknown) as { students: StudentWithParents[] }).students || [];
        const parentMap = new Map();
        
        students.forEach((student: StudentWithParents) => {
          if (student.parent_student_mappings) {
            student.parent_student_mappings.forEach((mapping: StudentParentMapping) => {
              const parent = mapping.parent;
              if (!parentMap.has(parent.id)) {
                parentMap.set(parent.id, {
                  ...parent,
                  studentCount: 1,
                  relationships: [mapping.relationship]
                });
              } else {
                const existingParent = parentMap.get(parent.id);
                existingParent.studentCount += 1;
                if (!existingParent.relationships.includes(mapping.relationship)) {
                  existingParent.relationships.push(mapping.relationship);
                }
              }
            });
          }
        });
        
        const uniqueParents = Array.from(parentMap.values());
        setParents(uniqueParents);
        
        // For now, use a simple pagination since we're transforming data
        setPagination({
          total: uniqueParents.length,
          total_pages: Math.ceil(uniqueParents.length / 20),
          has_next: false,
          has_prev: false
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parents';
      setError(errorMessage);
      console.error('Error fetching parents:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm, statusFilter]);

  // Fetch parents on component mount and when filters change
  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
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

  if (loading && parents.length === 0) {
    return (
      <ProtectedRoute>
        <div className="container max-w-6xl mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading parents...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Parent Management</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage parent accounts and their student relationships
              </p>
            </div>
            <Button asChild>
              <Link href="/parents/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Parent
              </Link>
            </Button>
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

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Parent List</CardTitle>
              <CardDescription>
                List of all parents in the school system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search parents..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    className="border rounded-md px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parents.map((parent) => (
                      <TableRow key={parent.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            {parent.full_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {parent.phone_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {parent.email || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {parent.studentCount || 0} student(s)
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            parent.is_registered 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {parent.is_registered ? 'Registered' : 'Pending'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            parent.is_registered 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {parent.is_registered ? 'Active' : 'Setup Required'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/parents/${parent.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" className="mr-2" asChild>
                            <Link href={`/parents/${parent.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={true}
                            title="Delete functionality not yet implemented"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.has_prev}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 py-2 text-sm">
                      Page {currentPage} of {pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.has_next}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}