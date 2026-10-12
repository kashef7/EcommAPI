##!/bin/bash
# Applies all pending EF Core migrations to the database.
#
# Usage (from the solution root, in Git Bash):
#   ./scripts/update-db.sh
#
# The connection string comes from your .env file.

set -e
cd "$(dirname "$0")/.."

dotnet ef database update \
  --project Ecomm.Infrastructure \
  --startup-project Ecomm.API