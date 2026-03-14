#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${1:-/srv/apps/clientops}"

cd "$APP_DIR"
git pull --ff-only
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma db push

