const service = require("./holidays.service");

exports.getHolidays = async (req, res) => {
  try {
    const data = await service.getHolidays(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const data = await service.createHoliday(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const data = await service.deleteHoliday(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
