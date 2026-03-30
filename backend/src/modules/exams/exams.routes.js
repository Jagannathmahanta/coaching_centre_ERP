const router = require("express").Router();
const controller = require("./exams.controller");
const auth = require("../../middleware/auth.middleware");

// GET all exams
router.get("/", auth, controller.getExams);

// CREATE exam
router.post("/", auth, controller.createExam);
router.patch("/:id", auth, controller.updateExam);
router.delete("/:id", auth, controller.deleteExam);

// EXAM ROSTER
router.get("/:id/roster", auth, controller.getExamRoster);

// ADD/UPDATE result
router.post("/:id/results", auth, controller.addResult);
router.post("/:id/results/bulk", auth, controller.bulkUpsertResults);

// GET results of an exam
router.get("/:id/results", auth, controller.getResults);

module.exports = router;
