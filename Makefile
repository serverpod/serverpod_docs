.PHONY: install start version format lint clean

# Default target
all: install

# Install dependencies
install:
	npm install

# Start development server
start:
	npm start

# Create a new version
version:
	@if [ "$(VERSION)" = "" ]; then \
		echo "Error: VERSION is required. Usage: make version VERSION=X.X.X"; \
		exit 1; \
	fi
	npm run docusaurus docs:version $(VERSION)

# Format markdown files
format:
	markdownlint './docs/**/*.md' --config markdownlint.yaml --fix

# Install markdownlint globally
install-linter:
	npm install -g markdownlint-cli

# Clean build artifacts
clean:
	rm -rf build
	rm -rf .docusaurus
	rm -rf node_modules

# Help command
help:
	@echo "Available commands:"
	@echo "  make install        - Install dependencies"
	@echo "  make start         - Start development server"
	@echo "  make version       - Create new version (requires VERSION=X.X.X)"
	@echo "  make format        - Format markdown files"
	@echo "  make install-linter - Install markdownlint globally"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make help          - Show this help message"
