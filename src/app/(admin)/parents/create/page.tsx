// src/app/(admin)/parents/create/page.tsx

'use client';

import { useAuth } from '@/lib/auth/context';
import { ProtectedRoute } from '@/lib/auth/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Phone, 
  Mail,
  ArrowLeft,
  Loader2,
  Plus,
  X,
  Search,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { parentServices, CreateParentRequest } from '@/lib/api/parents';
import { studentServices, Student } from '@/lib/api/students';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface StudentDetail {
  student_id: string;
  admission_number: string;
  full_name: string;
  relationship: string;
  is_primary_guardian: boolean;
}

export default function CreateParentPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    initial_password: ''
  });

  const [studentDetails, setStudentDetails] = useState<StudentDetail[]>([
    {
      student_id: '',
      admission_number: '',
      full_name: '',
      relationship: 'father',
      is_primary_guardian: true
    }
  ]);

  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showStudentLinking, setShowStudentLinking] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    
    setIsLoadingStudents(true);
    try {
      // First, try to get all students without any restrictions
      const response = await studentServices.getAllStudents(token, {
        page: 1,
        limit: 1000, // Increased limit to get more students
        status: 'active' // Only get active students
      });

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        console.error('Unexpected blob response from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        console.error('Failed to fetch students:', response.message);
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        console.log('Students API response:', response.data);
        console.log('Total students received:', response.data.students?.length || 0);

        // Check if the response has the expected structure
        if (response.data && Array.isArray(response.data.students)) {
          // Filter out students that already have parents
          const availableStudents = response.data.students.filter((student: Student) => {
            const hasNoParents = !student.parent_mappings || student.parent_mappings.length === 0;
            console.log(`Student ${student.full_name} (${student.admission_number}): has parents = ${student.parent_mappings?.length || 0}`);
            return hasNoParents;
          });

          setStudents(availableStudents);
          setFilteredStudents(availableStudents);
          console.log('Available students (without parents):', availableStudents.length);
          console.log('Available students:', availableStudents);
          
          // If we still don't have enough students, try without status filter
          if (availableStudents.length < 5 && response.data.pagination?.total > 1000) {
            console.log('Not enough students found, trying to get more...');
            // This could be expanded to fetch more pages if needed
          }
        } else {
          console.error('Unexpected API response structure:', response.data);
          setError('Failed to load students: Unexpected response format');
        }
      } else {
        console.error('Failed to fetch students:', response);
        setError('Failed to load students: API returned error');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [token]);

  // Fetch students on component mount
  useEffect(() => {
    if (token) {
      fetchStudents();
    }
  }, [token, fetchStudents]);

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentSelection = (index: number, student: Student) => {
    setStudentDetails(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        student_id: student.id,
        admission_number: student.admission_number,
        full_name: student.full_name
      };
      return updated;
    });
  };

  const handleStudentDetailChange = (index: number, field: keyof StudentDetail, value: string | boolean) => {
    setStudentDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If this is set as primary guardian, unset others
      if (field === 'is_primary_guardian' && value === true) {
        updated.forEach((detail, i) => {
          if (i !== index) {
            detail.is_primary_guardian = false;
          }
        });
      }
      
      return updated;
    });
  };

  const addStudentDetail = () => {
    setStudentDetails(prev => [
      ...prev,
      {
        student_id: '',
        admission_number: '',
        full_name: '',
        relationship: 'father',
        is_primary_guardian: false
      }
    ]);
  };

  const removeStudentDetail = (index: number) => {
    if (studentDetails.length > 1) {
      setStudentDetails(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate student details only if student linking is enabled
    if (showStudentLinking) {
      // Filter out empty student details
      const validStudentDetails = studentDetails.filter(detail =>
        detail.admission_number.trim() && detail.full_name.trim()
      );

      // If no valid students but student linking is enabled, show error
      if (validStudentDetails.length === 0) {
        setError('Please provide at least one student with admission number and name');
        return;
      }

      // Validate that exactly one student is marked as primary guardian
      const primaryGuardians = validStudentDetails.filter(detail => detail.is_primary_guardian);
      if (primaryGuardians.length !== 1) {
        setError('Please mark exactly one student as the primary guardian');
        return;
      }

      // Update studentDetails to only include valid entries
      setStudentDetails(validStudentDetails);
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const createData: CreateParentRequest = {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        email: formData.email,
        initial_password: formData.initial_password || undefined,
        student_details: showStudentLinking ? studentDetails.map(detail => ({
          admission_number: detail.admission_number.trim(),
          relationship: detail.relationship,
          is_primary_guardian: detail.is_primary_guardian
        })) : []
      };

      console.log('Sending parent data:', createData);
      
      const response = await parentServices.createParent(createData, token);

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        setError('Unexpected response format from API');
        return;
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        setError(response.message || 'Failed to create parent');
        return;
      }

      // Handle successful response
      if ('status' in response && response.status === 'success') {
        // Redirect to parents list
        router.push('/parents');
      } else {
        setError('Failed to create parent');
      }
    } catch (err: unknown) {
      console.error('Create parent error:', err);
      
      // Enhanced error handling to show more details
      if (err instanceof Error) {
        const errorMessage = err.message;
        console.log('Error message:', errorMessage);
        
        // Check if it's an HTTP error with details
        if ('details' in err && err.details) {
          console.log('Error details:', err.details);
          if (typeof err.details === 'object' && err.details !== null) {
            const details = err.details as Record<string, unknown>;
            if (details.message) {
              setError(`Backend error: ${details.message}`);
            } else if (details.error) {
              setError(`Backend error: ${details.error}`);
            } else {
              setError(`Backend error: ${errorMessage}`);
            }
          } else {
            setError(`Backend error: ${errorMessage}`);
          }
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to create parent');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/parents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Parents
            </Link>
          </Button>
        </div>



        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Parent Information</CardTitle>
              <CardDescription>
                Enter the parent&apos;s personal information
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
                    Upload a profile picture (optional)
                  </p>
                </div>
              </div>

              {/* First Row: Full Name and Phone Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter parent's full name"
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
                      type="tel"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="Enter 10-digit phone number"
                      className="pl-10"
                      pattern="[0-9]{10}"
                      title="Please enter exactly 10 digits"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Second Row: Email and Initial Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="initial_password">Initial Password *</Label>
                  <Input
                    id="initial_password"
                    name="initial_password"
                    type="password"
                    value={formData.initial_password}
                    onChange={handleInputChange}
                    placeholder="Enter initial password for parent"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Parent will use this password to register and can change it later.
                  </p>
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
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Linking (Optional)</CardTitle>
                  <CardDescription>
                    Link this parent to existing students. Only students without existing parents are shown.
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-student-linking">Enable Student Linking</Label>
                  <input
                    id="show-student-linking"
                    type="checkbox"
                    checked={showStudentLinking}
                    onChange={(e) => setShowStudentLinking(e.target.checked)}
                    className="rounded"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {showStudentLinking ? (
                <>
                  {studentDetails.map((detail, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Student {index + 1}</h3>
                    {studentDetails.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStudentDetail(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {!detail.student_id ? (
                    <div className="space-y-4">
                      {!showManualInput ? (
                        <>
                          <div className="space-y-2">
                            <Label>Search and Select Student</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search by name or admission number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            
                            {/* Debug info */}
                            {students.length > 0 && (
                              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                Showing {filteredStudents.length} of {students.length} available students
                                {searchTerm && ` (filtered by "${searchTerm}")`}
                              </div>
                            )}
                          </div>
                          
                          {isLoadingStudents ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin" />
                              <span className="ml-2">Loading students...</span>
                            </div>
                          ) : students.length === 0 ? (
                            <div className="p-4 text-center space-y-3">
                              <div className="text-gray-500">
                                {error ? 'Failed to load students from server.' : 'No available students found.'}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRetryCount(prev => prev + 1);
                                    fetchStudents();
                                  }}
                                >
                                  Retry ({retryCount})
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowManualInput(true)}
                                >
                                  Enter Manually
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="max-h-48 overflow-y-auto border rounded-md">
                              {filteredStudents.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                  {searchTerm ? 'No students found matching your search.' : 'No available students found.'}
                                </div>
                              ) : (
                                <>
                                  <div className="divide-y">
                                    {filteredStudents.map((student) => (
                                      <button
                                        key={student.id}
                                        type="button"
                                        onClick={() => handleStudentSelection(index, student)}
                                        className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="font-medium">{student.full_name}</div>
                                            <div className="text-sm text-gray-500">
                                              {student.admission_number} • {student.student_academic_records[0]?.class_division.class_level.name} {student.student_academic_records[0]?.class_division.division}
                                            </div>
                                          </div>
                                          <CheckCircle className="h-5 w-4 text-green-500 opacity-0 group-hover:opacity-100" />
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                  
                                  {/* Show more info if there are many students */}
                                  {students.length > 50 && (
                                    <div className="p-2 text-xs text-gray-500 text-center border-t bg-gray-50 dark:bg-gray-800">
                                      Showing {filteredStudents.length} students. Use search to find specific students.
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Manual Student Entry</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowManualInput(false)}
                            >
                              Back to Selection
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`manual_admission_${index}`}>Admission Number *</Label>
                              <Input
                                id={`manual_admission_${index}`}
                                value={detail.admission_number}
                                onChange={(e) => handleStudentDetailChange(index, 'admission_number', e.target.value)}
                                placeholder="Enter admission number"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`manual_name_${index}`}>Student Name *</Label>
                              <Input
                                id={`manual_name_${index}`}
                                value={detail.full_name}
                                onChange={(e) => handleStudentDetailChange(index, 'full_name', e.target.value)}
                                placeholder="Enter student name"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                            ⚠️ Manual entry mode: Please ensure the admission number and student name are correct.
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-green-800 dark:text-green-200">
                              {detail.full_name}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-300">
                              {detail.admission_number}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStudentSelection(index, { 
                              id: '', 
                              full_name: '', 
                              admission_number: '', 
                              date_of_birth: '', 
                              admission_date: '', 
                              status: '', 
                              student_academic_records: [], 
                              parent_mappings: [] 
                            })}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`relationship_${index}`}>Relationship</Label>
                          <Select
                            value={detail.relationship}
                            onValueChange={(value) => handleStudentDetailChange(index, 'relationship', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="father">Father</SelectItem>
                              <SelectItem value="mother">Mother</SelectItem>
                              <SelectItem value="guardian">Guardian</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={detail.is_primary_guardian}
                              onChange={(e) => handleStudentDetailChange(index, 'is_primary_guardian', e.target.checked)}
                              className="rounded"
                            />
                            <span>Primary Guardian</span>
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addStudentDetail}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Student
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Student linking is disabled. You can link students later from the parent details page.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/parents">
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Parent Account'
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}