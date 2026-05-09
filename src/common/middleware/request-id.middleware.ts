import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { RequestContextService } from '../context/request-context.service';

export function createRequestIdMiddleware(
  requestContext: RequestContextService,
  headerName: string,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const incomingRequestId = req.get(headerName)?.trim();
    const requestId = incomingRequestId || randomUUID();

    res.setHeader(headerName, requestId);

    requestContext.run(
      {
        requestId,
        method: req.method,
        path: req.originalUrl,
      },
      () => next(),
    );
  };
}
