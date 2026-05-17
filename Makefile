# Include .env
include .env

MIGRATION_DIR=src/migrations
DB_CONTAINER=nest_starter_db
APP_CONTAINER=nest_rbac_api_starter

up:
	docker compose up -d --build

up-db:
	docker compose up -d mssql

down:
	docker compose down

destroy:
	docker compose down -v

restart:
	docker compose down
	docker compose up -d --build

build:
	docker compose build

logs:
	docker logs -f $(APP_CONTAINER)

logs-db:
	docker logs -f $(DB_CONTAINER)

wait-db:
	@echo "Waiting for MSSQL to be ready..."
	@powershell -Command "while ((docker inspect --format='{{.State.Health.Status}}' $(DB_CONTAINER)) -ne 'healthy') { Start-Sleep -Seconds 3 }"

create-db:
	MSYS_NO_PATHCONV=1 docker run --rm \
		mcr.microsoft.com/mssql-tools \
		/opt/mssql-tools/bin/sqlcmd \
		-S host.docker.internal,1433 \
		-U $(DB_USERNAME) \
		-P "$(DB_DOCKER_PASSWORD)" \
		-Q "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '$(DB_DATABASE)') CREATE DATABASE [$(DB_DATABASE)]"

migrate-up:
	pnpm migration:run

migrate-down:
	pnpm migration:revert

migrate-create:
	pnpm migration:create $(MIGRATION_DIR)/$(name)

migrate-gen:
	pnpm migration:generate $(MIGRATION_DIR)/$(name)

migrate-reset:
	pnpm schema:drop
	pnpm migration:run

db-sync:
	pnpm schema:sync

setup:
	@make up
	@make wait-db
	@make create-db
	@make migrate-up
	@echo "MSSQL ready and migrations applied!"

reset-db:
	@make create-db
	@make migrate-reset

dev:
	pnpm start:dev

prod:
	docker compose up -d --build

app-shell:
	docker exec -it $(APP_CONTAINER) sh

.PHONY: up up-db down destroy restart build logs logs-db wait-db create-db migrate-up migrate-down migrate-create migrate-gen migrate-reset db-sync setup reset-db dev prod app-shell
