const router = require("express").Router();
const controller = require("./dashboard.controller");
const auth = require("../../middleware/auth.middleware");

// GET dashboard stats
router.get("/", auth, controller.getDashboard);

module.exports = router;