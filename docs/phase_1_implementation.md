# Phase 1 Implementation

This document summarizes phase 1 work to make the API production-ready at the base level.

## What Was Done

### 1. Main bootstrap was hardened in `src/main.ts`

Added:
- `helmet` for basic security headers.
- CORS driven by `AppConfig`.
- Global response envelope and exception filter.
- Request ID middleware.
- Graceful shutdown hooks.
- Versioned bootstrap behavior and environment-driven port handling.

Why it matters:
- Makes startup behavior more predictable.
- Improves security and operational safety.
- Establishes a consistent request lifecycle.

### 2. Centralized error handling was added

Files:
- `src/common/http/http-exception.filter.ts`

Added:
- Consistent error envelope mapping.
- `ZodError` handling for validation failures.
- Business error codes for common HTTP cases.
- Internal error hiding for unexpected failures.

Why it matters:
- Prevents leaking internal details to clients.
- Keeps error responses stable and easier to consume.

### 3. Request ID context was added

Files:
- `src/common/context/request-context.service.ts`
- `src/common/context/request-context.module.ts`
- `src/common/middleware/request-id.middleware.ts`

Added:
- Request ID generation when the header is missing.
- Request ID propagation to response headers.
- Async-local request context storage.

Why it matters:
- Makes request tracing and log correlation possible.

### 4. Health and readiness endpoints were added

Files:
- `src/health/health.controller.ts`

Endpoints:
- `GET /v1/health`
- `GET /v1/ready`

Why it matters:
- Supports liveness and readiness checks.
- Helps infrastructure detect whether the app and database are usable.

### 5. Runtime config handling was cleaned up

Files:
- `src/database/database.module.ts`
- `src/database/typeorm.options.ts`
- `src/config/app.config.ts`

Added:
- Runtime DB config now comes from `AppConfig`.
- Debug logging was removed.
- CLI fallback still exists for migrations and seed tasks.

### 6. Pagination typing was fixed

Files:
- `src/common/http/response.ts`

Added:
- Exported `PaginatedResponse` so pagination-based services compile cleanly.

## Tips and Tricks

1. Keep new errors flowing through the centralized filter.
2. Store additional request metadata in `RequestContextService`.
3. Use `AppConfig` instead of reading `process.env` directly in application code.
4. Let Zod throw validation errors and let the filter normalize them.
5. Use `/ready` to check dependencies such as the database.

## Notes

Phase 1 does not cover logging, rate limiting, Swagger, or idempotency yet.
Those were handled in later phases.

