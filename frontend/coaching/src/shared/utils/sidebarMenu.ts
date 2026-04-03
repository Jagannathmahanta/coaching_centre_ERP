import {
  LayoutDashboard,
  Users,
  GraduationCap,
  DollarSign,
  BookOpen,
  ClipboardList,
  FileText,
  Calendar,
  Layers3,
} from "lucide-react";

export type UserRole = "admin" | "student" | "parent" | "teacher";

export type NavItem = {
  path: string;
  label: string;
  icon: React.ElementType;
};

const allMenus: Record<UserRole, NavItem[]> = {
  admin: [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/students", label: "Students", icon: Users },
    { path: "/catalog", label: "Catalog", icon: Layers3 },
    { path: "/teachers", label: "Teachers", icon: GraduationCap },
    { path: "/fees", label: "Fees", icon: DollarSign },
    // { path: "/transport", label: "Transport", icon: Users },
    { path: "/hostel", label: "Hostel", icon: Users },
    { path: "/teacher-salary", label: "Teacher Salary", icon: DollarSign },
    { path: "/exams", label: "Exams", icon: BookOpen },
    { path: "/attendance", label: "Attendance", icon: ClipboardList },
    { path: "/holidays", label: "Holidays", icon: Calendar },
    { path: "/leaves", label: "Leaves", icon: Calendar },
    { path: "/notices", label: "Notices", icon: FileText },
    // { path: "/parents", label: "Parents", icon: Users },
  ],

  student: [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/assignment", label: "Assignment", icon: ClipboardList },
    // { path: "/leaves", label: "Leaves", icon: Calendar },
    { path: "/holidays", label: "Holidays", icon: Calendar },
    { path: "/notices", label: "Notices", icon: FileText },
  ],

  parent: [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
   { path: "/holidays", label: "Holidays", icon: Calendar },
    { path: "/notices", label: "Notices", icon: FileText },
  ],

  teacher: [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    // { path: "/students", label: "Students", icon: Users },
    { path: "/attendance", label: "Attendance", icon: ClipboardList },
    { path: "/leaves", label: "Leaves", icon: Calendar },
    { path: "/holidays", label: "Holidays", icon: Calendar },
    { path: "/notices", label: "Notices", icon: FileText },
  ],
};

export function getSidebarMenu(role: UserRole): NavItem[] {
  return allMenus[role] || [];
}
