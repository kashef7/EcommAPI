##!/bin/bash
# Creates a new EF Core migration.
#
# Usage (from the solution root, in Git Bash):
#   ./scripts/add-migration.sh <MigrationName>
# Example:
#   ./scripts/add-migration.sh AddProduct
#
# Review the generated files in Ecomm.Infrastructure/Persistence/Migrations
# before applying them with ./scripts/update-db.sh

set -e
cd "$(dirname "$0")/.."

if [ -z "$1" ]; then
  echo "Error: migration name is required."
  echo "Usage: ./scripts/add-migration.sh <MigrationName>"
  exit 1
fi

dotnet ef migrations add "$1" \
  --project Ecomm.Infrastructure \
  --startup-project Ecomm.API \
  --output-dir Persistence/Migrations