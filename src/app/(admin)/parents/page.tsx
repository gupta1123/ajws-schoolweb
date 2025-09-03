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
  created_at?: string;
  children?: Array<{
    id: string;
    full_name: string;
    admission_number: string;
    class_division?: {
      division: string;
      level: {
        name: string;
        sequence_number: number;
      };
    };
  }>;
  studentCount: number;
  relationships: string[];
}

export default function ParentsPage() {
  const { user, token } = useAuth();
  const [parents, setParents] = useState<ExtendedParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [pagination, setPagination] = useState({
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);




  // Fetch parents data
  const fetchParents = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await parentServices.getAllParents(token, {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined
      });

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        setError('Unexpected response format from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        setError(response.message || 'Failed to fetch parents');
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        // Transform the parent data to include student count and relationships
        const transformedParents = response.data.parents.map(parent => {
          const studentCount = parent.children?.length || 0;
          const relationships = parent.children?.map(() => 'parent') || [];

          return {
            ...parent,
            studentCount,
            relationships
          };
        });

        setParents(transformedParents);
        setPagination(response.data.pagination);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch parents';
      setError(errorMessage);
      console.error('Error fetching parents:', err);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, searchTerm]);

  // Fetch parents on component mount and when filters change
  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parents..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

          </div>
          <Button asChild>
            <Link href="/parents/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Parent
            </Link>
          </Button>
        </div>

        {error && (
          <div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Parents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Parent List</CardTitle>
            <CardDescription>
              List of all parents in the school system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Students</TableHead>
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
                          {parent.email || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{parent.studentCount || 0} student(s)</div>
                            {parent.children && parent.children.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {parent.children.slice(0, 2).map(child => (
                                  <div key={child.id}>
                                    {child.full_name}
                                    {child.class_division && (
                                      <span> - {child.class_division.level.name} {child.class_division.division}</span>
                                    )}
                                  </div>
                                ))}
                                {parent.children.length > 2 && (
                                  <div>+{parent.children.length - 2} more</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="View parent details"
                            className="h-8 w-8 p-0"
                          >
                            <Link href={`/parents/${parent.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            title="Edit parent"
                            className="h-8 w-8 p-0"
                          >
                            <Link href={`/parents/${parent.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            title="Delete parent"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
    </ProtectedRoute>
  );
}