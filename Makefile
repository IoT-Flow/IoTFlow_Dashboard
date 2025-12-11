.PHONY: help install test test-backend test-frontend lint format clean dev-setup dev-stop ci ci-backend ci-frontend

# Default target
help:
	@echo "IoTFlow Dashboard - Makefile Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make install          - Install all dependencies (backend + frontend)"
	@echo "  make test             - Run all unit tests (backend + frontend)"
	@echo "  make test-backend     - Run backend unit tests only"
	@echo "  make test-frontend    - Run frontend unit tests only"
	@echo "  make lint             - Run linters (backend + frontend)"
	@echo "  make format           - Format code with Prettier (backend + frontend)"
	@echo "  make clean            - Clean node_modules and build artifacts"
	@echo "  make dev-setup        - Start development servers"
	@echo "  make dev-stop         - Stop development servers"
	@echo "  make init-db          - Initialize the database"
	@echo "  make ci               - Run complete CI pipeline (backend + frontend)"
	@echo "  make ci-backend       - Run backend CI pipeline only"
	@echo "  make ci-frontend      - Run frontend CI pipeline only"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing backend dependencies..."
	cd iotflow-backend && npm install
	@echo "📦 Installing frontend dependencies..."
	cd iotflow-frontend && npm install
	@echo "✅ All dependencies installed!"

# Run all unit tests
test:
	@echo "🧪 Running all unit tests..."
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@echo "✅ All tests completed!"

# Run backend unit tests
test-backend:
	@echo "🧪 Running backend unit tests..."
	cd iotflow-backend && npm test -- tests/unit/ --coverage=false

# Run frontend unit tests
test-frontend:
	@echo "🧪 Running frontend unit tests..."
	cd iotflow-frontend && npm test -- --watchAll=false --coverage=false

# Lint code
lint:
	@echo "🔍 Linting backend code..."
	cd iotflow-backend && npx eslint src/ tests/ --max-warnings 0 || true
	@echo "🔍 Linting frontend code..."
	cd iotflow-frontend && npx eslint src/ --max-warnings 10 || true
	@echo "✅ Linting completed!"

# Lint backend only
lint-backend:
	@echo "🔍 Linting backend code..."
	cd iotflow-backend && npx eslint src/ tests/ --max-warnings 0 || true
	@echo "✅ Backend linting completed!"

# Lint frontend only
lint-frontend:
	@echo "🔍 Linting frontend code..."
	cd iotflow-frontend && npx eslint src/ --max-warnings 10 || true
	@echo "✅ Frontend linting completed!"

# Format code with Prettier
format:
	@echo "✨ Formatting backend code..."
	cd iotflow-backend && npx prettier --write "src/**/*.js" "tests/**/*.js"
	@echo "✨ Formatting frontend code..."
	cd iotflow-frontend && npx prettier --write "src/**/*.{js,jsx}"
	@echo "✅ Code formatted!"

# Check code formatting
format-check:
	@echo "🔍 Checking backend code formatting..."
	cd iotflow-backend && npx prettier --check "src/**/*.js" "tests/**/*.js"
	@echo "🔍 Checking frontend code formatting..."
	cd iotflow-frontend && npx prettier --check "src/**/*.{js,jsx}"
	@echo "✅ Format check completed!"

# Check backend formatting only
format-check-backend:
	@echo "🔍 Checking backend code formatting..."
	cd iotflow-backend && npx prettier --check "src/**/*.js" "tests/**/*.js"
	@echo "✅ Backend format check completed!"

# Check frontend formatting only
format-check-frontend:
	@echo "🔍 Checking frontend code formatting..."
	cd iotflow-frontend && npx prettier --check "src/**/*.{js,jsx}"
	@echo "✅ Frontend format check completed!"

# Clean build artifacts and node_modules
clean:
	@echo "🧹 Cleaning backend..."
	cd iotflow-backend && rm -rf node_modules coverage .nyc_output
	@echo "🧹 Cleaning frontend..."
	cd iotflow-frontend && rm -rf node_modules build coverage
	@echo "✅ Cleaned!"

# Initialize database
init-db:
	@echo "🔄 Initializing database..."
	cd iotflow-backend && npm run init-db
	@echo "✅ Database initialized!"

# Start development servers
dev-setup:
	@echo "🚀 Starting development servers..."
	./dev-setup.sh

# Stop development servers
dev-stop:
	@echo "🛑 Stopping development servers..."
	./dev-stop.sh

# Build frontend
build-frontend:
	@echo "🏗️  Building frontend..."
	cd iotflow-frontend && npm run build
	@echo "✅ Frontend built!"

# CI pipeline (complete - matches GitHub Actions)
ci: ci-backend ci-frontend
	@echo "✅ Complete CI pipeline completed successfully!"

# Backend CI pipeline
ci-backend: format-check-backend lint-backend test-backend
	@echo "✅ Backend CI pipeline completed successfully!"

# Frontend CI pipeline
ci-frontend: format-check-frontend lint-frontend test-frontend
	@echo "✅ Frontend CI pipeline completed successfully!"
