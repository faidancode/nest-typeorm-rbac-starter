# Include .env
include .env

# Docker Commands
up:
	docker-compose up -d

down:
	docker-compose down -v

logs:
	docker-compose logs -f mssql

# Wait until MSSQL healthy
# Perhatikan nama database : nest_rbac_mssql_db
wait-db:
	@echo "Waiting for MSSQL to be ready..."
	@powershell -Command "while ((docker inspect --format='{{.State.Health.Status}}' nest_rbac_mssql_db) -ne 'healthy') { Start-Sleep -Seconds 3 }"

# Create Database (pakai mssql-tools container)
# Perhatikan nama --network dan nama -S database
create-db:
	MSYS_NO_PATHCONV=1 docker run --rm \
		--network nest-typeorm-rbac-starter_app_net \
		mcr.microsoft.com/mssql-tools \
		/opt/mssql-tools/bin/sqlcmd \
		-S nest_rbac_mssql_db -U $(DB_USERNAME) -P $(DB_DOCKER_PASSWORD) \
		-Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$(DB_DATABASE)') CREATE DATABASE [$(DB_DATABASE)]"



# Run all pending migrations
migrate-up:
	pnpm migration:run

# Rollback last migration
migrate-down:
	pnpm migration:revert

# Create empty migration file (usage: make migrate-create name=AddUserTable)
migrate-create:
	pnpm migration:create $(MIGRATION_DIR)/$(name)

# Generate migration based on entity changes (usage: make migrate-gen name=AddIsActive)
migrate-gen:
	pnpm migration:generate $(MIGRATION_DIR)/$(name)

# RESET DATABASE: Drop all tables and rerun all migrations
migrate-reset:
	pnpm schema:drop
	pnpm migration:run

# Refresh database schema (Sync without migrations - useful for local dev)
db-sync:
	pnpm schema:sync

.PHONY: migrate-up migrate-down migrate-create migrate-gen migrate-reset db-sync


# Clean start
reset-db:
	docker-compose down -v
	docker-compose up -d
	@make wait-db
	@make create-db
	@make migrate

# Initial setup
setup:
	@make up
	@make wait-db
	@make create-db
	@make migrate
	@echo "✅ MSSQL ready & migrations applied!"

dev:
	pnpm start:dev