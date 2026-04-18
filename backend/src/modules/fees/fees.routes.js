const router = require("express").Router();
const controller = require("./fees.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/summary", auth, controller.getSummary);
router.get("/board", auth, controller.getCollectionBoard);

router.get("/structures", auth, controller.getFeeStructures);
router.post("/structures", auth, controller.createFeeStructure);
router.patch("/structures/:id", auth, controller.updateFeeStructure);
router.delete("/structures/:id", auth, controller.deleteFeeStructure);

router.get("/student/:id/plan", auth, controller.getStudentPlan);
router.post("/student/:id/plan", auth, controller.createStudentFeePlan);
router.patch("/student/:id/plan", auth, controller.updateStudentFeePlan);
router.get("/student/:id/summary", auth, controller.getStudentSummary);
router.get("/student/:id/payments", auth, controller.getStudentPaymentHistory);
router.get("/student/:id", auth, controller.getStudentFees);
router.post("/students/:id/pay", auth, controller.payStudentFee);

router.get("/", auth, controller.getFees);
router.post("/", auth, controller.createFee);

router.get("/:id/payments", auth, controller.getPaymentHistory);
router.patch("/:id/pay", auth, controller.payFee);
router.post("/:id/use-advance", auth, controller.useAdvanceForFee);
router.patch("/:id/adjust", auth, controller.adjustFee);
router.post("/payments/:id/reverse", auth, controller.reversePayment);
router.post("/payments/:id/reassign", auth, controller.reassignPayment);

module.exports = router;
