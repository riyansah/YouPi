<img width="1445" height="487" alt="image" src="https://github.com/user-attachments/assets/410faec8-9aaa-4249-836c-282f6a77cef4" />

# YouPi

YouPi is a single-user personal activity dashboard for managing work, activities, routines, schedules, notes, history, reports, and settings in one local web app.

The app stores data in SQLite, protects the dashboard behind login, keeps only the latest user session active, automatically logs out inactive sessions after 15 minutes, and uses `Asia/Jakarta (WIB)` for app time, reports, history, and logs.

The interface uses a calm slate-teal visual system with a focus-first Dashboard, grouped desktop navigation, a compact mobile bottom navigation, skeleton loading, and contextual empty states.

## Requirements

- Node.js 22.5+
- npm
- SQLite support through `node:sqlite`

The project scripts use `scripts/node.sh`, which prefers the repo-local Node runtime at `.tools/node/bin/node` when available and otherwise requires Node.js 22.5+ from `PATH`. The launcher builds and starts the standalone production bundle while keeping development output from replacing its runtime files.

## Quick Start

Run the launcher:

```bash
./launcher.sh
```

The app opens at:

```text
http://127.0.0.1:3000
```

On first run, create the local account from `/register`. After that, use `/login`.

For development:

```bash
npm install
npm run dev
```

Use `MODE=dev ./launcher.sh` if you want the launcher to perform the local runtime and dependency checks first. `HOST` and `PORT` can override the launcher's default `127.0.0.1:3000`.

## Main Menus

- `Dashboard`: focus-first hero with quick actions and the nearest deadline, mobile-friendly summary cards, today's activity and routine totals, equal-size chart cards, and today's agenda.
- `Work`: mobile-compact tasks, projects, priorities, status, deadlines, and optional start/end times.
- `Activities`: one-time activities with date, category, status, filters, and overdue actions.
- `Routines`: recurring weekly routines.
- `Schedule`: mobile-friendly Today, Week, Month, and Agenda views across work, activities, and routines.
- `Notes`: personal notes and notes linked to work, activities, or routines.
- `History`: automatic timeline of important item changes.
- `Reports`: daily, weekly, monthly, and custom date-range reports with compact mobile controls, larger mobile-safe pie/donut charts with compact legends, blank reference-date handling, plus CSV, Excel, and PDF export.
- `Settings`: dashboard name, language, theme, previewed backup/restore with automatic safety downloads, separate data reset, and password change.

The detailed menu guide is in [docs/panduan-menu.md](docs/panduan-menu.md).

## Data and Backup

- Default database path: `./data/activity.sqlite`.
- Optional override in `.env.local`:

```bash
SQLITE_PATH=./data/activity.sqlite
# Only enable behind a trusted reverse proxy that overwrites client IP headers.
TRUST_PROXY_HEADERS=false
```

Settings can export and restore JSON backups. Restore previews and validates backup versions 1-6 up to 25 MB, then downloads a safety copy of the current data before replacing it. A sample backup is available at [docs/sample-backup-project-manager-2026-07.json](docs/sample-backup-project-manager-2026-07.json).


## REST API

Authenticated REST endpoints are available for Work, Activities, Routines, Notes, Settings, read-only Dashboard/Schedule/Reports/History data, backup restore/export, and dashboard reset. Agents should log in through `POST /api/auth/login` and reuse the session cookie.

See [docs/api.md](docs/api.md) and [docs/openapi.json](docs/openapi.json).

Public login and registration JSON requests require a JSON content type and enforce an 8 KiB request-size limit. The test suite also checks that implemented API routes, OpenAPI operations, and release versions stay synchronized.

## Reset Auth

Interactive reset:

```bash
./reset-auth.sh
```

Direct reset:

```bash
npm run auth:reset -- --username owner --password "PasswordBaru1"
```

## Validation

Run the main checks before committing:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

`test:e2e` starts the built standalone server with an isolated temporary database and exercises registration, login cookies, middleware redirects, task CRUD, backup restore, logout, server-rendered pages, and standalone static assets over HTTP.

## Deployment

The app is built for Docker/Next.js deployment behind a reverse proxy that forwards traffic to internal port `3000`. The production image runs as a non-root user and keeps SQLite data on a writable persistent volume.

Detailed VPS deployment steps are in [docs/deploy-vps-container.md](docs/deploy-vps-container.md).
