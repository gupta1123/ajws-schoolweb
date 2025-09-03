export interface LeaveRequest {
  id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
  student: {
    id: string;
    full_name: string;
    admission_number: string;
    student_academic_records: Array<{
      roll_number: string;
      class_division: {
        id: string;
        division: string;
        level: {
          id: string;
          name: string;
          sequence_number: number;
        };
      };
    }>;
  };
  parent?: {
    id: string;
    full_name: string;
    phone_number: string;
    email: string;
  };
  urgency?: 'normal' | 'urgent';
  additional_notes?: string;
}

export interface CreateLeaveRequest {
  student_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  additional_notes?: string;
}

export interface UpdateLeaveRequestStatus {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface ListLeaveRequestsParams {
  status?: 'pending' | 'approved' | 'rejected';
  student_id?: string;
  class_division_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface LeaveRequestsResponse {
  status: string;
  data: {
    leave_requests: LeaveRequest[];
  };
  cached?: boolean;
  statusCode?: number;
}

export interface LeaveRequestResponse {
  status: string;
  data: {
    leave_request: LeaveRequest;
  };
  cached?: boolean;
  statusCode?: number;
}
