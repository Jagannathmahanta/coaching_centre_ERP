import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./layout/Layout";
import ProtectedRoute from "./modules/auth/ProtectedRoute.tsx";
import NotFoundPage from "./modules/NotFoundPage";
import SignupPage from "./features/auth/SignupPage.tsx";
import DashboardRoute from "./features/dashboard/routes/DashboardRoute.tsx";
import StudentsRoute from "./features/student/routes/StudentsRoute.tsx";
import NewStudentRoute from "./features/student/routes/NewStudentRoute.tsx";
import FeesRoute from "./features/fees/routes/FeesRoute.tsx";
import TransportRoute from "./features/transport/routes/TransportRoute.tsx";
import HostelRoute from "./features/hostel/routes/HostelRoute.tsx";
import TeachersRoute from "./features/teacher/routes/TeachersRoute.tsx";
import TeacherSalaryRoute from "./features/teacher/routes/TeacherSalaryRoute.tsx";
import ExamsRoute from "./features/exams/routes/ExamsRoute.tsx";
import AttendanceRoute from "./features/attendance/routes/AttendanceRoute.tsx";
import HolidayRoute from "./features/holiday/routes/HolidayRoute.tsx";
import LeaveRoute from "./features/leave/routes/LeaveRoute.tsx";
import NoticesRoute from "./features/notice/routes/NoticesRoute.tsx";
import ParentsRoute from "./features/parent/routes/ParentsRoute.tsx";
import LoginPage from "./features/auth/LoginPage.tsx";
import CatalogRoute from "./features/catalog/routes/CatalogRoute.tsx";
import ClientLandingPage from "./features/client-landing/index.tsx";
import MarketingLandingPage from "./features/marketing/pages/LandingPage.tsx";
import OnlineExamRoute from "./features/onlineExam/routes/OnlineExamRoute.tsx";
import AssignmentRoute from "./features/assignment/routes/AssignmentRoute.tsx";
import InstituteSettingsRoute from "./features/settings/routes/InstituteSettingsRoute.tsx";
import { resolveLandingSlug } from "./features/client-landing/service";

function shouldUseClientLanding(hostname: string, search: string) {
  const forcedSlug = resolveLandingSlug(search);
  if (forcedSlug) {
    return true;
  }

  const normalizedHost = hostname.toLowerCase();
  if (
    !normalizedHost ||
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "www.tutorialhub.co.in" ||
    normalizedHost === "tutorialhub.co.in"
  ) {
    return false;
  }

  return normalizedHost.endsWith(".tutorialhub.co.in");
}

function PublicLandingRoute() {
  const location = useLocation();
  const hostname = typeof window === "undefined" ? "" : window.location.hostname;

  return shouldUseClientLanding(hostname, location.search)
    ? <ClientLandingPage />
    : <MarketingLandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLandingRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/students" element={<StudentsRoute />} />
          <Route path="/catalog" element={<CatalogRoute />} />
          <Route path="/students/new" element={<NewStudentRoute />} />
          <Route path="/students/:id/edit" element={<NewStudentRoute />} />
          <Route path="/fees" element={<FeesRoute />} />
          <Route path="/transport" element={<TransportRoute />} />
          <Route path="/hostel" element={<HostelRoute />} />
          <Route path="/teachers" element={<TeachersRoute />} />
          <Route path="/teacher-salary" element={<TeacherSalaryRoute />} />
          <Route path="/exams" element={<ExamsRoute />} />
          <Route path="/assignment" element={<AssignmentRoute />} />
          <Route path="/online-exam" element={<OnlineExamRoute />} />
          <Route path="/attendance" element={<AttendanceRoute />} />
          <Route path="/holidays" element={<HolidayRoute />} />
          <Route path="/leaves" element={<LeaveRoute />} />
          <Route path="/notices" element={<NoticesRoute />} />
          <Route path="/settings" element={<InstituteSettingsRoute />} />
          <Route path="/parents" element={<ParentsRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
