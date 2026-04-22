// src/common/http/response.ts

export interface PaginationMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ResponseError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ResponseEnvelope<T = unknown> {
  ok: boolean;
  data: T | null;
  meta: PaginationMeta | null;
  error: ResponseError | null;
}

export function ok<T = unknown>(
  data: T,
  meta: PaginationMeta | null = null,
): ResponseEnvelope<T> {
  return {
    ok: true,
    data,
    meta,
    error: null,
  };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const safeLimit = Math.max(limit, 1);

  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
  };
}

export function okNoContent(): ResponseEnvelope<null> {
  return {
    ok: true,
    data: null,
    meta: null,
    error: null,
  };
}

export function fail(
  code: string,
  message: string,
  details?: unknown,
): ResponseEnvelope<null> {
  return {
    ok: false,
    data: null,
    meta: null,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}
