#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -f "$ROOT_DIR/data/minerva.db" ]; then
  echo "Seeding database..."
  (cd "$ROOT_DIR" && python3 scripts/seed_stocks.py)
fi

(
  cd "$ROOT_DIR/backend"
  uvicorn main:app --reload --port 8000
) &

if command -v npm >/dev/null 2>&1; then
  (
    cd "$ROOT_DIR/frontend"
    npm run dev
  ) &
else
  echo "npm is not installed; backend started only."
fi

wait
