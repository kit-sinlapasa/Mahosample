#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/mahosample}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

cd deploy/hostinger

if [ ! -f .env.production ]; then
  echo "Missing deploy/hostinger/.env.production"
  echo "Copy .env.production.example to .env.production and set real secrets first."
  exit 1
fi

docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
docker compose --env-file .env.production -f docker-compose.prod.yml ps
