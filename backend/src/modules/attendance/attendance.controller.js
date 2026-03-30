const service = require("./attendance.service");

exports.getRoster = async (req, res) => {
  try {
    const data = await service.getRoster(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.saveAttendance = async (req, res) => {
  try {
    const data = await service.saveAttendance(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const data = await service.getHistory(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
