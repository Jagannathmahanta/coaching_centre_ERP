const service = require("./catalog.service");

const respond = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getBootstrap = respond(service.getBootstrap);
exports.getPublicLanding = respond(service.getPublicLanding);
exports.getClasses = respond(service.getClasses);
exports.createClass = respond(service.createClass);
exports.updateClass = respond(service.updateClass);
exports.getCourses = respond(service.getCourses);
exports.createCourse = respond(service.createCourse);
exports.updateCourse = respond(service.updateCourse);
exports.getBatches = respond(service.getBatches);
exports.createBatch = respond(service.createBatch);
exports.updateBatch = respond(service.updateBatch);
