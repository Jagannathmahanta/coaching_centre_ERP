// routes/DashboardRoute.tsx

import { useAuth } from "../../../shared/hooks/AuthContext";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import ParentDashboardPage from "../pages/ParentDashboardPage";
import StudentDashboardPage from "../pages/StudentDashboardPage";
import TeacherDashboardPage from "../pages/TeacherDashboardPage";



export default function DashboardRoute() {
  const { profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  const role = profile?.role; 

  switch (role) {
    case "admin":
      return <AdminDashboardPage />;
    case "student":
      return <StudentDashboardPage />;
    case "teacher":
      return <TeacherDashboardPage />;
    case "parent":
      return <ParentDashboardPage />;
    default:
      return <div>Unauthorized</div>;
  }
}