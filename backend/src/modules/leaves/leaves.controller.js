const service = require("./leaves.service");

exports.getLeaves = async (req, res) => {
  try {
    const data = await service.getLeaves(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.createLeave = async (req, res) => {
  try {
    const data = await service.createLeave(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const data = await service.updateLeaveStatus(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const data = await service.deleteLeave(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
