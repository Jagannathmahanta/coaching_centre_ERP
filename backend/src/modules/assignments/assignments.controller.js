const service = require("./assignments.service");

const respond = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getAssignments = respond(service.getAssignments);
exports.createAssignment = respond(service.createAssignment);
exports.updateAssignment = respond(service.updateAssignment);
exports.deleteAssignment = respond(service.deleteAssignment);
