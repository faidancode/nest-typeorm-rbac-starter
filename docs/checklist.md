This checklist is used as a guide for building a REST API that is
**secure, consistent, easy to debug, and production-ready**
without overengineering.

---

## 1. API Design & Contract

- [ ] Consistent response format (success & error)
- [ ] Clear separation between HTTP status & business error code
- [ ] Backward compatible changes (additive, no breaking rename)
- [ ] Versioning strategy (`/v1`, header, etc)

---

## 2. Authentication & Authorization

- [ ] Authentication (JWT / session / token based)
- [ ] Role-based authorization (RBAC)
- [ ] Token expiration handling
- [ ] Refresh token mechanism
- [ ] Secure cookie / header usage (HttpOnly, Secure)

---

## 3. Request Tracing & Safety

- [ ] Request-ID generated at edge (middleware)
- [ ] Request-ID propagated through context, logs, and async events
- [ ] Idempotency-Key for sensitive POST operations
- [ ] Idempotent handling on duplicate requests

---

## 4. Input Validation

- [ ] Validation for request body
- [ ] Validation for query parameters
- [ ] Validation for path parameters
- [ ] Enum and boundary validation (status, qty, limit, etc)
- [ ] Reject invalid input early (before service logic)

---

## 5. Pagination, Filtering, Sorting

- [ ] Pagination (`page` / `limit` or cursor-based)
- [ ] Filtering by common fields
- [ ] Sorting (`sort_by`, `order`)
- [ ] Pagination metadata in response

---

## 6. Error Handling

- [ ] Centralized error mapping
- [ ] No internal error leakage to client
- [ ] Meaningful business error codes
- [ ] Consistent error response structure

---

## 7. Logging & Observability

- [ ] Structured logging (JSON / key-value)
- [ ] Log levels (INFO, WARN, ERROR)
- [ ] Logs include request_id and user_id
- [ ] Errors logged with sufficient context

---

## 8. Transaction & Data Consistency

- [ ] Database transaction for write operations
- [ ] Clear transaction boundaries
- [ ] Rollback on failure
- [ ] No partial write on error

---

## 9. Async / Kafka / Event Processing

- [ ] Event contains unique event ID
- [ ] Request-ID propagated in message headers
- [ ] Idempotent consumer handling
- [ ] Safe retry and replay handling
- [ ] No duplicate business effect on re-consume

---

## 10. Rate Limiting & Abuse Protection

- [ ] Rate limit per IP
- [ ] Rate limit per authenticated user
- [ ] Protection for sensitive endpoints (login, checkout)

---

## 11. Timeout & Context Propagation

- [ ] HTTP request has timeout
- [ ] Context propagated to service and repository
- [ ] Database queries respect context
- [ ] Async operations respect cancellation

---

## 12. Audit Log (Business Level)

- [ ] Audit log for critical actions
- [ ] Who performed the action
- [ ] What action was performed
- [ ] Timestamp recorded
- [ ] Before / after state (optional)

---

## 13. Configuration & Secrets

- [ ] Configuration via environment variables
- [ ] Required config validated on startup
- [ ] No hardcoded secrets
- [ ] Fail fast on missing critical config

---

## 14. Healthcheck & Readiness

- [ ] `/health` endpoint
- [ ] `/ready` endpoint
- [ ] Database connectivity check
- [ ] Optional: cache / broker readiness

---

## 15. Documentation

- [ ] API documentation (Swagger / OpenAPI)
- [ ] Request and response examples
- [ ] Error code list
- [ ] Authentication instructions

---

## 16. Testing Strategy

- [ ] Unit test for service layer
- [ ] Handler/controller test (success & failure)
- [ ] Authentication & authorization test
- [ ] Idempotency test
- [ ] Async / consumer test (if applicable)

---

## 17. Deployment Readiness

- [ ] Graceful shutdown
- [ ] Proper port and env handling
- [ ] Docker-friendly configuration
- [ ] Startup logs clearly indicate readiness

---
