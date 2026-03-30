const service = require("./parents.service");

exports.getParents = async (req, res) => {
  try {
    const data = await service.getParents(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};