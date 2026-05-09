# Phase 3 Implementation

This document summarizes phase 3 work focused on observability and abuse protection.

## What Was Done

### 1. Structured logging was added

Files:
- `src/common/logging/app-logger.service.ts`
- `src/common/logging/logging.module.ts`
- `src/common/logging/request-logging.interceptor.ts`
- `src/common/http/http-exception.filter.ts`

Added:
- JSON logging through `winston`.
- Automatic `requestId` and `userId` correlation.
- Request logging with method, path, status, duration, and IP.

Why it matters:
- Makes logs easier to search and aggregate.
- Improves debugging during incidents.

### 2. Request correlation was strengthened

Files:
- `src/common/context/request-context.service.ts`
- `src/common/middleware/request-id.middleware.ts`
- `src/common/logging/request-logging.interceptor.ts`

Added:
- Request ID is generated at the edge.
- User ID is stored in request context after auth.
- The same context is reused by logs and audits.

Why it matters:
- Lets you trace a single request through the whole request path.

### 3. Rate limiting was added

Files:
- `src/common/rate-limit/rate-limit.service.ts`
- `src/common/rate-limit/rate-limit.module.ts`
- `src/common/middleware/rate-limit.middleware.ts`

Added:
- Global per-IP rate limiting.
- Stricter limits for login.
- Rate limit headers in responses.
- Bypass for health and readiness endpoints.

Why it matters:
- Reduces abuse and brute-force attempts.

### 4. Request timeout was added

Files:
- `src/common/middleware/request-timeout.middleware.ts`
- `src/config/env.schema.ts`
- `src/config/app.config.ts`

Added:
- Configurable timeout via `REQUEST_TIMEOUT_MS`.
- `503 REQUEST_TIMEOUT` response for slow requests.

Why it matters:
- Prevents requests from hanging too long and consuming resources.

### 5. Audit logging was added

Files:
- `src/common/logging/audit.service.ts`
- `src/department/department.service.ts`
- `src/position/position.service.ts`
- `src/user/user.service.ts`
- `src/role/services/role.service.ts`
- `src/employee/employee.service.ts`

Added:
- Audit events for critical write actions.
- Metadata such as actor, request ID, before/after, and resource IDs.

Why it matters:
- Provides a business-level trail for important changes.

## Tips and Tricks

1. Use `AppLoggerService` instead of `console.log`.
2. Keep audit payloads minimal and focused on business meaning.
3. Use `requestId` as the primary correlation key.
4. Move rate limiting to a shared store later if the app becomes multi-instance.
5. Tune timeout values per environment rather than assuming one global number fits all.

## Notes

Phase 3 covers the operational baseline, but not async/event processing yet.
That remains a future enhancement if the app starts using queues or brokers.

