export type UserRole = "Admin" | "Teacher" | "Student";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  studentId?: string; // If role is Student, link to student profile
  teacherClass?: string; // If role is Teacher, assigned class
}

export interface AcademicRecord {
  id: string;
  courseId: string;
  courseName: string;
  grade: string;       // e.g. "A", "B+", "C", "85%", etc.
  term: string;        // e.g. "Semester A", "Term 1"
  comments?: string;
  teacherId?: string;
  teacherName?: string;
  date: string;
}

export interface Student {
  id: string;
  fullName: string;
  class: string;
  gender: string;
  guardianPhone: string;
  status: "active" | "inactive";
  createdAt: string;
  
  // Robust SIS details
  dateOfBirth?: string;
  address?: string;
  email?: string;
  phone?: string;
  academicHistory?: AcademicRecord[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  teacherId?: string;   // Assigned Teacher User ID
  teacherName?: string; // Assigned Teacher Name
  description?: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: "Present" | "Absent" | "Excused";
  timestamp: string;
}

export interface FeeHistoryItem {
  action: string;
  amount: number;
  date: string;
}

export interface FeeInvoice {
  id: string;
  studentId?: string; // injected on UI level
  studentName?: string; // injected on UI level
  month: string;
  year: number;
  amount: number;
  paidAmount: number;
  status: "paid" | "partial" | "unpaid";
  createdAt: string;
  updatedAt: string;
  history: FeeHistoryItem[];
}

export interface SchoolSettings {
  schoolName: string;
  currency: string;
  feeAmount: number;
  systemTheme: "light" | "dark";
}

export type ViewType = "dashboard" | "students" | "attendance" | "fees" | "reports" | "settings";

