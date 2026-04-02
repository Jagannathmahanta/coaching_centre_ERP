const service = require("./student.service");

exports.getStudents = async (req, res) => {
  try {
    const data = await service.getStudents(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const data = await service.getStudentById(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const data = await service.createStudent(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const data = await service.updateStudent(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deactivateStudent = async (req, res) => {
  try {
    const data = await service.deactivateStudent(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const data = await service.deleteStudent(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
