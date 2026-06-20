const { AppError } = require("../utils/errorHandler");

const validatePR = (req, res, next) => {
  const { activities_id, prno, amount } = req.body;
  if (!activities_id || !prno || !amount) {
    return next(new AppError("MISSING_FIELDS", "activities_id, prno, and amount are required", {}, 400));
  }
  next();
};

const validateObligation = (req, res, next) => {
  const { obrno, amount } = req.body;
  if (!obrno || !amount) {
    return next(new AppError("MISSING_FIELDS", "obrno and amount are required", {}, 400));
  }
  next();
};

module.exports = {
  validatePR,
  validateObligation
};
