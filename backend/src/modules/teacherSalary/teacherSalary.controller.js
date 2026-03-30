const service = require("./teacherSalary.service");

exports.getStructures = async (req, res) => {
  try {
    const data = await service.getStructures(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.saveStructure = async (req, res) => {
  try {
    const data = await service.saveStructure(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getSlips = async (req, res) => {
  try {
    const data = await service.getSlips(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.generateSlips = async (req, res) => {
  try {
    const data = await service.generateSlips(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.paySlip = async (req, res) => {
  try {
    const data = await service.paySlip(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
