<img width="1445" height="487" alt="image" src="https://github.com/user-attachments/assets/410faec8-9aaa-4249-836c-282f6a77cef4" />

# YouPi

YouPi is a single-user personal activity dashboard for managing work, activities, routines, schedules, notes, history, reports, and settings in one local web app.

The app stores data in SQLite, protects the dashboard behind login, and uses `Asia/Jakarta (WIB)` for app time, reports, history, and logs.

## Requirements

- Node.js 22.5+
- npm
- SQLite support through `node:sqlite`

The project scripts use `scripts/node.sh`, which prefers the repo-local Node runtime at `.tools/node/bin/node` when available and otherwise requires Node.js 22.5+ from `PATH`.

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

## Main Menus

- `Dashboard`: summary cards, charts, nearest deadlines, and today's agenda.
- `Work`: tasks, projects, priorities, status, deadlines, and optional start/end times.
- `Activities`: one-time activities with date, category, status, filters, and overdue actions.
- `Routines`: recurring weekly routines.
- `Schedule`: Today, Week, Month, and Agenda views across work, activities, and routines.
- `Notes`: personal notes and notes linked to work, activities, or routines.
- `History`: automatic timeline of important item changes.
- `Reports`: daily, weekly, and monthly reports with CSV, Excel, and PDF export.
- `Settings`: dashboard name, language, theme, preferred categories, backup/import, reset, and password change.

The detailed menu guide is in [docs/panduan-menu.md](docs/panduan-menu.md).

## Data and Backup

- Default database path: `./data/activity.sqlite`.
- Optional override in `.env.local`:

```bash
SQLITE_PATH=./data/activity.sqlite
# Only enable behind a trusted reverse proxy that overwrites client IP headers.
TRUST_PROXY_HEADERS=false
```

Settings can export and import JSON backups. A sample backup is available at [docs/sample-backup-project-manager-2026-07.json](docs/sample-backup-project-manager-2026-07.json).


## REST API

Authenticated REST endpoints are available for Work, Activities, Routines, Notes, Settings, read-only Dashboard/Schedule/Reports/History data, backup restore/export, and dashboard reset. Agents should log in through `POST /api/auth/login` and reuse the session cookie.

See [docs/api.md](docs/api.md) and [docs/openapi.json](docs/openapi.json).

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
```

## Deployment

The app is built for Docker/Next.js deployment behind a reverse proxy that forwards traffic to internal port `3000`.

Detailed VPS deployment steps are in [docs/deploy-vps-container.md](docs/deploy-vps-container.md).
