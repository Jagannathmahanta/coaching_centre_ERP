import {
  LayoutDashboard,
  Users,
  GraduationCap,
  IndianRupee,
  BookOpen,
  ClipboardList,
  FileText,
  Calendar,
  Layers3,
  MonitorCheck,
  Settings,
} from "lucide-react";

export type UserRole = "admin" | "student" | "parent" | "teacher" | "super_admin";

export type NavItem = {
  path: string;
  labelKey: string;
  icon: React.ElementType;
};

const allMenus: Record<UserRole, NavItem[]> = {
  admin: [
    { path: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { path: "/students", labelKey: "nav.students", icon: Users },
    { path: "/catalog", labelKey: "nav.catalog", icon: Layers3 },
    { path: "/teachers", labelKey: "nav.staff", icon: GraduationCap },
    { path: "/fees", labelKey: "nav.fees", icon: IndianRupee },
    { path: "/hostel", labelKey: "nav.hostel", icon: Users },
    { path: "/teacher-salary", labelKey: "nav.staffSalary", icon: IndianRupee },
    { path: "/exams", labelKey: "nav.exams", icon: BookOpen },
    { path: "/assignment", labelKey: "nav.assignment", icon: ClipboardList },
    { path: "/online-exam", labelKey: "nav.onlineExam", icon: MonitorCheck },
    { path: "/attendance", labelKey: "nav.attendance", icon: ClipboardList },
    { path: "/holidays", labelKey: "nav.holidays", icon: Calendar },
    { path: "/leaves", labelKey: "nav.leaves", icon: Calendar },
    { path: "/notices", labelKey: "nav.notices", icon: FileText },
    { path: "/settings", labelKey: "nav.settings", icon: Settings },
    // { path: "/parents", label: "Parents", icon: Users },
  ],

  student: [
    { path: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { path: "/assignment", labelKey: "nav.assignment", icon: ClipboardList },
    { path: "/online-exam", labelKey: "nav.onlineExam", icon: MonitorCheck },
    // { path: "/leaves", label: "Leaves", icon: Calendar },
    { path: "/holidays", labelKey: "nav.holidays", icon: Calendar },
    { path: "/notices", labelKey: "nav.notices", icon: FileText },
  ],

  parent: [
    { path: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
   { path: "/holidays", labelKey: "nav.holidays", icon: Calendar },
    { path: "/notices", labelKey: "nav.notices", icon: FileText },
  ],

  teacher: [
    { path: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    // { path: "/students", label: "Students", icon: Users },
    { path: "/assignment", labelKey: "nav.assignment", icon: ClipboardList },
    { path: "/online-exam", labelKey: "nav.onlineExam", icon: MonitorCheck },
    { path: "/attendance", labelKey: "nav.attendance", icon: ClipboardList },
    { path: "/leaves", labelKey: "nav.leaves", icon: Calendar },
    { path: "/holidays", labelKey: "nav.holidays", icon: Calendar },
    { path: "/notices", labelKey: "nav.notices", icon: FileText },
  ],

  super_admin: [
    { path: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  ],
};

const staffTeacherMenu: NavItem[] = [
  { path: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { path: "/leaves", labelKey: "nav.leaves", icon: Calendar },
  { path: "/notices", labelKey: "nav.notices", icon: FileText },
];

export function getSidebarMenu(role: UserRole, isStaffTeacher = false): NavItem[] {
  if (role === "teacher" && isStaffTeacher) {
    return staffTeacherMenu;
  }
  return allMenus[role] || [];
}
