const router = require("express").Router();
const controller = require("./notices.controller");
const auth = require("../../middleware/auth.middleware");

// GET all notices
router.get("/", auth, controller.getNotices);

// CREATE notice
router.post("/", auth, controller.createNotice);

// DELETE notice
router.delete("/:id", auth, controller.deleteNotice);

module.exports = router;