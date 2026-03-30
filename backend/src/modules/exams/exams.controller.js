const service = require("./exams.service");

exports.getExams = async (req, res) => {
  try {
    const data = await service.getExams(req);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createExam = async (req, res) => {
  try {
    const data = await service.createExam(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const data = await service.updateExam(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const data = await service.deleteExam(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.getExamRoster = async (req, res) => {
  try {
    const data = await service.getExamRoster(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.addResult = async (req, res) => {
  try {
    const data = await service.addResult(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.bulkUpsertResults = async (req, res) => {
  try {
    const data = await service.bulkUpsertResults(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const data = await service.getResults(req);
    res.json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
};
