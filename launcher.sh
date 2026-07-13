#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
HOST="${HOST:-127.0.0.1}"
MODE="${MODE:-start}"
export TZ="${TZ:-Asia/Jakarta}"

if [ -x "$ROOT_DIR/.tools/node/bin/npm" ]; then
  export PATH="$ROOT_DIR/.tools/node/bin:$PATH"
elif command -v npm >/dev/null 2>&1; then
  :
else
  echo "npm tidak ditemukan di proyek ini."
  echo "Jalankan instalasi Node.js lokal ke .tools/node sebelum membuka dashboard."
  exit 1
fi

"$ROOT_DIR/scripts/node.sh" -e "process.exit(0)"

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "node_modules belum ada. Menjalankan npm install..."
  npm install
elif [ ! -f "$ROOT_DIR/node_modules/.package-lock.json" ] || [ "$ROOT_DIR/package-lock.json" -nt "$ROOT_DIR/node_modules/.package-lock.json" ]; then
  echo "package-lock.json lebih baru dari marker npm. Menjalankan npm install..."
  npm install
fi

if [ "$MODE" = "dev" ]; then
  echo "Menjalankan dashboard dev di http://$HOST:$PORT"
  npm run dev -- --hostname "$HOST" --port "$PORT"
  exit 0
fi

if [ "$MODE" != "start" ]; then
  echo "MODE tidak valid: $MODE"
  echo "Gunakan MODE=start untuk server cepat atau MODE=dev untuk development."
  exit 1
fi

build_is_stale() {
  local build_id="$ROOT_DIR/.next/BUILD_ID"
  local standalone_server="$ROOT_DIR/.next/standalone/server.js"
  local standalone_static="$ROOT_DIR/.next/standalone/.next/static"

  if [ ! -f "$build_id" ] || [ ! -f "$standalone_server" ] || [ ! -d "$standalone_static" ]; then
    return 0
  fi

  local path
  for path in app components lib next.config.ts package.json package-lock.json tailwind.config.ts postcss.config.js tsconfig.json; do
    if [ -e "$ROOT_DIR/$path" ] && [ -n "$(find "$ROOT_DIR/$path" -type f -newer "$build_id" -print -quit)" ]; then
      return 0
    fi
  done

  return 1
}

DID_BUILD=false
if build_is_stale; then
  echo "Build produksi belum ada atau source berubah. Menjalankan npm run build..."
  npm run build
  DID_BUILD=true
fi

STANDALONE_SERVER="$ROOT_DIR/.next/standalone/server.js"
SOURCE_STATIC="$ROOT_DIR/.next/static"
STANDALONE_STATIC="$ROOT_DIR/.next/standalone/.next/static"

if [ ! -f "$STANDALONE_SERVER" ]; then
  echo "Server standalone tidak ditemukan setelah build." >&2
  exit 1
fi

if [ "$DID_BUILD" = true ] || [ ! -d "$STANDALONE_STATIC" ]; then
  if [ ! -d "$SOURCE_STATIC" ]; then
    echo "Aset statis produksi tidak ditemukan setelah build." >&2
    exit 1
  fi
  mkdir -p "$STANDALONE_STATIC"
  cp -R "$SOURCE_STATIC/." "$STANDALONE_STATIC/"
fi

echo "Menjalankan dashboard cepat di http://$HOST:$PORT"
HOSTNAME="$HOST" PORT="$PORT" npm run start
