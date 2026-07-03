#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

USERNAME="${USERNAME:-}"
PASSWORD="${PASSWORD:-}"

if [ -x "$ROOT_DIR/.tools/node/bin/npm" ]; then
  export PATH="$ROOT_DIR/.tools/node/bin:$PATH"
elif command -v npm >/dev/null 2>&1; then
  :
else
  echo "npm tidak ditemukan di proyek ini."
  echo "Jalankan instalasi Node.js lokal ke .tools/node sebelum reset auth."
  exit 1
fi

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "node_modules belum ada. Menjalankan npm install..."
  npm install
elif [ ! -f "$ROOT_DIR/node_modules/.package-lock.json" ] || [ "$ROOT_DIR/package-lock.json" -nt "$ROOT_DIR/node_modules/.package-lock.json" ]; then
  echo "package-lock.json lebih baru dari marker npm. Menjalankan npm install..."
  npm install
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --username)
      USERNAME="${2:-}"
      shift 2
      ;;
    --password)
      PASSWORD="${2:-}"
      shift 2
      ;;
    *)
      echo "Argumen tidak dikenal: $1"
      echo "Gunakan: ./reset-auth.sh [--username <username>] [--password <password>]"
      exit 1
      ;;
  esac
done

if [ -z "$USERNAME" ]; then
  read -r -p "Username baru: " USERNAME
fi

if [ -z "$PASSWORD" ]; then
  read -r -s -p "Password baru: " PASSWORD
  echo
  read -r -s -p "Ulangi password baru: " PASSWORD_CONFIRM
  echo

  if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
    echo "Konfirmasi password tidak sama."
    exit 1
  fi
fi

echo "Menjalankan reset auth untuk user $USERNAME..."
npm run auth:reset -- --username "$USERNAME" --password "$PASSWORD"
