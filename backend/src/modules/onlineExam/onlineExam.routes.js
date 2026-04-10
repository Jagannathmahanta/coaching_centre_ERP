const router = require("express").Router();
const controller = require("./onlineExam.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/", auth, controller.getExams);
router.get("/:id", auth, controller.getExamById);
router.post("/", auth, controller.createExam);
router.put("/:id", auth, controller.updateExam);
router.delete("/:id", auth, controller.deleteExam);
router.put("/:id/questions", auth, controller.saveQuestions);
router.post("/:id/submit", auth, controller.submitExam);
router.get("/:id/submissions", auth, controller.getSubmissions);
router.get("/:id/my-submission", auth, controller.getMySubmission);
router.patch("/submissions/:id/grade", auth, controller.gradeSubmission);

module.exports = router;
