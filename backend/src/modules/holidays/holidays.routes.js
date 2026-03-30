const router = require("express").Router();
const controller = require("./holidays.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/", auth, controller.getHolidays);
router.post("/", auth, controller.createHoliday);
router.delete("/:id", auth, controller.deleteHoliday);

module.exports = router;
