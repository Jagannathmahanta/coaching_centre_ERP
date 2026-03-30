const service = require("./auth.service");

exports.login = async (req, res) => {
  try {
    const data = await service.login(req.body);
    res.json(data);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.register = async (req, res) => {
  try {
    const data = await service.register(req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createLinkedAccount = async (req, res) => {
  try {
    const data = await service.createLinkedAccount(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};
