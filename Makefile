# DGM Library - Makefile shortcuts

.PHONY: up down logs shell-be shell-db migrate seed

## Khởi động toàn bộ hệ thống
up:
	docker compose up -d

## Dừng tất cả containers
down:
	docker compose down

## Xem logs (backend)
logs:
	docker compose logs -f backend

## Logs tất cả services
logs-all:
	docker compose logs -f

## Vào shell backend container
shell-be:
	docker compose exec backend sh

## Vào psql
shell-db:
	docker compose exec postgres psql -U dgm_user -d dgm_library

## Chạy migration
migrate:
	docker compose exec backend npm run migration:run

## Generate migration mới
# make migration name=CreateUserTable
migration:
	docker compose exec backend npm run migration:generate -- src/migrations/$(name)

## Revert migration cuối
migrate-revert:
	docker compose exec backend npm run migration:revert

## Rebuild backend image
rebuild-be:
	docker compose build backend && docker compose up -d backend

## Reset toàn bộ DB (cẩn thận!)
reset-db:
	docker compose down -v
	docker compose up -d postgres
	@echo "Waiting for postgres..."
	sleep 5
	docker compose up -d

## Cài npm packages cho backend
be-install:
	docker compose exec backend npm install $(pkg)

## Format + lint
lint:
	docker compose exec backend npm run lint
