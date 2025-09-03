// src/lib/api/attendance.ts

import { apiClient, ApiResponse, ApiErrorResponse } from './client';

// Types for attendance data
export interface StudentAttendanceRecord {
  id: string;
  daily_attendance_id: string;
  student_id: string;
  status: 'full_day' | 'absent' | 'late' | 'half_day';
  remarks: string;
  marked_by: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    admission_number: string;
  };
  marked_by_user?: {
    role: string;
    full_name: string;
  };
  marked_by_name?: string;
}

export interface DailyAttendance {
  id: string;
  class_division_id: string;
  academic_year_id: string;
  attendance_date: string;
  marked_by: string | null;
  is_holiday: boolean;
  holiday_reason: string | null;
  created_at: string;
  updated_at: string;
  marked_by_user?: {
    role: string;
    full_name: string;
  };
}

export interface AttendancePayload {
  class_division_id: string;
  attendance_date: string;
  present_students: string[];
}

export interface AttendanceResponse {
  daily_attendance: DailyAttendance;
  student_records: StudentAttendanceRecord[];
  student_details: Array<{
    id: string;
    full_name: string;
    admission_number: string;
  }>;
}

export interface ClassAttendanceResponse {
  daily_attendance: DailyAttendance;
  student_records: StudentAttendanceRecord[];
}

export interface AttendanceStatusResponse {
  daily_attendance: DailyAttendance;
  student_records: StudentAttendanceRecord[];
  is_holiday: boolean;
  holiday_reason: string | null;
}

export interface AttendanceRangeResponse {
  class_division_id: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  period_id: string | null;
  total_days: number;
  attendance_records: Array<{
    daily_attendance: DailyAttendance;
    student_records: StudentAttendanceRecord[];
  }>;
}

export interface StudentAttendanceDetailsResponse {
  student: {
    id: string;
    full_name: string;
    admission_number: string;
  };
  academic_year_id: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  attendance_records: Array<{
    date: string;
    status: string;
    remarks: string;
    marked_by: string;
    is_holiday: boolean;
    holiday_reason: string | null;
    class_name: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface TeacherSummaryResponse {
  teacher_id: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_classes: number;
    total_attendance_days: number;
    total_students: number;
    total_present: number;
    total_absent: number;
    average_attendance_percentage: number;
    classes_summary: Array<{
      class_division_id: string;
      class_name: string;
      total_days: number;
      average_attendance: number;
      total_students: number;
      total_present: number;
      total_absent: number;
      daily_breakdown: Array<{
        date: string;
        total_students: number;
        present_count: number;
        absent_count: number;
        attendance_percentage: number;
      }>;
    }>;
  };
}

export interface StudentSummaryResponse {
  student: {
    full_name: string;
    admission_number: string;
  };
  academic_year_id: string;
  class_division_id: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_days: number;
    present_days: number;
    absent_days: number;
    attendance_percentage: number;
    holiday_days: number;
  };
}

// Principal/Admin Attendance Types
export interface ClassAttendanceSummary {
  class_division_id: string;
  class_name: string;
  is_holiday: boolean;
  attendance_marked: boolean;
  total_students: number;
  present_count: number;
  absent_count: number;
  attendance_percentage: number;
  marked_by: string | null;
}

export interface PrincipalAllClassesSummaryResponse {
  date: string;
  academic_year: string;
  total_classes: number;
  classes_with_attendance: number;
  classes_without_attendance: number;
  holiday_classes: number;
  class_attendance: ClassAttendanceSummary[];
}

// Teacher Assignment Types
export interface TeacherAssignment {
  assignment_id: string;
  class_division_id: string;
  division: string;
  class_name: string;
  class_level: string;
  sequence_number: number;
  academic_year: string;
  assignment_type: 'class_teacher' | 'subject_teacher';
  subject: string | null;
  is_primary: boolean;
  assigned_date: string;
  student_count: number;
}

export interface TeacherInfoResponse {
  status: string;
  data: {
    user_id: string;
    staff_id: string;
    full_name: string;
    staff_info: {
      id: string;
      department: string;
      designation: string;
    };
    assignment_ids: {
      teacher_id: string;
      staff_id: string;
    };
    assigned_classes: TeacherAssignment[];
    primary_classes: TeacherAssignment[];
    secondary_classes: TeacherAssignment[];
    total_assigned_classes: number;
    total_primary_classes: number;
    total_secondary_classes: number;
    total_students: number;
    has_assignments: boolean;
    using_legacy_data: boolean;
    assignment_summary: {
      primary_teacher_for: number;
      subject_teacher_for: number;
      assistant_teacher_for: number;
      substitute_teacher_for: number;
    };
    subjects_taught: string[];
  };
}

// Attendance API functions
export const attendanceApi = {
  // Mark daily attendance
  markDailyAttendance: async (
    payload: AttendancePayload,
    token: string
  ): Promise<ApiResponse<AttendanceResponse> | ApiErrorResponse | Blob> => {
    return apiClient.post<AttendanceResponse>('/api/attendance/daily', payload, token);
  },

  // Get attendance for a specific date and class (Teacher)
  getClassAttendance: async (
    classDivisionId: string,
    date: string,
    token: string
  ): Promise<ApiResponse<ClassAttendanceResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get<ClassAttendanceResponse>(
      `/api/attendance/daily/class/${classDivisionId}?date=${date}`,
      token
    );
  },

  // Get attendance status for a date and division
  getAttendanceStatus: async (
    classDivisionId: string,
    date: string,
    token: string
  ): Promise<ApiResponse<AttendanceStatusResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get<AttendanceStatusResponse>(
      `/api/attendance/status/${classDivisionId}?date=${date}`,
      token
    );
  },

  // Get attendance for a date range (Teacher)
  getAttendanceRange: async (
    classDivisionId: string,
    startDate: string,
    endDate: string,
    token: string
  ): Promise<ApiResponse<AttendanceRangeResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get<AttendanceRangeResponse>(
      `/api/attendance/daily/class/${classDivisionId}/range?start_date=${startDate}&end_date=${endDate}`,
      token
    );
  },

  // Get student attendance details for a date range (Teacher)
  getStudentAttendanceDetails: async (
    studentId: string,
    startDate: string,
    endDate: string,
    token: string
  ): Promise<ApiResponse<StudentAttendanceDetailsResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get<StudentAttendanceDetailsResponse>(
      `/api/attendance/student/${studentId}/details?start_date=${startDate}&end_date=${endDate}`,
      token
    );
  },

  // Get teacher summary
  getTeacherSummary: async (
    startDate: string,
    endDate: string,
    token: string
  ): Promise<ApiResponse<TeacherSummaryResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get<TeacherSummaryResponse>(
      `/api/attendance/teacher/summary?start_date=${startDate}&end_date=${endDate}`,
      token
    );
  },

  // Get student summary (Parent)
  getStudentSummary: async (
    studentId: string,
    academicYearId: string,
    startDate: string,
    endDate: string,
    token: string
  ): Promise<ApiResponse<StudentSummaryResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get<StudentSummaryResponse>(
      `/api/attendance/student/${studentId}/summary?academic_year_id=${academicYearId}&start_date=${startDate}&end_date=${endDate}`,
      token
    );
  },

  // Get all classes attendance summary for Principal/Admin
  getAllClassesSummary: async (
    date: string,
    token: string
  ): Promise<ApiResponse<PrincipalAllClassesSummaryResponse> | ApiErrorResponse | Blob> => {
    return apiClient.get<PrincipalAllClassesSummaryResponse>(
      `/api/attendance/principal/all-classes-summary?date=${date}`,
      token
    );
  },

  // Get teacher information and assignments
  getTeacherInfo: async (
    token: string
  ): Promise<ApiResponse<TeacherInfoResponse['data']> | ApiErrorResponse | Blob> => {
    return apiClient.get<TeacherInfoResponse['data']>(
      '/api/academic/my-teacher-id',
      token
    );
  },
};
