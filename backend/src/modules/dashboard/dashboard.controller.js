const service = require("./dashboard.service");

exports.getDashboard = async (req, res) => {
  try {
    const data = await service.getDashboard(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};