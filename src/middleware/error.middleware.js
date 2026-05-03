const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError" && err.errors) {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return res.status(400).json({
      message: message || err.message || "Validation failed",
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid identifier",
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || "Server Error",
  });
};

module.exports = { notFound, errorHandler };
