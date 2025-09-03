// Staff Management Types

export interface Staff {
  id: string;
  full_name: string;
  role: string;
  department: string;
  subject?: string;
  phone_number: string;
  designation?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  teacher_id?: string; // Added teacher_id for teacher-specific API calls
  teaching_details: {
    class_teacher_of: Array<{
      class_division_id: string;
      class_name: string;
      academic_year: string;
      is_primary?: boolean;
      is_legacy?: boolean;
    }>;
    subject_teacher_of: Array<{
      class_division_id: string;
      class_name: string;
      academic_year: string;
      subject: string;
    }>;
    subjects_taught: string[];
  };
}

export interface CreateStaffRequest {
  full_name: string;
  role: string;
  department: string;
  phone_number: string;
  designation?: string;
}

export interface CreateStaffWithUserRequest {
  full_name: string;
  phone_number: string;
  role: string;
  department: string;
  designation?: string;
  password: string;
  user_role: string;
}

export interface UpdateStaffRequest {
  full_name?: string;
  phone_number?: string;
  role?: string;
  department?: string;
  designation?: string;
  is_active?: boolean;
}

export interface StaffListResponse {
  status: string;
  data: {
    staff: Staff[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

export interface StaffResponse {
  status: string;
  data: {
    staff: Staff;
  };
}

export interface StaffSyncResponse {
  status: string;
  message: string;
  data: {
    synced: number;
    total_teachers: number;
    new_staff: Staff[];
    created_users: Array<{
      staff_id: string;
      user_id: string;
      phone_number: string;
      default_password: string;
    }>;
    note: string;
  };
}

export interface StaffWithUserResponse {
  status: string;
  message: string;
  data: {
    staff: Staff;
    user: {
      id: string;
      full_name: string;
      phone_number: string;
    };
    login_credentials: {
      phone_number: string;
      password: string;
    };
  };
}

export interface DeleteStaffResponse {
  status: string;
  message: string;
}
