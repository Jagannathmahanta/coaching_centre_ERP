const service = require("./onlineExam.service");

exports.getExams = async (req, res) => {
  try {
    const data = await service.getExams(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const data = await service.getExamById(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const data = await service.createExam(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const data = await service.updateExam(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const data = await service.deleteExam(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.saveQuestions = async (req, res) => {
  try {
    const data = await service.saveQuestions(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.submitExam = async (req, res) => {
  try {
    const data = await service.submitExam(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const data = await service.getSubmissions(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getMySubmission = async (req, res) => {
  try {
    const data = await service.getMySubmission(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const data = await service.gradeSubmission(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
