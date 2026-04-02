const router = require("express").Router();
const controller = require("./student.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/", auth, controller.getStudents);
router.get("/:id", auth, controller.getStudentById);
router.post("/", auth, controller.createStudent);
router.patch("/:id/deactivate", auth, controller.deactivateStudent);
router.patch("/:id", auth, controller.updateStudent);
router.delete("/:id", auth, controller.deleteStudent);

module.exports = router;
