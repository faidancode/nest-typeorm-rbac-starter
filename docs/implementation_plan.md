# Implementation Plan

This document summarizes the analysis of `docs/checklist.md` to keep the API production-ready.
It tracks what is already in place, what is partial, and what still needs to be built without overengineering.

## Status Summary

Legend:
- `Done` = present and reasonably complete in the codebase.
- `Partial` = foundation exists, but the implementation is incomplete or inconsistent.
- `Todo` = no meaningful implementation yet.

| Area | Status | Notes |
| --- | --- | --- |
| API response envelope | Done | `ResponseEnvelopeInterceptor` and response helpers are in place. |
| Business error code | Done | Central error codes are available in the exception filter for common cases. |
| API versioning | Done | URI versioning is enabled in bootstrap (`/v1`). |
| JWT authentication | Done | `JwtStrategy`, `JwtAuthGuard`, and login/refresh endpoints already exist. |
| RBAC | Done | CASL guards and policy checks are implemented. |
| Refresh token flow | Partial | Refresh exists, but storage, rotation, and revocation are not implemented. |
| Secure cookie/header strategy | Partial | Tokens are still returned in the response body; no HttpOnly/Secure cookie strategy yet. |
| Request ID | Done | Request ID middleware, request context, and log correlation are in place. |
| Idempotency key | Done | Idempotency interceptor is available for mutating requests with `Idempotency-Key`. |
| Validation body/query/path | Done | `ZodValidationPipe`, `UuidSchema`, and consistent validation are used in main controllers. |
| Pagination/filter/sort | Partial | Present for employee listing, but not standardized across all resources. |
| Centralized error handling | Done | A global exception filter wraps errors into a consistent envelope. |
| Structured logging | Done | JSON logging includes `requestId` and `userId`. |
| Transaction boundary | Done | Transaction helper and transactional write flow are in place for the main write services. |
| Async/event processing | Todo | No consumer, event ID, or idempotent handler yet. |
| Rate limiting | Done | Global per-IP limits and stricter login limits are active. |
| Timeout/context propagation | Partial | Request timeout and request context exist, but cancellation is not propagated to DB/async jobs. |
| Audit log | Done | Business-level audit logging is available for critical write actions. |
| Config via env | Done | `ConfigModule.forRoot` and schema validation are already set up. |
| Startup config validation | Done | `validateEnv` fails fast on invalid environment variables. |
| Health/readiness endpoint | Done | `/health` and `/ready` exist. |
| Swagger/OpenAPI | Partial | Dependency and flag support exist, but bootstrap documentation is not wired up yet. |
| Testing coverage | Partial | Unit and controller tests exist, but production-focused coverage is still incomplete. |
| Graceful shutdown | Done | `enableShutdownHooks()` is enabled in bootstrap. |
| Docker-friendly startup | Partial | Base configuration is there, but bootstrap still reads `process.env` directly in a few places. |

## Key Findings

1. The strongest foundations are auth, RBAC, env validation, response envelopes, and now observability basics.
2. The biggest remaining production gaps are Swagger, refresh-token hardening, pagination standardization, and async/event workflow support.
3. Request validation is now consistent with Zod, but some areas still need broader request/response documentation.
4. Transaction handling is now a pattern in the main write paths, reducing partial-write risk.
5. Health checks, logging, and rate limiting are available, so the project is much closer to production readiness.

## Target End State

The API can be considered production-ready when:
- all success and error responses follow a consistent contract,
- incoming requests are validated before they reach service logic,
- internal errors do not leak to clients and business error codes stay stable,
- every request can be traced with `request_id`,
- sensitive endpoints are protected by rate limits and a clear token strategy,
- critical write paths use explicit transaction boundaries,
- health/readiness and basic observability are available,
- API documentation can be used without reading source code.

## Implementation Roadmap

### Phase 1 - Base Stability

Highest priority. The goal is to make the API safe to run and easy to operate.

1. Add the global bootstrap in `src/main.ts`.
   - Enable CORS from `AppConfig`.
   - Add a consistent Zod-based validation approach.
   - Enable `helmet`.
   - Prepare graceful shutdown hooks.
2. Add a centralized exception filter.
   - Map `HttpException` to a consistent error envelope.
   - Provide business error codes for common cases.
   - Keep internal errors hidden.
3. Add request ID middleware.
   - Generate `request_id` when the header is missing.
   - Propagate it to response headers, logs, and request context.
4. Clean up startup config handling.
   - Avoid reading `process.env.PORT` directly in bootstrap.
   - Use `AppConfig` as the source of truth.
   - Remove debug logs such as `console.log('db config')`.
5. Add health/readiness endpoints.
   - `/health` for liveness.
   - `/ready` for database readiness.

### Phase 2 - Contract, Validation, and Auth Hardening

The goal is to keep the API behavior consistent for consumers.

1. Standardize the response contract across controllers.
   - Keep list endpoints returning `items` + `meta`.
   - Normalize the error response format.
2. Expand request validation.
   - Validate body, query, and path parameters consistently.
   - Add boundary checks for limit, page, enum, and boolean coercion.
3. Finalize the auth flow.
   - Decide whether refresh tokens live in body, cookie, or a hybrid flow.
   - Add rotation or revocation if needed.
   - Document token expiry and invalid-token behavior.
4. Add an API versioning strategy.
   - Use `/v1` or Nest versioning.
   - Define backward-compatible change rules for public endpoints.
5. Add Swagger/OpenAPI bootstrap.
   - Document auth, request/response examples, and error codes.
   - Keep docs aligned with versioning.

### Phase 3 - Observability and Abuse Protection

The goal is to make the API easier to observe and harder to abuse.

1. Implement structured logging.
   - Use logs with `info`, `warn`, and `error` levels.
   - Include `request_id` and `user_id` when available.
2. Add rate limiting.
   - Enforce global per-IP limits.
   - Apply stricter limits to login and sensitive endpoints.
3. Add timeout and context propagation.
   - Set HTTP request timeouts.
   - Propagate context for long-running async operations.
4. Add business-level audit logging.
   - Track critical create/update/delete actions.
   - Store who performed the action, what changed, and when.

### Phase 4 - Data Safety and Consistency

The goal is to prevent partial writes and make data flows more reliable.

1. Make transaction boundaries a standard pattern.
   - Review every create/update/delete flow that touches more than one write.
   - Ensure rollback works on every failure path.
2. Add idempotency keys for sensitive operations.
   - Focus on endpoints that can be retried by clients or gateways.
   - Store duplicate request results so business effects are not repeated.
3. Prepare event-processing patterns if async workflows are introduced.
   - Add a unique event ID.
   - Propagate `request_id` in message headers.
   - Keep consumers idempotent.

### Phase 5 - Testing and Release Readiness

The goal is to keep the project safe to release and maintain.

1. Add tests for production concerns.
   - Error mapping tests.
   - Validation failure tests.
   - Healthcheck tests.
   - Rate limit tests.
   - Idempotency tests, if the feature is added.
2. Add end-to-end tests for the main flows.
   - Login.
   - Refresh token.
   - Main CRUD flows.
   - RBAC allow/deny scenarios.
3. Polish deployment behavior.
   - Ensure startup logs clearly indicate readiness.
   - Ensure shutdown does not cut active requests abruptly.
   - Keep the configuration Docker- and CI/CD-friendly.

## Recommended Order

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5

Why:
- Phase 1 removes the biggest operational risks.
- Phase 2 stabilizes the API contract for consumers.
- Phase 3 improves diagnostics and abuse control.
- Phase 4 strengthens integrity and workflow reliability.
- Phase 5 keeps the changes sustainable over time.

## Current Repo Notes

- `src/common/http/response.interceptor.ts` provides the response envelope base.
- `src/config/env.schema.ts` validates env variables through schema.
- `src/auth/` provides JWT auth and refresh endpoints.
- `src/common/casl/` provides policy-based authorization.
- `src/employee/employee.service.ts` demonstrates the transaction pattern for a more complex write flow.
- `src/main.ts` now includes the operational bootstrap needed for production.

## Definition of Done

The implementation is considered complete when:
- high-priority checklist items move from `Todo` / `Partial` to `Done`,
- the bootstrap covers security, validation, logging, and readiness,
- success and error responses are consistent everywhere,
- healthcheck, Swagger, and release behavior are production-ready.
