// src/hooks/use-attendance.ts

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  attendanceApi,
  AttendancePayload,
  ClassAttendanceResponse,
  TeacherSummaryResponse,
  StudentAttendanceDetailsResponse
} from '@/lib/api/attendance';
import { studentServices } from '@/lib/api/students';

export interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  rollNumber?: string;
  onLeave?: boolean;
}

interface ApiStudent {
  id: string;
  full_name: string;
  admission_number: string;
  student_academic_records?: Array<{
    class_division?: {
      id: string;
    };
    roll_number?: string;
  }>;
}

export interface AttendanceState {
  [studentId: string]: 'present' | 'absent' | 'late' | 'half_day';
}

export interface UseAttendanceReturn {
  // State
  students: Student[];
  attendance: AttendanceState;
  loading: boolean;
  error: string | null;
  attendanceData: ClassAttendanceResponse | null;
  className: string;
  
  // Actions
  setAttendance: (studentId: string, status: 'present' | 'absent' | 'late' | 'half_day') => void;
  markAllPresent: () => void;
  markAllAbsent: () => void;
  submitAttendance: (classDivisionId: string, date: string) => Promise<boolean>;
  loadClassAttendance: (classDivisionId: string, date: string) => Promise<void>;
  loadAttendanceStatus: (classDivisionId: string, date: string) => Promise<void>;
  loadAttendanceRange: (classDivisionId: string, startDate: string, endDate: string) => Promise<void>;
  loadTeacherSummary: (startDate: string, endDate: string) => Promise<TeacherSummaryResponse | null>;
  loadStudentDetails: (studentId: string, startDate: string, endDate: string) => Promise<StudentAttendanceDetailsResponse | null>;
  
  // Computed values
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalCount: number;
  attendancePercentage: number;
}

export function useAttendance(): UseAttendanceReturn {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendanceState] = useState<AttendanceState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<ClassAttendanceResponse | null>(null);
  const [className, setClassName] = useState<string>('');

  // Set attendance for a specific student
  const setAttendance = useCallback((studentId: string, status: 'present' | 'absent' | 'late' | 'half_day') => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  }, []);

  // Mark all students as present
  const markAllPresent = useCallback(() => {
    const updatedAttendance: AttendanceState = {};
    students.forEach(student => {
      if (!student.onLeave) {
        updatedAttendance[student.id] = 'present';
      }
    });
    setAttendanceState(updatedAttendance);
  }, [students]);

  // Mark all students as absent
  const markAllAbsent = useCallback(() => {
    const updatedAttendance: AttendanceState = {};
    students.forEach(student => {
      if (!student.onLeave) {
        updatedAttendance[student.id] = 'absent';
      }
    });
    setAttendanceState(updatedAttendance);
  }, [students]);

  // Load students for a specific class
  const loadStudentsByClass = useCallback(async (
    classDivisionId: string
  ): Promise<void> => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Loading students for class:', classDivisionId);
      console.log('Token exists:', !!token);

      const response = await studentServices.getStudentsByClass(classDivisionId, token);

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        setError('Unexpected response format from API');
        return;
      }

      // Debug logging
      console.log('Students API Response:', response);
      console.log('Response status:', response.status);

      // Check if response is an error
      if ('status' in response && response.status === 'error') {
        setError(response.message || 'Failed to load students');
        return;
      }

      // At this point, we know response is a success response with data
      const successResponse = response as unknown as { data: { students: ApiStudent[]; class_division: { id: string; division: string; level: { name: string; sequence_number: number; }; teacher: { id: string; full_name: string; }; } } };
      
      // Check if response data exists and has the expected structure
      if (!successResponse.data || !successResponse.data.students || !Array.isArray(successResponse.data.students)) {
        console.error('Invalid response structure:', successResponse);
        setError('Invalid response format from students API');
        return;
      }

      // Check if class division data exists
      if (!successResponse.data.class_division) {
        console.error('Missing class division data:', successResponse.data);
        setError('Class division information not found');
        return;
      }

      console.log('Processing students:', successResponse.data.students.length);

      // Extract students and class information with safety checks
      const studentList: Student[] = successResponse.data.students.map((student: ApiStudent) => {
        // Ensure all required fields exist
        if (!student.id || !student.full_name || !student.admission_number) {
          console.warn('Student missing required fields:', student);
          return null;
        }

        // Find roll number from academic records
        let rollNumber = student.admission_number; // fallback
        if (student.student_academic_records && Array.isArray(student.student_academic_records)) {
          const academicRecord = student.student_academic_records.find((record) =>
            record.class_division && record.class_division.id === classDivisionId
          );
          if (academicRecord && academicRecord.roll_number) {
            rollNumber = academicRecord.roll_number;
          }
        }

        return {
          id: student.id,
          full_name: student.full_name,
          admission_number: student.admission_number,
          rollNumber: rollNumber
        };
      }).filter(Boolean) as Student[]; // Remove any null entries

      console.log('Processed students:', studentList.length);

      if (studentList.length === 0) {
        setError('No students found in this class');
        return;
      }

      setStudents(studentList);
      
      // Set class name with safety checks
      const classInfo = successResponse.data.class_division;
      if (classInfo.level && classInfo.level.name && classInfo.division) {
        setClassName(`${classInfo.level.name} - Section ${classInfo.division}`);
      } else {
        setClassName('Class Attendance');
      }
      
      // Initialize attendance state with all students as present by default
      const initialAttendance: AttendanceState = {};
      studentList.forEach(student => {
        initialAttendance[student.id] = 'present';
      });
      setAttendanceState(initialAttendance);
      
      console.log('Successfully loaded students and set attendance state');
      
    } catch (err) {
      console.error('Error loading students:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load class attendance for a specific date
  const loadClassAttendance = useCallback(async (
    classDivisionId: string, 
    date: string
  ): Promise<void> => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First try to load students for the class
      try {
        await loadStudentsByClass(classDivisionId);
      } catch (studentsErr) {
        console.warn('Failed to load students from students API, trying attendance API:', studentsErr);
        
        // Fallback: try to get students from attendance API
        try {
          const attendanceResponse = await attendanceApi.getClassAttendance(classDivisionId, date, token);

          // Handle Blob response (shouldn't happen for this endpoint)
          if (attendanceResponse instanceof Blob) {
            console.error('Unexpected Blob response');
            return;
          }

          if (attendanceResponse.status === 'success' && attendanceResponse.data.student_records) {
            // Extract students from attendance records
            const studentList: Student[] = attendanceResponse.data.student_records.map(record => ({
              id: record.student_id,
              full_name: record.student?.full_name || 'Unknown Student',
              admission_number: record.student?.admission_number || 'N/A',
              rollNumber: record.student?.admission_number || 'N/A'
            }));
            
            setStudents(studentList);
            setClassName('Class Attendance');
            
            // Set attendance state from existing records
            const initialAttendance: AttendanceState = {};
            attendanceResponse.data.student_records.forEach(record => {
              initialAttendance[record.student_id] = record.status as 'present' | 'absent' | 'late' | 'half_day';
            });
            setAttendanceState(initialAttendance);
            
            setAttendanceData(attendanceResponse.data);
            return; // Success with fallback
          }
        } catch (attendanceFallbackErr) {
          console.warn('Attendance API fallback also failed:', attendanceFallbackErr);
        }
        
        // If both approaches fail, show error
        setError('Failed to load students. Please try again or contact support.');
        return;
      }

      // Then try to load existing attendance data
      try {
        const response = await attendanceApi.getClassAttendance(classDivisionId, date, token);

        // Handle Blob response (shouldn't happen for this endpoint)
        if (response instanceof Blob) {
          console.error('Unexpected Blob response');
          return;
        }

        if (response.status === 'success') {
          setAttendanceData(response.data);
          
          // Update attendance state from existing records
          const updatedAttendance: AttendanceState = {};
          response.data.student_records.forEach(record => {
            updatedAttendance[record.student_id] = record.status as 'present' | 'absent' | 'late' | 'half_day';
          });
          
          // Merge with existing attendance state (keep defaults for new students)
          setAttendanceState(prev => ({
            ...prev,
            ...updatedAttendance
          }));
        }
      } catch {
        // If attendance data doesn't exist yet, that's fine - we'll create it
        console.log('No existing attendance data found for this date');
      }
      
    } catch (err) {
      console.error('Error in loadClassAttendance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, loadStudentsByClass]);

  // Submit attendance to API
  const submitAttendance = useCallback(async (
    classDivisionId: string, 
    date: string
  ): Promise<boolean> => {
    if (!token) {
      setError('Authentication required');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Convert attendance state to API payload
      const presentStudents = Object.entries(attendance)
        .filter(([, status]) => status === 'present')
        .map(([studentId]) => studentId);

      const payload: AttendancePayload = {
        class_division_id: classDivisionId,
        attendance_date: date,
        present_students: presentStudents
      };

      const response = await attendanceApi.markDailyAttendance(payload, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return false;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to submit attendance');
        return false;
      }

      // Reload attendance data
      await loadClassAttendance(classDivisionId, date);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit attendance';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token, attendance, loadClassAttendance]);

  // Load attendance status
  const loadAttendanceStatus = useCallback(async (
    classDivisionId: string, 
    date: string
  ): Promise<void> => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getAttendanceStatus(classDivisionId, date, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to load attendance status');
        return;
      }

      if (response.status === 'success') {
        setAttendanceData(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load attendance range
  const loadAttendanceRange = useCallback(async (
    classDivisionId: string, 
    startDate: string, 
    endDate: string
  ): Promise<void> => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getAttendanceRange(classDivisionId, startDate, endDate, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to load attendance range');
        return;
      }

      if (response.status === 'success') {
        // Handle range data as needed
        console.log('Attendance range loaded:', response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load attendance range';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load teacher summary
  const loadTeacherSummary = useCallback(async (
    startDate: string, 
    endDate: string
  ): Promise<TeacherSummaryResponse | null> => {
    if (!token) {
      setError('Authentication required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getTeacherSummary(startDate, endDate, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return null;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to load teacher summary');
        return null;
      }

      if (response.status === 'success') {
        return response.data;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teacher summary';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load student details
  const loadStudentDetails = useCallback(async (
    studentId: string, 
    startDate: string, 
    endDate: string
  ): Promise<StudentAttendanceDetailsResponse | null> => {
    if (!token) {
      setError('Authentication required');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await attendanceApi.getStudentAttendanceDetails(studentId, startDate, endDate, token);

      // Handle Blob response (shouldn't happen for this endpoint)
      if (response instanceof Blob) {
        console.error('Unexpected Blob response');
        setError('Unexpected response format');
        return null;
      }

      if (response.status === 'error') {
        setError(response.message || 'Failed to load student details');
        return null;
      }

      if (response.status === 'success') {
        return response.data;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load student details';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Computed values
  const presentCount = Object.values(attendance).filter(status => status === 'present').length;
  const absentCount = Object.values(attendance).filter(status => status === 'absent').length;
  const lateCount = Object.values(attendance).filter(status => status === 'late').length;
  const totalCount = students.length;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return {
    // State
    students,
    attendance,
    loading,
    error,
    attendanceData,
    className,
    
    // Actions
    setAttendance,
    markAllPresent,
    markAllAbsent,
    submitAttendance,
    loadClassAttendance,
    loadAttendanceStatus,
    loadAttendanceRange,
    loadTeacherSummary,
    loadStudentDetails,
    
    // Computed values
    presentCount,
    absentCount,
    lateCount,
    totalCount,
    attendancePercentage
  };
}
