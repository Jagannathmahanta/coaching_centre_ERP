const router = require("express").Router();
const controller = require("./teachers.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/", auth, controller.getTeachers);
router.post("/", auth, controller.createTeacher);
router.patch("/:id", auth, controller.updateTeacher);
router.delete("/:id", auth, controller.deleteTeacher);

module.exports = router;
