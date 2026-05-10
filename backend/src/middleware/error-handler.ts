import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';

import { config } from '../config.js';
import { NeteaseApiError } from '../services/netease.service.js';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  void _next;

  const normalized = normalizeError(error);
  const payload: {
    error: {
      code: string;
      message: string;
      stack?: string;
    };
  } = {
    error: {
      code: normalized.code,
      message: normalized.message,
    },
  };

  if (config.nodeEnv === 'development' && normalized.stack) {
    payload.error.stack = normalized.stack;
  }

  res.status(normalized.statusCode).json(payload);
};

const normalizeError = (
  error: unknown,
): {
  statusCode: number;
  code: string;
  message: string;
  stack?: string;
} => {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error instanceof NeteaseApiError) {
    return {
      statusCode: error.status && error.status < 500 ? error.status : 502,
      code: 'NETEASE_API_ERROR',
      message: error.message,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unknown server error',
  };
};
