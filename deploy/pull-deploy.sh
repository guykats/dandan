#!/usr/bin/env bash
# Manual fallback deploy. Normal deploys are triggered by CI calling
# /deploy-webhook; run this by hand only when the webhook is unavailable
# (e.g. the very first deploy, before the webhook route exists on the server).
set -euo pipefail
export PATH="/opt/alt/php83/usr/bin:$PATH"

APP_DIR="$HOME/domains/dandan.guykats.com/app"
cd "$APP_DIR"

git fetch origin deploy --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/deploy)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "Already up to date ($LOCAL)"
    exit 0
fi

echo "$(date -Is) deploying $REMOTE"

php artisan down --render="errors::503" --retry=30 || true
trap 'php artisan up || true' EXIT

git reset --hard origin/deploy
composer install --no-dev --optimize-autoloader --no-interaction
php artisan config:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "$(date -Is) deployed $REMOTE"
