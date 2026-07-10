#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REQUIRED_NODE_VERSION="22.5.0"

if [ -x "$ROOT_DIR/.tools/node/bin/node" ]; then
  NODE_BIN="$ROOT_DIR/.tools/node/bin/node"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  echo "Node.js tidak ditemukan. Install Node.js $REQUIRED_NODE_VERSION+ atau sediakan runtime lokal di .tools/node." >&2
  exit 1
fi

if ! "$NODE_BIN" - "$REQUIRED_NODE_VERSION" <<'NODE_VERSION_CHECK'
const required = process.argv[2].split(".").map(Number);
const current = process.versions.node.split(".").map(Number);
const isSupported = current[0] > required[0]
  || (current[0] === required[0] && current[1] > required[1])
  || (current[0] === required[0] && current[1] === required[1] && current[2] >= required[2]);

if (!isSupported) {
  console.error(`Node.js ${required.join(".")}+ dibutuhkan. Versi aktif: ${process.versions.node}.`);
  process.exit(1);
}
NODE_VERSION_CHECK
then
  exit 1
fi

if "$NODE_BIN" -e "require('node:sqlite')" >/dev/null 2>&1; then
  :
elif "$NODE_BIN" --no-warnings --experimental-sqlite -e "require('node:sqlite')" >/dev/null 2>&1; then
  case " ${NODE_OPTIONS:-} " in
    *" --experimental-sqlite "*) ;;
    *) export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--experimental-sqlite" ;;
  esac
else
  echo "Node.js runtime harus menyediakan node:sqlite. Gunakan Node.js 22.5.0+ dengan dukungan SQLite." >&2
  exit 1
fi

exec "$NODE_BIN" "$@"
