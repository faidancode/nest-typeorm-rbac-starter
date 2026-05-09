# Phase 2 Implementation

This document summarizes phase 2 work focused on contract consistency and validation hardening.

## What Was Done

### 1. API versioning was enabled

File:
- `src/main.ts`

Added:
- URI versioning with a default version of `1`.

Why it matters:
- Keeps future breaking changes isolated under a new version.
- Makes release and documentation management easier.

### 2. Zod validation was standardized

Files:
- `src/common/pipes/zod-validation.pipe.ts`
- `src/common/schemas/common.schemas.ts`
- `src/auth/schemas/auth.schemas.ts`

Added:
- Reusable `ZodValidationPipe`.
- Shared `UuidSchema`.
- Explicit auth schemas for login and refresh requests.

Why it matters:
- Removes repetitive `Schema.parse(...)` calls.
- Makes validation behavior consistent across controllers.

### 3. Main controllers were refactored to use Zod pipes

Files:
- `src/auth/controllers/auth.controller.ts`
- `src/department/department.controller.ts`
- `src/position/position.controller.ts`
- `src/user/user.controller.ts`
- `src/employee/employee.controller.ts`
- `src/role/controllers/role.controller.ts`

Added:
- Body, query, and path validation now use the reusable Zod pipe.
- UUID path parameters now use `UuidSchema`.

Why it matters:
- Keeps controllers thin.
- Standardizes input validation and error behavior.

## Tips and Tricks

1. Use `ZodValidationPipe` for new body and query inputs.
2. Use `UuidSchema` for UUID path parameters.
3. Keep new endpoints under the same version unless the contract breaks.
4. Update Swagger docs later to reflect `/v1`.

## Notes

Phase 2 currently focuses on versioning and validation.
Swagger/OpenAPI and refresh-token hardening are still separate follow-up tasks.

