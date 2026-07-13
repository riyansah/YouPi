<img width="1353" height="1033" alt="image" src="https://github.com/user-attachments/assets/a32d356a-b933-41f8-a65f-689e0a8526c0" />
<h1 align="center">YouPi</h1>

<p align="center">
  <strong>You Plan It.</strong><br />
  A focused, self-hosted workspace for planning work and keeping daily activity visible.
</p>

YouPi is a single-user personal activity dashboard that brings work, activities, routines, schedules, notes, history, and reports into one responsive web app.

## Highlights

- **Focus-first Dashboard** — see the next deadline, quick actions, daily agenda, progress summaries, and productivity charts at a glance.
- **One planning workspace** — manage work, one-time activities, recurring routines, and a unified schedule.
- **Useful records** — connect notes to planned items, review change history, and export daily, weekly, monthly, or custom reports.
- **Responsive experience** — use grouped desktop navigation or compact mobile navigation with Indonesian and English language options plus light and dark themes.
- **Private by default** — keep data in local SQLite storage behind a single-user login, one active session, a 15-minute idle timeout, and JSON backup and restore.

## Quick Start

### Requirements

- Node.js 22.5 or newer
- npm
- SQLite support through `node:sqlite`

### Run YouPi

```bash
./launcher.sh
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). On first run, create the local account at `/register`, then continue through `/login`.

## Development

```bash
npm install
npm run dev
```

Run the complete local validation suite before committing:

```bash
npm run prepare:commit
```

## Data and Backup

- The default database is `./data/activity.sqlite`.
- Dates, reports, history, and logs use `Asia/Jakarta (WIB)`.
- JSON backups can be exported and restored from **Settings**.
- Optional local configuration is documented in [`.env.example`](.env.example).

## Account Recovery

Reset the local account interactively when needed:

```bash
./reset-auth.sh
```

## Documentation

- [Menu and feature guide](docs/panduan-menu.md)
- [REST API guide](docs/api.md)
- [OpenAPI specification](docs/openapi.json)
- [VPS and Docker deployment](docs/deploy-vps-container.md)
