const { AppError } = require("../utils/errorHandler");

const authorize = (roles = []) => {
  return (req, res, next) => {
    // Placeholder for actual auth logic (JWT verification, user retrieval)
    const userRole = req.headers['x-user-role'] || 'USER';

    if (roles.length && !roles.includes(userRole)) {
      return next(new AppError("FORBIDDEN", "You do not have permission to perform this action", {}, 403));
    }
    next();
  };
};

module.exports = {
  authorize
};
