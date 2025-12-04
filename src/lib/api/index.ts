// src/lib/api/index.ts

export { apiClient } from './client';
export type { ApiResponse, ApiErrorResponse } from './client';
export { homeworkServices } from './homework';
export { birthdayServices } from './birthdays';
export { calendarServices } from './calendar';
export { classesServices } from './classes';
export { classworkServices } from './classwork';
export { leaveRequestServices } from './leave-requests';
export { academicServices } from './academic';
export { staffServices } from './staff';
export { studentServices } from './students';
export { parentServices } from './parents';
export { attendanceApi } from './attendance';
export type * from './attendance';
export { timetableApi } from './timetable';
export type * from './timetable';
export { principalChatsServices } from './principal-chats';
export type * from './principal-chats';
export { classDivisionsServices } from './class-divisions';
export type {
  ClassLevel,
  AcademicYear,
  ClassDivision,
  ClassDivisionsResponse
} from './class-divisions';
// Rename Teacher from class-divisions to avoid conflict
export type { Teacher as ClassTeacher } from './class-divisions';
export { teachersServices } from './teachers';
export type {
  TeacherAssignment as TeachersTeacherAssignment,
  TeacherAssignments
} from './teachers';
export { chatThreadsServices } from './chat-threads';
export type {
  ChatThread,
  ChatThreadsResponse,
  ChatMessage,
  ChatMessagesResponse
} from './chat-threads';
// Rename ChatParticipant from chat-threads to avoid conflict
export type { ChatParticipant as ThreadChatParticipant } from './chat-threads';
export { principalMessagingServices } from './principal-messaging';
export type {
  PrincipalClassDivision,
  PrincipalClassDivisionsResponse,
  PrincipalTeacher,
  PrincipalTeachersWithAssignmentsResponse,
  PrincipalDivisionTeacher,
  PrincipalDivisionMessage,
  PrincipalDivisionMessagesResponse,
  PrincipalDivisionThread,
  PrincipalDivisionParent,
  PrincipalDivisionStudent,
  PrincipalDivisionParentsResponse
} from './principal-messaging';
export { passwordServices } from './passwords';
export type {
  ResetPasswordRequest,
  BulkResetPasswordRequest,
  BulkResetPasswordResponse
} from './passwords';