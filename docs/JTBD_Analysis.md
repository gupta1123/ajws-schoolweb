# Jobs to be Done (JTBD) Analysis

This document outlines the key "jobs to be done" for each user persona of the school management application.

---

### 1. Admin Persona

The Admin is the power user responsible for the technical and data integrity of the system. They handle the core data setup and management.

**One-Time / Infrequent Jobs:**

*   **System Setup:**
    *   **JTBD:** Configure the school's academic year and terms.
    *   **JTBD:** Set up the master list of classes, sections, and subjects.
*   **Data Import/Export:**
    *   **JTBD:** Bulk import initial data for students, parents (for records), and teachers.
    *   **JTBD:** Export data for backups or reporting.
*   **Resource Management:**
    *   **JTBD:** Create and manage the master inventory of resources like books and uniforms.
    *   **JTBD:** Define resource packages (e.g., "Grade 5 Book Set").
*   **User Account Management:**
    *   **JTBD:** Create and manage user accounts and permissions for Principals and Teachers.
    *   **JTBD:** Deactivate or archive user accounts.

**Frequent (Daily/Weekly) Jobs:**

*   **Ongoing Data Management:**
    *   **JTBD:** Add new students and their parent details as they enroll.
    *   **JTBD:** Process student withdrawals and update their status.
    *   **JTBD:** Update student, parent, or staff information upon request.
*   **System Health & Support:**
    *   **JTBD:** Troubleshoot data-related issues (e.g., incorrect student records).
    *   **JTBD:** Ensure the system is running smoothly.

---

### 2. Principal Persona

The Principal is the head of the school, focused on academic management, operational oversight, and high-level reporting.

**One-Time / Infrequent Jobs:**

*   **Academic Planning:**
    *   **JTBD:** Finalize and publish the school-wide academic calendar (holidays, exam dates, events).
    *   **JTBD:** Assign teachers to their respective classes.
    *   **JTBD:** Oversee the promotion of students to the next grade.
*   **Resource Allocation:**
    *   **JTBD:** Allocate resource packages (books, uniforms) to classes or individual students.

**Frequent (Daily/Weekly) Jobs:**

*   **School-Wide Monitoring:**
    *   **JTBD:** View and analyze school-wide attendance reports.
    *   **JTBD:** Monitor teacher performance and class progress.
    *   **JTBD:** Track key school metrics from a central dashboard.
*   **Communication:**
    *   **JTBD:** Broadcast important announcements to all staff.
*   **Approvals & Oversight:**
    *   **JTBD:** Approve or manage leave requests from staff.
    *   **JTBD:** View student profiles and their academic history.
*   **Community & Events:**
    *   **JTBD:** View upcoming student and staff birthdays to foster a positive school culture.

---

### 3. Teacher Persona

The Teacher is the front-line user, focused on their specific classes, students, and daily academic activities.

**One-Time / Infrequent Jobs:**

*   **Beginning of Term Setup:**
    *   **JTBD:** Review their assigned class lists and student profiles.
    *   **JTBD:** Set up their class timetable.

**Frequent (Daily/Weekly) Jobs:**

*   **Classroom Management:**
    *   **JTBD:** Take daily attendance for their classes.
    *   **JTBD:** Assign and grade homework and classwork.
*   **Student Evaluation:**
    *   **JTBD:** Enter marks and grades for assessments.
    *   **JTBD:** Write and view comments on student performance.
*   **Communication & Resources:**
    *   **JTBD:** View the school calendar for upcoming events.
    *   **JTBD:** Upload and share learning resources with their students.
    *   **JTBD:** View the resources (books, etc.) assigned to their students.
*   **Student Engagement:**
    *   **JTBD:** View upcoming birthdays in their class to acknowledge students.

---
---

# Gap Analysis: Current UI/UX vs. Jobs-to-be-Done (JTBD)

### 1. Admin Persona

**Overall:** The Admin persona is the most developed, with a solid foundation for data management. However, key workflows are inefficient, and some critical JTBDs are not yet addressed.

| Job to be Done (JTBD) | Status | Gap Description |
| :--- | :--- | :--- |
| **Infrequent Jobs** | | |
| Configure academic year & terms | **Not Implemented** | No UI exists to define academic years or terms. |
| Set up classes, sections, subjects | **Partially Implemented** | UI to manage classes exists (`/academic/classes`), but it's basic. No UI for managing subjects or sections. |
| Bulk import students, parents, teachers | **Implemented** | UI stubs exist in the `(admin)/bulk-import` directory. |
| Export data | **Not Implemented** | No functionality exists to export data. |
| Manage resource inventory (books, uniforms) | **Not Implemented** | No UI exists to create or manage resources. |
| Manage user accounts (Principals, Teachers) | **Partially Implemented** | A UI for managing `staff` exists, but it lacks role/permission management. |
| **Frequent Jobs** | | |
| Add new students and link parents | **Partially Implemented** | The workflow is inefficient. Students and parents are created separately and must be linked manually from the student details page. This is a major usability gap. |
| Process student withdrawals | **Not Implemented** | No UI to change a student's status to "withdrawn" or "archived". |
| Update student, parent, or staff info | **Implemented** | CRUD forms exist for students, parents, and staff. |
| Troubleshoot data issues | **Not Implemented** | This is a broad JTBD, but there are no specific tools for this. |

---

### 2. Principal Persona

**Overall:** The Principal persona has some basic monitoring features, but lacks the high-level reporting and management tools required for their role.

| Job to be Done (JTBD) | Status | Gap Description |
| :--- | :--- | :--- |
| **Infrequent Jobs** | | |
| Finalize & publish academic calendar | **Partially Implemented** | A `/calendar` page exists, but it appears to be a simple view. No UI for creating/managing events. |
| Assign teachers to classes | **Implemented** | UI exists in `/academic/classes`. |
| Oversee student promotions | **Not Implemented** | No UI for managing student promotions between grades. |
| Allocate resources to students/classes | **Not Implemented** | No UI for assigning resources. |
| **Frequent Jobs** | | |
| View school-wide attendance reports | **Not Implemented** | No attendance tracking or reporting functionality exists. |
| Monitor teacher/class progress | **Partially Implemented** | The `/reports` section has stubs for `staff` and `students`, but they are not implemented. |
| View central dashboard | **Not Implemented** | No high-level dashboard for the Principal exists. |
| Broadcast announcements | **Not Implemented** | No communication or messaging tools are implemented. |
| Approve/manage staff leave requests | **Partially Implemented** | A `/leave-requests` page exists, but it's a basic list. No approval workflow. |
| View student/staff birthdays | **Partially Implemented** | A `/birthdays` page exists, but it's a simple list. |

---

### 3. Teacher Persona

**Overall:** The Teacher persona is the least developed. While there are UI stubs for several key features, the core functionality of a teacher's daily workflow is missing.

| Job to be Done (JTBD) | Status | Gap Description |
| :--- | :--- | :--- |
| **Infrequent Jobs** | | |
| Review assigned class/student lists | **Partially Implemented** | The `(teacher)/classes` page shows a list of classes, but navigating to see student lists is not fully implemented. |
| Set up class timetable | **Not Implemented** | No UI for managing a teacher's timetable. |
| **Frequent Jobs** | | |
| Take daily attendance | **Not Implemented** | This is a critical missing feature. |
| Assign and grade homework/classwork | **Partially Implemented** | UIs for listing and creating `homework` and `classwork` exist. However, there is no functionality for students to submit work or for teachers to grade it. |
| Enter marks and grades | **Not Implemented** | No UI for entering marks for exams or assessments. |
| View school calendar | **Partially Implemented** | A `/calendar` page exists. |
| Upload/share learning resources | **Not Implemented** | No UI for managing or sharing resources. |
| View upcoming birthdays | **Partially Implemented** | Birthday information is visible on the teacher's class dashboard. |