# School Management System - Detailed PRD by Roles and Pages

## Executive Summary

This document provides a comprehensive Product Requirements Document (PRD) for the School Management System, organized by user roles and individual pages. The system is a Next.js 14+ web application built with TypeScript, Tailwind CSS, and Radix UI components, designed to serve three primary user roles: Teachers, Administrators, and Principals.

## System Architecture Overview

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Context API for authentication and theme
- **Authentication**: JWT-based with role-based access control
- **Layout**: Responsive design with role-specific navigation
- **Data**: Currently using mock data with API integration ready

## User Roles and Access Control

### 1. Teacher Role
- **Access Level**: Limited to teacher-specific features
- **Primary Functions**: Class management, homework/classwork, attendance, assessments
- **Navigation**: Teacher-specific sidebar with academic and communication tools

### 2. Administrator Role
- **Access Level**: School-wide management capabilities
- **Primary Functions**: Student/staff management, academic structure, resources
- **Navigation**: Admin sidebar with comprehensive management tools

### 3. Principal Role
- **Access Level**: Full system access with approval workflows
- **Primary Functions**: All admin functions plus approvals and oversight
- **Navigation**: Same as admin with additional approval capabilities

---

## Detailed Page Requirements by Role

## TEACHER ROLE PAGES

### 1. Dashboard (`/dashboard`)
**Purpose**: Central hub for daily teaching activities and quick access to key information

**Core Features**:
- Personalized welcome banner with teacher's name
- Class overview cards showing assigned classes with health scores
- Performance summary with homework submission rates
- Upcoming events and deadlines
- Recent activity feed
- Quick action buttons for common tasks

**UI Components**:
- WelcomeBanner - Personalized greeting with time-based messages
- ClassOverviewCard - Visual class cards with performance indicators
- PerformanceSummaryCard - Homework and class performance metrics
- UpcomingEvents - Calendar-style event display
- RecentActivity - Chronological activity feed
- QuickActionsCarousel - Role-specific action launcher

**Data Requirements**:
- Teacher's assigned classes and divisions
- Homework submission statistics
- Class performance metrics
- Upcoming calendar events
- Recent system activities

### 2. My Classes (`/classes`)
**Purpose**: View and manage assigned classes with student rosters

**Core Features**:
- Grid view of assigned classes
- Class cards showing class name, division, student count
- Quick actions per class (view roster, create homework, etc.)
- Class health indicators and performance metrics

**UI Components**:
- ClassCard - Visual class summary with action buttons
- ClassHealthIndicator - Performance and health metrics
- Quick action buttons for each class

**Data Requirements**:
- Assigned class divisions
- Student count per class
- Class performance metrics
- Academic year information

### 3. Class Details (`/classes/[id]`)
**Purpose**: Detailed view of specific class with student roster

**Core Features**:
- Student roster table with key information
- Student performance indicators
- Quick actions for individual students
- Class statistics and overview

**UI Components**:
- StudentCard - Individual student profile cards
- Performance indicators
- Action buttons for student management

**Data Requirements**:
- Student list with admission numbers, roll numbers
- Parent contact information
- Student performance data
- Attendance records

### 4. Attendance (`/attendance`)
**Purpose**: Daily attendance management for assigned classes

**Core Features**:
- Take daily attendance for classes
- View attendance records with statistics
- Mark students as present, absent, late, or on leave
- Filter by date and class
- "Absent First" mode for easier marking
- Automatic leave request integration

**UI Components**:
- Attendance form with student list
- Status indicators (present, absent, late, leave)
- Summary statistics cards
- Date and class filters

**Data Requirements**:
- Student roster for selected class
- Attendance history
- Leave request status
- Daily attendance records

### 5. Assessments (`/assessments`)
**Purpose**: Create and grade student assessments

**Core Features**:
- Create new assessments with title, subject, date, max marks
- View assessment list with filtering
- Grade assessments by entering student marks
- View average scores and completion status
- Summary statistics

**UI Components**:
- Assessment creation form
- Assessment list table
- Grading interface
- Performance summary cards

**Data Requirements**:
- Assessment details (title, subject, date, max marks)
- Student marks and grades
- Class performance averages
- Assessment completion status

### 6. Homework (`/homework`)
**Purpose**: Create and manage homework assignments

**Core Features**:
- Create homework assignments for classes
- View homework list with filtering (subject, class, date)
- Edit and delete existing homework
- Track submission rates and performance
- Performance analytics and charts

**UI Components**:
- Homework creation form
- Homework list table with filters
- DataChart - Performance visualization
- StatCard - Key metrics display
- Progress indicators

**Data Requirements**:
- Homework assignments (title, description, due date, class)
- Submission rates and scores
- Subject and class information
- Performance analytics

### 7. Classwork (`/classwork`)
**Purpose**: Record and manage daily class activities

**Core Features**:
- Create classwork entries for daily activities
- View classwork history with filtering
- Edit and delete classwork entries
- Share classwork with parents
- Topic tagging and organization

**UI Components**:
- Classwork creation form
- Classwork list table
- Topic tags and filters
- Share with parents toggle

**Data Requirements**:
- Classwork entries (subject, summary, topics, date)
- Class and division information
- Parent sharing preferences
- Topic categorization

### 8. Study Material (`/study-material`)
**Purpose**: Upload and manage learning resources

**Core Features**:
- Upload learning resources (documents, videos)
- View resource library
- Download and delete resources
- Organize by subject and class

**UI Components**:
- File upload interface
- Resource library grid
- Download and delete actions
- Organization filters

**Data Requirements**:
- Resource files and metadata
- Subject and class categorization
- Upload dates and file information

### 9. Timetable (`/timetable`)
**Purpose**: View weekly teaching schedule

**Core Features**:
- Weekly teaching schedule display
- Class, subject, time, and room information
- Filter by day of the week
- Schedule overview

**UI Components**:
- Weekly timetable grid
- Day filters
- Schedule information display

**Data Requirements**:
- Weekly class schedule
- Subject and room assignments
- Time slot information

### 10. Messages (`/messages`)
**Purpose**: Communicate with parents and students

**Core Features**:
- Compose and send messages
- View message inbox
- Message history and threading
- Recipient selection (class or individual)

**UI Components**:
- Message composition form
- Inbox table
- Message threading
- Recipient selection

**Data Requirements**:
- Message content and metadata
- Recipient information
- Message history
- Approval status (if required)

### 11. Leave Requests (`/leave-requests`)
**Purpose**: Submit and track leave requests

**Core Features**:
- Submit leave requests for students
- View request status and history
- Track approval workflow

**UI Components**:
- Leave request form
- Request status display
- History tracking

**Data Requirements**:
- Leave request details
- Approval status
- Request history
- Student information

### 12. Calendar (`/calendar`)
**Purpose**: View and manage calendar events

**Core Features**:
- Monthly calendar view
- Create class-specific events
- View upcoming events
- Event categorization

**UI Components**:
- Calendar grid component
- Event creation form
- Event list display
- Event type indicators

**Data Requirements**:
- Calendar events
- Event types and categories
- Date and time information
- Class associations

### 13. Birthdays (`/birthdays`)
**Purpose**: Track student birthdays

**Core Features**:
- View today's birthdays
- Upcoming birthday list
- Birthday statistics

**UI Components**:
- Birthday list display
- Today's birthdays highlight
- Upcoming birthdays list

**Data Requirements**:
- Student birth dates
- Class information
- Birthday statistics

---

## ADMINISTRATOR/PRINCIPAL ROLE PAGES

### 1. Dashboard (`/dashboard`)
**Purpose**: School-wide overview and management hub

**Core Features**:
- Welcome message with user role
- School-wide statistics (students, staff, classes)
- Recent activities across the system
- Pending approvals and alerts
- Quick actions for administrative tasks

**UI Components**:
- WelcomeBanner - Personalized greeting
- SchoolHealthDashboard - Key performance indicators
- ApprovalPipeline - Pending approval workflow
- RecentActivity - System-wide activity feed
- Quick action buttons

**Data Requirements**:
- School-wide statistics
- System activities
- Pending approvals
- Performance metrics

### 2. Students (`/students`)
**Purpose**: Comprehensive student management

**Core Features**:
- Student list with search and filtering
- Add new students
- View student details
- Edit student information
- Link students to parents

**UI Components**:
- Student list table
- Search and filter controls
- Add student button
- Student action buttons

**Data Requirements**:
- Student records and information
- Academic history
- Parent relationships
- Status information

### 3. Student Details (`/students/[id]`)
**Purpose**: Detailed view of individual student

**Core Features**:
- Personal information display
- Academic history
- Guardian information
- Parent linking functionality
- Edit capabilities

**UI Components**:
- Student information tabs
- Parent linking component
- Academic history table
- Edit forms

**Data Requirements**:
- Complete student profile
- Academic records
- Guardian relationships
- Contact information

### 4. Create Student (`/students/create`)
**Purpose**: Add new students to the system

**Core Features**:
- Student information form
- Academic details
- Parent linking during creation
- Validation and error handling

**UI Components**:
- Student creation form
- Parent linking interface
- Form validation
- Submit and cancel buttons

**Data Requirements**:
- Student personal information
- Academic details
- Parent information
- Validation rules

### 5. Edit Student (`/students/[id]/edit`)
**Purpose**: Modify existing student information

**Core Features**:
- Pre-populated student form
- Edit all student fields
- Save changes
- Form validation

**UI Components**:
- Edit form with current data
- Validation feedback
- Save and cancel buttons

**Data Requirements**:
- Current student data
- Validation rules
- Update permissions

### 6. Staff (`/staff`)
**Purpose**: Staff management and administration

**Core Features**:
- Staff list with search and filtering
- Add new staff members
- Edit staff information
- Manage staff status
- Role and department management

**UI Components**:
- Staff list table
- Search and filter controls
- Add staff dialog
- Edit and delete actions

**Data Requirements**:
- Staff records and information
- Role and department data
- Contact information
- Status information

### 7. Staff Details (`/staff/[id]`)
**Purpose**: View and manage individual staff members

**Core Features**:
- Staff profile information
- Role and department details
- Contact information
- Edit capabilities

**UI Components**:
- Staff profile display
- Information sections
- Edit buttons
- Action menus

**Data Requirements**:
- Complete staff profile
- Role and permissions
- Contact details
- Employment information

### 8. Create Staff (`/staff/create`)
**Purpose**: Add new staff members

**Core Features**:
- Staff information form
- Role and department selection
- User account creation
- Validation and error handling

**UI Components**:
- Staff creation form
- Role selection dropdown
- Department selection
- Form validation

**Data Requirements**:
- Staff personal information
- Role and department data
- User account details
- Validation rules

### 9. Edit Staff (`/staff/[id]/edit`)
**Purpose**: Modify existing staff information

**Core Features**:
- Pre-populated staff form
- Edit all staff fields
- Save changes
- Form validation

**UI Components**:
- Edit form with current data
- Validation feedback
- Save and cancel buttons

**Data Requirements**:
- Current staff data
- Validation rules
- Update permissions

### 10. Academic Structure (`/academic`)
**Purpose**: Manage class levels, divisions, and academic years

**Core Features**:
- Class levels management
- Class divisions management
- Academic years setup
- Teacher assignment to classes
- Subject management

**UI Components**:
- AcademicStructureManager - Comprehensive academic management
- AcademicYearManager - Year setup and management
- SubjectManager - Subject organization
- Teacher assignment interface

**Data Requirements**:
- Class levels and divisions
- Academic year information
- Teacher assignments
- Subject data

### 11. Resources (`/resources`)
**Purpose**: Manage school resources (uniforms, books)

**Core Features**:
- Uniform management
- Book list management
- Resource search and filtering
- Add/edit/delete resources

**UI Components**:
- Resource tabs (uniforms, books)
- Resource tables
- Add/edit dialogs
- Search and filter controls

**Data Requirements**:
- Resource information
- Category and classification
- Stock and pricing data
- Required status

### 12. Messages (`/messages`)
**Purpose**: School-wide communication management

**Core Features**:
- Compose and send messages
- View message inbox
- Message approval workflow
- Announcement management

**UI Components**:
- Message composition form
- Inbox table
- Approval workflow
- Announcement tools

**Data Requirements**:
- Message content and metadata
- Recipient information
- Approval status
- Announcement data

### 13. Leave Requests (`/leave-requests`)
**Purpose**: Approve and manage leave requests

**Core Features**:
- View all leave requests
- Approve or reject requests
- Filter by status and date
- Leave request statistics

**UI Components**:
- Leave request table
- Approval actions
- Status indicators
- Filter controls

**Data Requirements**:
- Leave request details
- Student and parent information
- Approval status
- Request history

### 14. Calendar (`/calendar`)
**Purpose**: School-wide event management

**Core Features**:
- View school calendar
- Create school-wide events
- Manage all events
- Event categorization

**UI Components**:
- Calendar view component
- Event creation form
- Event management tools
- Event type indicators

**Data Requirements**:
- Calendar events
- Event types and categories
- Date and time information
- Event permissions

### 15. Birthdays (`/birthdays`)
**Purpose**: Birthday tracking and statistics

**Core Features**:
- View birthday statistics
- Class birthday lists
- Birthday reports

**UI Components**:
- Birthday statistics display
- Class birthday lists
- Birthday reports

**Data Requirements**:
- Student birth dates
- Class information
- Birthday statistics

### 16. Reports (`/reports`)
**Purpose**: School-wide reporting and analytics

**Core Features**:
- Student performance reports
- Staff performance reports
- Communication statistics
- Resource utilization reports

**UI Components**:
- Report type selection
- Data visualization
- Export capabilities
- Filter controls

**Data Requirements**:
- Performance metrics
- Communication data
- Resource utilization
- Historical data

---

## SHARED PAGES (All Roles)

### 1. Profile (`/profile`)
**Purpose**: User profile management

**Core Features**:
- View personal information
- Edit profile details
- Change password
- Set preferences

**UI Components**:
- Profile information display
- Edit forms
- Password change form
- Preference settings

**Data Requirements**:
- User profile information
- Authentication data
- Preference settings
- Security information

### 2. Change Password (`/change-password`)
**Purpose**: Password management

**Core Features**:
- Current password verification
- New password entry
- Password confirmation
- Password requirements

**UI Components**:
- Password change form
- Current password field
- New password fields
- Validation feedback

**Data Requirements**:
- Current password
- New password
- Password requirements
- Validation rules

---

## TECHNICAL REQUIREMENTS

### Frontend Architecture
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom design system
- **Components**: Radix UI primitives with custom styling
- **State Management**: React Context API
- **Forms**: React Hook Form with validation

### Authentication & Security
- **Authentication**: JWT-based with localStorage
- **Authorization**: Role-based access control (RBAC)
- **Protected Routes**: Route-level access control
- **Session Management**: Automatic token refresh
- **Security**: HTTPS, secure headers, input validation

### Performance Requirements
- **Page Load**: Under 3 seconds for 95% of requests
- **Concurrent Users**: Support for 100+ simultaneous users
- **Responsiveness**: Mobile-first responsive design
- **Accessibility**: WCAG 2.1 AA compliance

### Data Management
- **Current State**: Mock data with API integration ready
- **API Integration**: RESTful API consumption
- **Error Handling**: Comprehensive error handling and retry
- **Loading States**: Proper loading and empty states
- **Validation**: Client-side and server-side validation

### UI/UX Standards
- **Design System**: Consistent component library
- **Theme Support**: Light/dark mode with system preference
- **Responsive Design**: Mobile, tablet, and desktop support
- **Accessibility**: Screen reader support, keyboard navigation
- **Internationalization**: Multi-language support ready

---

## IMPLEMENTATION STATUS

### ✅ Completed Features
1. **Authentication System** - Complete with role-based access
2. **Dashboard** - Role-specific dashboards with advanced components
3. **Student Management** - Full CRUD operations
4. **Staff Management** - Full CRUD operations
5. **Academic Structure** - Class levels, divisions, academic years
6. **Homework Management** - Create, edit, delete, analytics
7. **Classwork Management** - Create, edit, delete, filtering
8. **Messaging System** - Inbox, compose, approval workflow
9. **Calendar System** - Events, birthdays, leave management
10. **Resource Management** - Uniforms, books, CRUD operations
11. **Leave Request Management** - Submission, approval workflow
12. **Advanced UI Components** - Comprehensive component library

### 🔄 In Progress Features
1. **Teacher Assignment to Classes** - Component created, needs integration
2. **Parent-Student Linking** - Component created, needs integration
3. **Reporting & Analytics** - Components created, needs integration

### 📋 Planned Features
1. **Bulk Operations** - Import/export functionality
2. **Advanced Analytics** - Performance dashboards
3. **Mobile App Integration** - Parent portal
4. **Real-time Features** - WebSocket integration
5. **Advanced Reporting** - Custom report builder

---

## SUCCESS METRICS

### User Adoption
- **Target**: 90% of staff within 3 months
- **Measurement**: Active user tracking, login frequency

### Performance
- **Target**: <3 seconds page load for 95% of requests
- **Measurement**: Core Web Vitals, performance monitoring

### User Satisfaction
- **Target**: 4.5/5 satisfaction score
- **Measurement**: User feedback, usability testing

### System Reliability
- **Target**: 99.5% uptime
- **Measurement**: System monitoring, error tracking

### Administrative Efficiency
- **Target**: 30% reduction in administrative task time
- **Measurement**: Task completion time, user workflow analysis

---

## FUTURE ENHANCEMENTS

### Phase 1: Advanced Analytics
- Performance prediction models
- Student behavior analysis
- Resource optimization recommendations

### Phase 2: Mobile Integration
- Parent mobile application
- Push notifications
- Offline capability

### Phase 3: AI Integration
- Smart scheduling recommendations
- Automated grading assistance
- Predictive analytics

### Phase 4: Ecosystem Integration
- Learning management systems
- Financial management integration
- Transportation management
- Cafeteria management

---

This PRD provides a comprehensive overview of the School Management System organized by user roles and individual pages. Each page includes detailed requirements, UI components, and data requirements to guide development and ensure consistency across the system.
