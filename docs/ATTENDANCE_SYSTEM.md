# Attendance System Documentation

## Overview

The Attendance System is a comprehensive solution for teachers to manage daily student attendance, view analytics, and generate reports. It integrates with the school's backend API to provide real-time attendance tracking and management.

## Features

### For Teachers
- **Daily Attendance Marking**: Mark attendance for individual classes with present/absent/late status
- **Class Overview**: View all assigned classes and their attendance status
- **Attendance Analytics**: Comprehensive dashboard with attendance trends and statistics
- **Reports**: Generate and export attendance reports
- **Quick Actions**: Bulk operations like "Mark All Present" or "Absent First" mode

### For Administrators
- **School-wide Overview**: View attendance across all classes
- **Holiday Management**: Mark holidays and manage attendance exceptions
- **Performance Monitoring**: Track attendance trends and identify patterns

## API Endpoints

### Core Attendance Endpoints

#### 1. Mark Daily Attendance
- **POST** `/api/attendance/daily`
- **Purpose**: Mark attendance for a specific class on a specific date
- **Payload**:
```json
{
  "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
  "attendance_date": "2025-08-28",
  "present_students": ["d2e4585e-830c-40ba-b29c-cc62ff146607"]
}
```

#### 2. Get Class Attendance
- **GET** `/api/attendance/daily/class/{classId}?date={date}`
- **Purpose**: Retrieve attendance records for a specific class and date
- **Response**: Includes daily attendance details and individual student records

#### 3. Get Attendance Status
- **GET** `/api/attendance/status/{classId}?date={date}`
- **Purpose**: Check if attendance has been marked for a specific class and date
- **Response**: Attendance status and student records

#### 4. Get Teacher Summary
- **GET** `/api/attendance/teacher/summary?start_date={start}&end_date={end}`
- **Purpose**: Get comprehensive attendance summary for all teacher's classes
- **Response**: Overall statistics, class-wise breakdown, and daily trends

#### 5. Get Attendance Range
- **GET** `/api/attendance/daily/class/{classId}/range?start_date={start}&end_date={end}`
- **Purpose**: Get attendance records for a date range
- **Response**: Multiple daily attendance records with student details

#### 6. Get Student Details
- **GET** `/api/attendance/student/{studentId}/details?start_date={start}&end_date={end}`
- **Purpose**: Get detailed attendance history for a specific student
- **Response**: Student's attendance record over time

## Data Models

### Student Attendance Record
```typescript
interface StudentAttendanceRecord {
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
}
```

### Daily Attendance
```typescript
interface DailyAttendance {
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
```

### Teacher Summary
```typescript
interface TeacherSummaryResponse {
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
```

## Components

### 1. Main Attendance Page (`/attendance`)
- **Overview Tab**: KPI cards, class selection, and quick actions
- **Reports Tab**: Comprehensive analytics dashboard
- **Features**:
  - Class overview with search and filtering
  - Unmarked attendance alerts
  - Quick tips and guidance

### 2. Class Attendance Page (`/attendance/[classId]`)
- **Purpose**: Mark attendance for individual students in a class
- **Features**:
  - Student list with attendance status
  - Present/Absent/Late marking
  - Bulk operations (Mark All Present, Absent First mode)
  - Real-time statistics
  - Search and filter students

### 3. Attendance Dashboard Component
- **Purpose**: Display comprehensive attendance analytics
- **Features**:
  - Key metrics (total classes, attendance days, students, average)
  - Attendance overview charts
  - Class performance comparison
  - Detailed breakdown tables
  - Date range selection
  - Export functionality

## Hooks

### useAttendance Hook
Provides state management and API calls for attendance operations:

```typescript
const {
  students,
  attendance,
  loading,
  error,
  setAttendance,
  markAllPresent,
  markAllAbsent,
  submitAttendance,
  loadClassAttendance,
  presentCount,
  absentCount,
  totalCount,
  attendancePercentage
} = useAttendance();
```

## Usage Examples

### Marking Attendance
```typescript
// Set individual student attendance
setAttendance(studentId, 'present');

// Mark all students as present
markAllPresent();

// Submit attendance to API
const success = await submitAttendance(classId, date);
```

### Loading Attendance Data
```typescript
// Load class attendance for a specific date
await loadClassAttendance(classId, date);

// Load teacher summary for a date range
const summary = await loadTeacherSummary(startDate, endDate);
```

## Authentication

All attendance API calls require a valid JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

The token is automatically included from the auth context when making API calls.

## Error Handling

The system includes comprehensive error handling:
- Network errors with user-friendly messages
- Validation errors for missing data
- Loading states and error boundaries
- Toast notifications for success/error feedback

## Best Practices

### For Teachers
1. **Mark attendance daily** to maintain accurate records
2. **Use the "Absent First" mode** for faster marking when most students are present
3. **Review attendance patterns** regularly using the reports tab
4. **Export data** for parent meetings or administrative purposes

### For Developers
1. **Handle loading states** appropriately to provide good UX
2. **Validate data** before making API calls
3. **Use the attendance hook** for consistent state management
4. **Implement proper error boundaries** for robust error handling

## Future Enhancements

- **Bulk Import**: Import attendance from CSV files
- **Mobile App**: Native mobile application for attendance marking
- **Notifications**: Automated reminders for unmarked attendance
- **Advanced Analytics**: Machine learning insights and predictions
- **Integration**: Connect with other school systems (timetable, calendar)

## Troubleshooting

### Common Issues

1. **Attendance not saving**
   - Check if the user has proper permissions
   - Verify the class ID and date are valid
   - Ensure the API endpoint is accessible

2. **Students not loading**
   - Verify the class has students assigned
   - Check if the teacher has access to the class
   - Ensure the API response format matches expected structure

3. **Statistics not updating**
   - Refresh the page to reload data
   - Check if the date range is valid
   - Verify the API calls are successful

### Debug Information

Enable console logging to see detailed API calls and responses:
```typescript
// In the attendance hook
console.log('API Response:', response);
console.log('Attendance State:', attendance);
```

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
