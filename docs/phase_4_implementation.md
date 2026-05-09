# Phase 4 Implementation

This document summarizes phase 4 work focused on data safety and consistency.

## What Was Done

### 1. Transaction boundaries were standardized

Files:
- `src/common/transactions/transaction.service.ts`
- `src/common/transactions/transaction.module.ts`
- `src/department/department.service.ts`
- `src/position/position.service.ts`
- `src/user/user.service.ts`
- `src/role/services/role.service.ts`
- `src/role/repositories/role.repository.ts`

What changed:
- A reusable `TransactionService` was added on top of TypeORM transactions.
- Main write paths now run inside explicit transactional callbacks.
- Role permission updates now run inside the same transaction as the delete/insert sequence.

Why it matters:
- Prevents partial writes when an operation spans multiple database changes.
- Makes rollback behavior explicit and easier to reason about.
- Keeps write flows consistent across modules.

### 2. Idempotency support was added

Files:
- `src/common/idempotency/idempotency.service.ts`
- `src/common/idempotency/idempotency.interceptor.ts`
- `src/common/idempotency/idempotency.module.ts`
- `src/main.ts`

What changed:
- A global idempotency interceptor now checks for the `Idempotency-Key` header on mutating requests.
- Duplicate requests with the same method, path, key, and body hash return the cached response.

Why it matters:
- Reduces duplicate business effects when clients or gateways retry requests.
- Helps protect sensitive write endpoints from accidental replays.

## Tips and Tricks

1. Use `TransactionService.run()` for any new write flow that performs more than one database action.
2. Use `Idempotency-Key` only on endpoints where replay protection is needed.
3. Keep the request body stable for idempotent calls, because the cache key includes a body hash.
4. If the app eventually runs in multiple instances, move the idempotency store to a shared backend like Redis.
5. For complex workflows, keep the transaction scope as small as possible to reduce lock time.

## Notes

Phase 4 does not include async/event processing yet.
That part is still reserved for a future phase if the application starts using queues or message brokers.

