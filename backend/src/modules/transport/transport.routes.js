const router = require("express").Router();
const controller = require("./transport.controller");
const auth = require("../../middleware/auth.middleware");

// GET all routes
router.get("/routes", auth, controller.getRoutes);

// CREATE route
router.post("/routes", auth, controller.createRoute);

// ASSIGN student to route
router.post("/assign", auth, controller.assignStudent);

module.exports = router;