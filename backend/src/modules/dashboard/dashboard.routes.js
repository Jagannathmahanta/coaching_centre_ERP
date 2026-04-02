const router = require("express").Router();
const controller = require("./dashboard.controller");
const auth = require("../../middleware/auth.middleware");

// GET dashboard stats
router.get("/", auth, controller.getDashboard);
router.get("/student", auth, controller.getStudentDashboard);
router.get("/parent", auth, controller.getParentDashboard);
router.get("/teacher", auth, controller.getTeacherDashboard);
router.post("/teacher/check-in", auth, controller.checkInTeacher);
router.post("/teacher/check-out", auth, controller.checkOutTeacher);

module.exports = router;
