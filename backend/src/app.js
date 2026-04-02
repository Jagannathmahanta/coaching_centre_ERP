const express = require("express");
const cors = require("cors");

const authRoutes = require("./modules/auth/auth.routes");
const studentRoutes = require("./modules/students/student.routes");
const feesRoutes = require("./modules/fees/fees.routes");
const dashboardRoutes = require("./modules/dashboard/dashboard.routes");
const transportRoutes = require("./modules/transport/transport.routes");
const hostelRoutes = require("./modules/hostel/hostel.routes");
const examRoutes = require("./modules/exams/exams.routes");
const teacherRoutes = require("./modules/teachers/teachers.routes");
const teacherSalaryRoutes = require("./modules/teacherSalary/teacherSalary.routes");
const noticeRoutes = require("./modules/notices/notices.routes");
const holidayRoutes = require("./modules/holidays/holidays.routes");
const leaveRoutes = require("./modules/leaves/leaves.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const parentRoutes = require("./modules/parents/parents.routes");
const catalogRoutes = require("./modules/catalog/catalog.routes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/fees", feesRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/parents", parentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/teacher-salary", teacherSalaryRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);

module.exports = app;
