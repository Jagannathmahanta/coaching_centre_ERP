import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import LoginPage from "./modules/auth/LoginPage.tsx";
import ProtectedRoute from "./modules/auth/ProtectedRoute.tsx";
import NotFoundPage from "./modules/NotFoundPage";
import SignupPage from "./modules/auth/SignupPage.tsx";
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
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardRoute />} />
          <Route path="/students" element={<StudentsRoute />} />
          <Route path="/students/new" element={<NewStudentRoute />} />
          <Route path="/students/:id/edit" element={<NewStudentRoute />} />
          <Route path="/fees" element={<FeesRoute />} />
          <Route path="/transport" element={<TransportRoute />} />
          <Route path="/hostel" element={<HostelRoute />} />
          <Route path="/teachers" element={<TeachersRoute />} />
          <Route path="/teacher-salary" element={<TeacherSalaryRoute />} />
          <Route path="/exams" element={<ExamsRoute />} />
          <Route path="/attendance" element={<AttendanceRoute />} />
          <Route path="/holidays" element={<HolidayRoute />} />
          <Route path="/leaves" element={<LeaveRoute />} />
          <Route path="/notices" element={<NoticesRoute />} />
          <Route path="/parents" element={<ParentsRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
