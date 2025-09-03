# Leave Requests Module

This module handles leave request management for the school management system.

## Purpose

The leave requests module allows:
1. **Admins/Principals** to approve or reject leave requests from parents
2. **Quick filtering** by class, student, status, and date ranges
3. **Historical data access** for tracking leave patterns
4. **Urgent request highlighting** for time-sensitive approvals

## Key Features

### Simple Dashboard
- Clear KPI cards showing total, pending, approved, and rejected requests
- Urgent request indicators for time-sensitive approvals

### Efficient Filtering
- Search by student name, class, or parent name
- Status filtering (pending, approved, rejected)
- Class filtering
- Date range selection

### Straightforward Approval Process
- Clear approve/reject buttons for pending requests
- Detailed view for individual requests
- Leave history tracking for each student

### Responsive Design
- Works well on desktop and tablet devices
- Clean, focused interface without distractions

## User Roles

### Admins/Principals
- Full access to view, approve, and reject leave requests
- Can filter and search through all requests
- Access to detailed request information

### Teachers/Parents
- No direct access to this approval interface
- (In future implementations, parents might submit requests through a separate interface)

## Implementation Notes

This is a simplified implementation focused on core functionality:
- No complex charts or advanced analytics
- Basic KPI cards instead of detailed dashboards
- Direct table-based display of requests
- Minimal JavaScript for maximum performance

The design prioritizes ease of use for busy administrators who need to quickly process leave requests.