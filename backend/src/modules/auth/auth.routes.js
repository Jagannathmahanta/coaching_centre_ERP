const router = require("express").Router();
const controller = require("./auth.controller");
const auth = require("../../middleware/auth.middleware");

router.post("/login", controller.login);
router.post("/register", controller.register);
router.post("/accounts", auth, controller.createLinkedAccount);

module.exports = router;
