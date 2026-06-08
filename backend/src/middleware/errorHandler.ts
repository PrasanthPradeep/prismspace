import type { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Global error handler.
 *
 * In production: masks internal error details to avoid leaking stack traces
 * or provider error messages that could expose implementation details.
 *
 * In development: returns the full error message for easier debugging.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const message = isDev
    ? err.message
    : 'An internal error occurred. Please try again.';

  res.status(500).json({ ok: false, error: message });
}
