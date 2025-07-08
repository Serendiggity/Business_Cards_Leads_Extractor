import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const globalErrorHandler = (
  error: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Handle operational errors
  if ('statusCode' in error && error.isOperational) {
    return res.status(error.statusCode || 500).json({
      message: error.message
    });
  }

  // Handle unknown errors
  res.status(500).json({
    message: 'Internal server error'
  });
};