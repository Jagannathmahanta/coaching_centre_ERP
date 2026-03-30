const service = require("./transport.service");

exports.getRoutes = async (req, res) => {
  try {
    const data = await service.getRoutes(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const data = await service.createRoute(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.assignStudent = async (req, res) => {
  try {
    const data = await service.assignStudent(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};