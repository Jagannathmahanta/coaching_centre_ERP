const router = require("express").Router();
const controller = require("./parents.controller");
const auth = require("../../middleware/auth.middleware");

// GET all parents with children
router.get("/", auth, controller.getParents);

module.exports = router;