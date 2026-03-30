const router = require("express").Router();
const controller = require("./teacherSalary.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/structures", auth, controller.getStructures);
router.post("/structures", auth, controller.saveStructure);
router.get("/slips", auth, controller.getSlips);
router.post("/slips/generate", auth, controller.generateSlips);
router.patch("/slips/:id/pay", auth, controller.paySlip);

module.exports = router;
