const router = require("express").Router();
const controller = require("./leaves.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/", auth, controller.getLeaves);
router.post("/", auth, controller.createLeave);
router.patch("/:id/status", auth, controller.updateLeaveStatus);
router.delete("/:id", auth, controller.deleteLeave);

module.exports = router;
