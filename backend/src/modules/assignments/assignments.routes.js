const router = require("express").Router();
const controller = require("./assignments.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/", auth, controller.getAssignments);
router.post("/", auth, controller.createAssignment);
router.put("/:id", auth, controller.updateAssignment);
router.patch("/:id", auth, controller.updateAssignment);
router.delete("/:id", auth, controller.deleteAssignment);

module.exports = router;
