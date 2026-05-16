# Nest TypeORM RBAC Starter

Production-oriented NestJS starter for an RBAC-based API with TypeORM, Zod validation, structured logging, request tracing, rate limiting, idempotency support, and SQL Server integration.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=flat&logo=typeorm&logoColor=white)
[![Microsoft SQL Server](https://custom-icon-badges.demolab.com/badge/Microsoft%20SQL%20Server-CC2927?logo=mssqlserver-white&logoColor=white)](#)

## Overview

This project is a backend starter for a role-based access control system. It is designed to be a practical foundation for internal applications, admin panels, and CRUD-heavy business APIs.

The API is versioned under `/v1`, uses a consistent response envelope, and exposes common production concerns such as:

- JWT authentication with refresh token support
- RBAC authorization with CASL
- Zod-based request validation
- global error handling
- request ID correlation
- structured logging
- rate limiting
- request timeout handling
- transactional write flows
- audit logging
- health and readiness checks

## Tech Stack

- NestJS 11
- TypeScript
- TypeORM 0.3
- SQL Server / MSSQL
- Zod
- CASL
- Passport JWT
- Winston
- Helmet
- RxJS
- Jest and Supertest
- Docker Compose for local database setup

## Features

- API versioning with URI versioning at `/v1`
- Auth endpoints for login, refresh token, and current user profile
- Role, permission, department, position, user, and employee modules
- RBAC checks with per-route policy guards
- Zod validation for body, query, and path parameters
- Reusable response envelope
- Global exception mapping with consistent error codes
- Request ID middleware and request context storage
- Structured JSON logging with correlation data
- Global rate limiting plus controller-level and endpoint-level overrides
- Request timeout middleware
- Idempotency support for write requests
- Transaction helper for write consistency
- Audit trail for critical business actions
- Health and readiness endpoints
- Automated test coverage for core runtime behavior

## Screenshots

Add product screenshots here when the API is running in a browser tool or admin client.

Suggested screenshots:

- API docs or request flow
- Login success response
- Example protected resource response
- Health check response

Recommended location:

- `docs/screenshots/`

## Architecture

The codebase is organized by concern:

- `src/main.ts` bootstraps security middleware, versioning, interceptors, and filters
- `src/config/` contains environment validation and typed app config
- `src/common/` contains reusable platform features such as:
  - HTTP response envelope and exception mapping
  - context propagation
  - structured logging
  - rate limiting
  - idempotency
  - transaction handling
  - validation helpers
- `src/auth/` contains login, refresh, and JWT guards
- `src/department/`, `src/position/`, `src/user/`, `src/employee/`, and `src/role/` contain business modules
- `src/database/` contains the TypeORM data source and database wiring
- `src/health/` contains readiness and health endpoints

High-level flow:

1. The request enters global middleware for request ID and timeout handling.
2. Global interceptors apply logging, rate limiting, idempotency, and response wrapping.
3. Guards enforce authentication and RBAC policies.
4. Controllers validate input with Zod schemas.
5. Services handle business logic and persist changes through TypeORM.
6. Filters map errors into a stable API error format.

## Installation

### 1. Install dependencies

```bash
pnpm install
```

If you prefer npm, install with:

```bash
npm install
```

### 2. Prepare the database

The repository includes `docker-compose.yml` for local SQL Server.

```bash
docker compose up -d
```

### 3. Run migrations or seed data

Useful scripts:

```bash
pnpm run migration:run
pnpm run seed
```

### 4. Start the app

```bash
pnpm run start:dev
```

Production build:

```bash
pnpm run build
pnpm run start:prod
```

## Environment Setup

Create a `.env` file from `.env.example` and fill the required values.

Minimal required variables:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=1435
DB_USERNAME=sa
DB_PASSWORD=Password1@
DB_DATABASE=nest_typeorm_rbac
DATABASE_URL=sqlserver://sa:password@localhost:1433;database=nest_typeorm_rbac;encrypt=true;trustServerCertificate=true
CLIENT_URL=http://localhost:3001
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=1m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_SECRET=your-cookie-secret
CORS_ORIGINS=http://localhost:3000,http://localhost:4200
```

Optional operational variables:

```env
CORS_CREDENTIALS=true
RATE_GLOBAL_TTL=900
RATE_GLOBAL_LIMIT=100
RATE_LOGIN_TTL=600
RATE_LOGIN_LIMIT=10
REQUEST_ID_HEADER=x-request-id
REQUEST_TIMEOUT_MS=30000
ENABLE_SWAGGER=false
```

Notes:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `COOKIE_SECRET` should be strong values in production.
- The app validates environment variables at startup, so missing or invalid values will fail fast.
- `ENABLE_SWAGGER` is available as a config flag for future or optional OpenAPI wiring.

## Useful Scripts

```bash
pnpm run build
pnpm run start:dev
pnpm run test
pnpm run test:e2e
pnpm run test:cov
pnpm run lint
```

## API Notes

- Base path: `/v1`
- Health: `/v1/health`
- Readiness: `/v1/ready`
- Auth: `/v1/auth`
- Departments: `/v1/departments`
- Positions: `/v1/positions`
- Users: `/v1/users`
- Employees: `/v1/employees`
- Roles: `/v1/roles`

## License

MIT
