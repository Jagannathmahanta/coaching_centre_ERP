const router = require("express").Router();
const controller = require("./attendance.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/roster", auth, controller.getRoster);
router.get("/history", auth, controller.getHistory);
router.post("/save", auth, controller.saveAttendance);

module.exports = router;
