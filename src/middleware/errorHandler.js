export function errorHandler(err, req, res, next) {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "MulterError" || message.includes("Only PNG")) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message,
    },
  });
}
