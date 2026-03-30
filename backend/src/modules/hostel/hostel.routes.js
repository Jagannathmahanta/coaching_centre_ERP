const router = require("express").Router();
const controller = require("./hostel.controller");
const auth = require("../../middleware/auth.middleware");

router.get("/", auth, controller.getHostels);
router.post("/", auth, controller.createHostel);
router.patch("/:id", auth, controller.updateHostel);
router.delete("/:id", auth, controller.deleteHostel);

router.get("/rooms/list", auth, controller.getRooms);
router.post("/rooms", auth, controller.createRoom);
router.patch("/rooms/:id", auth, controller.updateRoom);
router.delete("/rooms/:id", auth, controller.deleteRoom);

router.get("/allocations/list", auth, controller.getAllocations);
router.post("/assign", auth, controller.assignRoom);
router.patch("/allocations/:id/release", auth, controller.releaseAllocation);

module.exports = router;
