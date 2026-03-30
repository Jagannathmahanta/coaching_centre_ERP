const service = require("./notices.service");

exports.getNotices = async (req, res) => {
  try {
    const data = await service.getNotices(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const data = await service.createNotice(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const data = await service.deleteNotice(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};