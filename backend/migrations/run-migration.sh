#!/bin/bash

# Run database migrations
# Usage: ./run-migration.sh [migration_file.sql]
#
# If no file is specified, runs all .sql files in order
#
# Requires DATABASE_URL environment variable to be set
# Example: DATABASE_URL=postgresql://user:pass@localhost:5432/control_tower

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Example: export DATABASE_URL=postgresql://user:pass@localhost:5432/control_tower"
  exit 1
fi

run_migration() {
  local file=$1
  echo "Running migration: $file"
  psql "$DATABASE_URL" -f "$file"
  echo "✓ Completed: $file"
  echo ""
}

if [ -n "$1" ]; then
  # Run specific migration file
  run_migration "$SCRIPT_DIR/$1"
else
  # Run all migrations in order
  echo "Running all migrations..."
  echo ""
  for file in "$SCRIPT_DIR"/*.sql; do
    if [ -f "$file" ]; then
      run_migration "$file"
    fi
  done
  echo "All migrations completed successfully!"
fi
