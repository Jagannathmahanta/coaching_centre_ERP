const service = require("./dashboard.service");

exports.getDashboard = async (req, res) => {
  try {
    const data = await service.getDashboard(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.getTeacherDashboard = async (req, res) => {
  try {
    const data = await service.getTeacherDashboard(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.getStudentDashboard = async (req, res) => {
  try {
    const data = await service.getStudentDashboard(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.getParentDashboard = async (req, res) => {
  try {
    const data = await service.getParentDashboard(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.checkInTeacher = async (req, res) => {
  try {
    const data = await service.checkInTeacher(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.checkOutTeacher = async (req, res) => {
  try {
    const data = await service.checkOutTeacher(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};
