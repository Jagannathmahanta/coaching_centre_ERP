const service = require("./fees.service");

const respond = (handler) => async (req, res) => {
  try {
    const data = await handler(req);
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getFees = respond(service.getFees);
exports.createFee = respond(service.createFee);
exports.payFee = respond(service.payFee);
exports.getSummary = respond(service.getSummary);
exports.getPaymentHistory = respond(service.getPaymentHistory);
exports.getStudentSummary = respond(service.getStudentSummary);
exports.getStudentPaymentHistory = respond(service.getStudentPaymentHistory);
exports.getStudentFees = respond(service.getStudentFees);
exports.payStudentFee = respond(service.payStudentFee);
exports.useAdvanceForFee = respond(service.useAdvanceForFee);
exports.adjustFee = respond(service.adjustFee);
exports.getCollectionBoard = respond(service.getCollectionBoard);
exports.getFeeStructures = respond(service.getFeeStructures);
exports.createFeeStructure = respond(service.createFeeStructure);
exports.updateFeeStructure = respond(service.updateFeeStructure);
exports.deleteFeeStructure = respond(service.deleteFeeStructure);
exports.getStudentPlan = respond(service.getStudentPlan);
exports.createStudentFeePlan = respond(service.createStudentFeePlan);
exports.updateStudentFeePlan = respond(service.updateStudentFeePlan);
