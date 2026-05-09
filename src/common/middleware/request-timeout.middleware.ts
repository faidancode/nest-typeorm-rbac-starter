import type { NextFunction, Request, Response } from 'express';
import { fail } from '../http/response';

export function createRequestTimeoutMiddleware(timeoutMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json(
          fail('REQUEST_TIMEOUT', 'Request exceeded timeout limit', {
            timeoutMs,
          }),
        );
      }
    }, timeoutMs);

    const cleanup = () => clearTimeout(timer);

    res.on('finish', cleanup);
    res.on('close', cleanup);

    next();
  };
}
