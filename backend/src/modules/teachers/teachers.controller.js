const service = require("./teachers.service");

exports.getTeachers = async (req, res) => {
  try {
    const data = await service.getTeachers(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const data = await service.createTeacher(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const data = await service.updateTeacher(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const data = await service.deleteTeacher(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
