# YouPi

**YouPi** is a personal activity management dashboard for organizing work, activities, routines, history, reports, and settings in one local account.

## Requirements

- Node.js 22.5+
- npm
- SQLite via `node:sqlite`

Project scripts now pin the repo's local Node runtime in `.tools/node/bin/node`, so `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run build` stay consistent even when the system `node` version differs.

## Run

Start with the launcher:

```bash
./launcher.sh
```

Alternative via npm:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run setup
```

The app runs at `http://127.0.0.1:3000`.

## Rebrand Notes

- Product name: `YouPi`
- Tagline: `You Plan It`
- Positioning: `Personal Activity Management Dashboard`
- Main focus: `Work`, `Activities`, `Routines`, `Schedule`, `Notes`, and `History`
- New logo source: `src/image2.png`
- Default UI language: `English`
- Language switcher: available in `Settings` with `English` and `Indonesia`
- Main screens, auth flows, shared task/activity lists, and report controls now follow the selected UI language.

## Login and Data

- The app uses single-user login.
- If no account exists yet, the app redirects to `/register` for first-time setup.
- After 3 consecutive failed login attempts from the same client/IP, login is locked with staged countdowns: `1 minute`, `5 minutes`, `10 minutes`, `30 minutes`, then `1 hour`.
- Account data, sessions, auth rate limits, login lockouts, work, activities, routines, notes, history, and settings are stored in SQLite.
- Default database path: `./data/activity.sqlite`.
- Optional override via `.env.local`:

```bash
SQLITE_PATH=./data/activity.sqlite
```

## Main Features

Shared field states now cover default, filled, focus, error, and disabled appearances across the main forms, filters, and auth fields.

- Single-user auth with register, login, logout, password change, and auth reset.
- YouPi dashboard with summary cards, charts, nearest deadlines, today agenda, quick mobile actions, and time/date rendering that is fixed to Asia/Jakarta (WIB).
- Schedule hub with Today, Week, Month, and Agenda views that combine Work, Activities, and Routines into one time-based page with consistent Indonesian/English copy, while routine occurrences never fall into `Missed` after their time window ends.
- Notes hub with personal and linked notes, pinned notes, search, category filters, quick drawer editing, and full-page editing for longer content.
- History hub with an automatic timeline of important created, updated, completed, missed, cancelled, deleted, pinned, and unpinned events.
- Work management with time-aware status, priority, matched quick `Selesai` and `Dibatalkan` actions, active-work sidebar badges with explanatory tooltips, optional start/end times, and planning forms that no longer expose cancelled as a creation option.
- The shared page header date/time widget now uses a richer card-style presentation, and overdue activity toasts step aside while the `Activities need attention` panel is open.
- Activities with date/category filters, overdue-action sidebar badges with explanatory tooltips, matched quick `Selesai` and `Dibatalkan` actions, overdue notifier actions for `Selesai` and `Dibatalkan`, and preference-based filtering.
- Routines for recurring weekly schedules.
- Reports with daily, weekly, and monthly views plus CSV, Excel, and PDF export that use Asia/Jakarta (WIB).
- Theme selection and UI language selection in Settings, with app time fixed to Asia/Jakarta (WIB).
- JSON backup export/import including persisted history records.
- A ready-to-import sample backup for a project manager's July 2026 month is available at `docs/sample-backup-project-manager-2026-07.json`.

## Reset Auth

Interactive reset:

```bash
./reset-auth.sh
```

Direct reset:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run auth:reset -- --username owner --password "PasswordBaru1"
```

## Logging

- All auth, user activity, system activity, security, and server error events now write to the terminal in realtime and to a single daily JSONL file at `logs/app-YYYY-MM-DD.log`.
- The app creates the `logs/` folder automatically and rotates to a new `app-YYYY-MM-DD.log` file when the Asia/Jakarta date changes.
- Old daily log files older than 30 days are removed automatically when the logger opens a new file.
- Sensitive fields such as `password`, `token`, `authorization`, and raw `cookie` values are redacted before logging.

View logs while running the app:

```bash
npm run dev
```

Follow today's log file:

```bash
tail -f logs/app-$(TZ=Asia/Jakarta date +%F).log
```

Search errors only:

```bash
grep '"category":"ERROR"' logs/app-$(TZ=Asia/Jakarta date +%F).log
```

Search failed logins:

```bash
grep 'auth.login_failed' logs/app-$(TZ=Asia/Jakarta date +%F).log
```

Search by request ID:

```bash
grep 'req_test_123' logs/app-$(TZ=Asia/Jakarta date +%F).log
```

Search a specific actor or entity:

```bash
grep '"actor_id":"user-1"' logs/app-$(TZ=Asia/Jakarta date +%F).log
grep 'payment.status_changed' logs/app-$(TZ=Asia/Jakarta date +%F).log
```

When deployed behind PM2 or Docker, the same realtime lines are also visible through:

```bash
pm2 logs
docker logs -f <container_name>
```

## Testing

TypeScript checks no longer depend on generated `.next/types` files from a prior build.


```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

## Deploy Docker

```bash
cd ~/waskuy
docker compose up -d --build
```

The app is expected to run behind a reverse proxy that forwards traffic to internal port `3000`.
Detailed VPS deployment steps are available in [docs/deploy-vps-container.md](docs/deploy-vps-container.md).

## Notes

- Root `/` redirects to `/dashboard`.
- New data starts empty.
- The reset button in `Settings` clears work, activities, routines, notes, and history, then restores default preferences while keeping system time fixed to `Asia/Jakarta`.
- The current menu guide is available in [docs/panduan-menu.md](docs/panduan-menu.md).
