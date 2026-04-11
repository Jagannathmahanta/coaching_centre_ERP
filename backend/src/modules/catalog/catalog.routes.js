const router = require("express").Router();
const controller = require("./catalog.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/public/:slug", controller.getPublicLanding);
router.get("/bootstrap", auth, controller.getBootstrap);

router.get("/classes", auth, controller.getClasses);
router.post("/classes", auth, controller.createClass);
router.patch("/classes/:id", auth, controller.updateClass);

router.get("/courses", auth, controller.getCourses);
router.post("/courses", auth, controller.createCourse);
router.patch("/courses/:id", auth, controller.updateCourse);

router.get("/batches", auth, controller.getBatches);
router.post("/batches", auth, controller.createBatch);
router.patch("/batches/:id", auth, controller.updateBatch);

module.exports = router;
