# Changelog

## 0.7.49 - 2026-07-08

- Expanded the shared header server clock to show weekday, full date, and 24-hour time in one line, and softened its light/dark contrast so the panel sits more naturally beside the rest of the UI.

## 0.7.48 - 2026-07-08

- Refreshed shared dark-theme state styling across fields, chips, cards, quick actions, toasts, and confirmation surfaces, switched the server clock to a single-line presentation, and widened the header/sidebar brand lockups so `YouPi` and `You Plan It` stay fully readable.

## 0.7.46 - 2026-07-08

- Slimmed down the mobile page-header server clock into a dedicated compact layout instead of reusing the desktop card, and increased dark-theme contrast so the clock panel, icon, and text remain clearer on dark backgrounds.

## 0.7.45 - 2026-07-08

- Fixed dashboard and shared work countdown badges so `Deadline` and `Starts in` now follow the language selected in `Settings`, instead of staying partially in Indonesian after switching to English.

## 0.7.44 - 2026-07-07

- Forced the entire app onto `Asia/Jakarta` by removing the Settings timezone selector, normalizing imported settings/backups to `Asia/Jakarta`, and updating Settings copy to make the fixed WIB behavior explicit.
- Switched new task, activity, routine, note, auth, backup, report, history, and logger timestamps to explicit Jakarta-offset values, fixed history/report grouping to derive dates from timestamps instead of string slicing, and rotated daily logs by Jakarta date.
- Exported `TZ=Asia/Jakarta` through repo scripts, the launcher, Docker runtime, and updated README/menu docs so runtime behavior, log commands, and product documentation all match WIB.

## 0.7.43 - 2026-07-07

- Changed the overdue Activities notification flow so `View` hides the toast while the action panel is open and only shows it again after the panel is closed if user action is still needed, and redesigned the shared header date/time card to a richer, more polished visual style.

## 0.7.42 - 2026-07-07

- Added a timezone selector in `Settings`, normalized backups/settings to persist it, and switched app-wide date/time calculations, badges, schedules, history, reports, and page headers to follow the selected timezone with `Asia/Jakarta` as the default.

## 0.7.41 - 2026-07-07

- Matched the quick `Selesai` and `Dibatalkan` actions across Work and Activities, added sidebar badges for running Work and overdue Activities, changed Schedule so past Routine occurrences resolve as done instead of missed, and added tooltip-driven semantic badge colors in the sidebar.

## 0.7.40 - 2026-07-07

- Polished the dashboard shell and planning flows around the new schedule-aware experience, including tighter navigation continuity, countdown-driven work visibility, and supporting documentation updates for the expanded main menus.

## 0.7.39 - 2026-07-07

- Added `docs/sample-backup-project-manager-2026-07.json`, a ready-to-import example backup covering one month of realistic project manager work, activities, routines, and history for `2026-07-01` through `2026-07-31`.

## 0.7.38 - 2026-07-07

- Added a centralized realtime server logger with request IDs, sensitive-data redaction, daily JSONL log rotation in `logs/app-YYYY-MM-DD.log`, and 30-day retention while keeping terminal, PM2, and Docker log output unified.
- Logged auth flows, dashboard reset/replace actions, note unlink actions, history-backed CRUD/status activity, CLI auth resets, and global API errors through the shared logger without adding any log UI or admin route.

## 0.7.37 - 2026-07-07

- Fixed the `History` sidebar label, finished the remaining `Schedule` Indonesian copy, and standardized shared input states across dashboard forms, filters, notes, settings, and auth fields.
- Removed `Dibatalkan` from Work and Activities planning form options while keeping cancelled items available in list-level status controls, and added `Dibatalkan` handling to the overdue `Activities need attention` panel.

## 0.7.36 - 2026-07-07

- Hardened the new Notes and History flows by syncing full-page note edits with the latest store data, translating shared note validation messages consistently, and preventing History detail from crashing on legacy or non-JSON metadata.
- Pinned `npm` validation scripts to the repo's local Node runtime and added a dedicated typecheck config so test, lint, typecheck, and build behave consistently without relying on prebuilt `.next/types` files.

## 0.7.35 - 2026-07-07

- Fixed auth lockout validation so the staged lockout test now matches the real unlock boundary after the final cooldown window.
- Removed the `npm run typecheck` dependency on generated `.next/types` artifacts so type checking works before a build runs.

## 0.7.34 - 2026-07-06

- Added a new `History` menu with a date-grouped timeline, search and filters, linked-item drawer details, and persisted records for important Work, Activities, Routines, and Notes events.
- Stored history in SQLite through shared backend event generation, added `cancelled` activity support, and included history in backup/reset flows.

## 0.7.33 - 2026-07-06

- Added a new `Notes` menu with personal and linked notes, search and category filters, pinned state, quick drawer editing, and a full-page editor for longer note content.
- Connected notes to Work, Activities, and Routines through linked note panels, unlink-on-delete behavior, and backup/reset support across the dashboard data model.

## 0.7.32 - 2026-07-06

- Added a new `Schedule` menu with today, week, month, and agenda views that aggregate Work, Activities, and Routines into one timeline with source/status filters and summary cards.
- Introduced shared schedule utilities, route labels, and tests so the new page reuses existing task, activity, and routine data without changing their edit flows.

## 0.7.31 - 2026-07-06

- Localized the main app pages, auth screens, shared task/activity UI, and report controls so the existing language switcher now affects visible content across the product.
- Switched report PDF mode values and exported filenames to stable English identifiers while keeping stored task, activity, routine, status, and category values backward compatible.

## 0.7.30 - 2026-07-06

- Rebranded the app to `YouPi` with the `You Plan It` identity across metadata, login, icons, PDF footer, README, and menu docs.
- Added a persisted `English | Indonesia` language switcher in `Settings` with `English` as the default for new settings.
- Switched the app shell and navigation to the new `src/image2.png` logo, regenerated browser icon assets, and normalized stored settings/backups to include the new language preference.

## 0.7.29 - 2026-07-05

- Added `docs/deploy-vps-container.md`, a step-by-step VPS deployment guide covering Docker Compose, domain setup, HTTPS with Caddy, updates, backups, and troubleshooting.

## 0.7.28 - 2026-07-05

- Added staged login lockouts that trigger after every 3 failed attempts per client/IP with 1 minute, 5 minute, 10 minute, 30 minute, and 1 hour cooldowns plus a blocking countdown on the login page.

## 0.7.27 - 2026-07-04

- Added a mobile global speed-dial FAB for quick add actions that routes to inline compose forms on tasks, activities, and routines while staying above active snackbars.

## 0.7.26 - 2026-07-04

- Centered the dashboard weekly progress legend, removed dashboard agenda complete actions for activities, and added the uploaded brand icon plus a larger clickable mobile header brand area to match the sidebar.

## 0.7.25 And Earlier - 2026-07-04

- Started the project as a personal activity dashboard with local work and activity management, dashboard summaries, filtering, persistence, and the first reusable pagination, storage, and utility layers.
- Added the first major dashboard navigation expansion with nearest-deadline visibility, richer task tables, settings/task/activity pages, menu guidance docs, and the groundwork for the later report and settings flows.
- Introduced recurring routines and today-agenda style scheduling on top of the original dashboard so work, activities, and routines could be managed together before the later Schedule, Notes, and History modules arrived.
- Added local database-backed authentication, login/register/change-password flows, middleware protection, auth reset tooling, and the first API-backed dashboard data sync so the app could move from a local-only dashboard into a protected single-user system.
- Expanded reports, auth UX, feedback surfaces, containers/runtime assets, and export foundations before the later versioned changelog entries began tracking smaller release steps in more detail.
