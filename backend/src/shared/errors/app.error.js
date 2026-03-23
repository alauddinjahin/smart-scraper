'use strict';

const logger = require('../config/logger');

// --- Domain error -------------------------------------------------
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode    = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError     extends AppError { constructor(m = 'Not found')     { super(m, 404); } }
class BadRequestError   extends AppError { constructor(m = 'Bad request')   { super(m, 400); } }
class ConflictError     extends AppError { constructor(m = 'Conflict')      { super(m, 409); } }
class UnprocessableError extends AppError { constructor(m = 'Unprocessable') { super(m, 422); } }

// --- Express handlers ----------------------------------------------
const notFoundHandler = (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });

const errorHandler = (err, _req, res, _next) => {
  logger.error(`[error] ${err.message}`);

  // Prisma error codes
  if (err.code === 'P2025')
    return res.status(404).json({ success: false, message: 'Record not found' });
  if (err.code === 'P2002')
    return res.status(409).json({ success: false, message: 'Unique constraint violation' });

  // Zod validation
  if (err.name === 'ZodError')
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });

  const status = err.isOperational ? err.statusCode : 500;
  return res.status(status).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  AppError, NotFoundError, BadRequestError, ConflictError, UnprocessableError,
  notFoundHandler, errorHandler,
};
