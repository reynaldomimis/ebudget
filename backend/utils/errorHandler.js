class AppError extends Error {
  constructor(code, message, details = {}, statusCode = 400) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
    this.success = false;
  }
}

const handleError = (err, res) => {
  const { statusCode = 500, code = "INTERNAL_SERVER_ERROR", message, details = {} } = err;
  res.status(statusCode).json({
    success: false,
    code,
    message,
    details
  });
};

module.exports = {
  AppError,
  handleError
};
