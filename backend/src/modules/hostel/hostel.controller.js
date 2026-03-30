const service = require("./hostel.service");

const respond = (handler) => async (req, res) => {
  try {
    const data = await handler(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || "Something went wrong." });
  }
};

exports.getHostels = respond(service.getHostels);
exports.createHostel = respond(service.createHostel);
exports.updateHostel = respond(service.updateHostel);
exports.deleteHostel = respond(service.deleteHostel);
exports.getRooms = respond(service.getRooms);
exports.createRoom = respond(service.createRoom);
exports.updateRoom = respond(service.updateRoom);
exports.deleteRoom = respond(service.deleteRoom);
exports.getAllocations = respond(service.getAllocations);
exports.assignRoom = respond(service.assignRoom);
exports.releaseAllocation = respond(service.releaseAllocation);
