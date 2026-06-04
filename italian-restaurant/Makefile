.PHONY: dev dev-server dev-client build build-server build-client test test-server test-client \
       lint lint-server lint-client typecheck typecheck-server typecheck-client \
       migrate migrate-up migrate-down seed docker-up docker-down docker-logs \
       db-reset db-seed clean install install-server install-client

# Variables
COMPOSE = docker-compose
NODE = node
NPM = npm
SERVER_DIR = server
CLIENT_DIR = client
MIGRATIONS_DIR = migrations

# ===========================================
# Development
# ===========================================

dev: dev-server dev-client

dev-server:
	cd $(SERVER_DIR) && $(NPM) run dev

dev-client:
	cd $(CLIENT_DIR) && $(NPM) run dev

# ===========================================
# Build
# ===========================================

build: build-server build-client

build-server:
	cd $(SERVER_DIR) && $(NPM) run build

build-client:
	cd $(CLIENT_DIR) && $(NPM) run build

# ===========================================
# Testing
# ===========================================

test: test-server test-client

test-server:
	cd $(SERVER_DIR) && $(NPM) run test

test-client:
	cd $(CLIENT_DIR) && $(NPM) run test

test-e2e:
	cd $(CLIENT_DIR) && $(NPM) run test:e2e

test-coverage:
	cd $(SERVER_DIR) && $(NPM) run test:coverage

# ===========================================
# Linting & Type Checking
# ===========================================

lint: lint-server lint-client

lint-server:
	cd $(SERVER_DIR) && $(NPM) run lint

lint-client:
	cd $(CLIENT_DIR) && $(NPM) run lint

typecheck: typecheck-server typecheck-client

typecheck-server:
	cd $(SERVER_DIR) && $(NPM) run typecheck

typecheck-client:
	cd $(CLIENT_DIR) && $(NPM) run typecheck

format:
	cd $(SERVER_DIR) && $(NPM) run format
	cd $(CLIENT_DIR) && $(NPM) run format

# ===========================================
# Database Migrations
# ===========================================

migrate: migrate-up

migrate-up:
	cd $(SERVER_DIR) && $(NPM) run db:migrate

migrate-down:
	cd $(SERVER_DIR) && $(NPM) run db:migrate:down

migrate-reset:
	cd $(SERVER_DIR) && $(NPM) run db:migrate:reset

db-seed:
	cd $(SERVER_DIR) && $(NPM) run db:seed

# ===========================================
# Docker
# ===========================================

docker-up:
	$(COMPOSE) up -d

docker-down:
	$(COMPOSE) down

docker-build:
	$(COMPOSE) build

docker-rebuild:
	$(COMPOSE) build --no-cache

docker-logs:
	$(COMPOSE) logs -f

docker-logs-server:
	$(COMPOSE) logs -f server

docker-logs-client:
	$(COMPOSE) logs -f client

docker-ps:
	$(COMPOSE) ps

# ===========================================
# Database via Docker
# ===========================================

db-connect-psql:
	docker exec -it italian-postgres psql -U postgres -d italian_restaurant

db-connect-mysql:
	docker exec -it italian-mysql mysql -u root -proot italian_restaurant

# ===========================================
# Installation
# ===========================================

install: install-server install-client

install-server:
	cd $(SERVER_DIR) && $(NPM) install

install-client:
	cd $(CLIENT_DIR) && $(NPM) install

# ===========================================
# Cleanup
# ===========================================

clean:
	rm -rf $(SERVER_DIR)/node_modules
	rm -rf $(CLIENT_DIR)/node_modules
	rm -rf $(SERVER_DIR)/dist
	rm -rf $(CLIENT_DIR)/dist
	rm -rf $(SERVER_DIR)/coverage
	rm -rf $(CLIENT_DIR)/coverage

clean-docker:
	$(COMPOSE) down -v --rmi all

# ===========================================
# Utilities
# ===========================================

generate:
	cd $(SERVER_DIR) && $(NPM) run db:generate

studio:
	cd $(SERVER_DIR) && $(NPM) run db:studio

health:
	@echo "Checking server health..."
	@curl -s http://localhost:3001/health || echo "Server is not running"

.PHONY: help
help:
	@echo "Italian Restaurant MVP - Available Commands:"
	@echo ""
	@echo "  make dev             - Start both server and client in dev mode"
	@echo "  make dev-server      - Start server in dev mode"
	@echo "  make dev-client      - Start client in dev mode"
	@echo "  make build           - Build both server and client"
	@echo "  make test            - Run all tests"
	@echo "  make lint            - Lint both projects"
	@echo "  make typecheck       - Type check both projects"
	@echo "  make migrate         - Run database migrations"
	@echo "  make db-seed         - Seed the database"
	@echo "  make docker-up       - Start Docker containers"
	@echo "  make docker-down     - Stop Docker containers"
	@echo "  make install         - Install all dependencies"
	@echo "  make clean           - Remove node_modules and build artifacts"
	@echo "  make help            - Show this help message"
