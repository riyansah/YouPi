# Changelog

## 0.7.58 - 2026-07-12

- Widened the dashboard and report work/activity chart legends on mobile and added a compact legend to the report activities-per-day chart.

## 0.7.57 - 2026-07-12

- Enlarged dashboard and report pie/donut charts and compacted their legends so the chart area has stronger visual weight.

## 0.7.56 - 2026-07-12

- Removed the Reports most frequent activity summary card, made blank reference dates render a safe empty report, and kept dashboard/report pie charts from clipping on mobile.

## 0.7.55 - 2026-07-11

- Removed preferred activity categories from Settings, the Activities preference filter, and the Settings API schema.

## 0.7.54 - 2026-07-11

- Compact dashboard chart spacing on mobile, fixed the duplicated Reports mobile chart toggle, and added custom date-range filtering across report summaries, charts, API, and exports.

## 0.7.53 - 2026-07-11

- Added Notes to the mobile quick-action menu, compacted key mobile menus with collapsible forms/filters and denser cards, and added strict 15-minute idle logout across browser and server sessions.

## 0.7.52 - 2026-07-11

- Changed the dashboard summary cards to a two-column layout on mobile and let the completion-rate card span the full row so the main dashboard requires less vertical scrolling.

## 0.7.51 - 2026-07-08

- Added session-authenticated REST CRUD APIs for Work, Activities, Routines, Notes, and Settings, plus read-only Dashboard, Schedule, Reports, and History endpoints.
- Moved the app data provider and Settings backup/reset flows off the old batch `/api/dashboard-data` route and removed that public route.
- Added Hermes-facing API usage docs and an OpenAPI schema for resource, history, schedule, report, backup, and reset operations.

## 0.7.50 - 2026-07-08

- Rebuilt the changelog so it lists every recorded project version from the initial repository history through the current release.
- Rewrote the README with only essential setup, usage, validation, data, and deployment information for new users.
- Refreshed the menu guide so every current YouPi sidebar menu is explained consistently.
- Removed internal or unused public repository files: `AGENTS.md`, `Plan Schedule.md`, `docs/Identitas.md`, and `src/image1.png`.

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

## 0.7.22 - 2026-07-03

- Fixed the activity preference category filter so `Preferensi` only shows selected categories and explains the active preference filter in the Activities menu.

## 0.7.21 - 2026-07-03

- Limited the report activity category chart to the top four categories, added Excel-compatible report export, and expanded CSV export into a detailed filter-aware report.

## 0.7.20 - 2026-07-03

- Added PDF export for reports with summary and full-data modes that follow the active report filters and include KPI metrics, charts, insights, and detail tables.

## 0.7.19 - 2026-07-03

- Updated `docs/panduan-menu.md` so the menu guide matches the current dashboard, tasks, routines, reports, and settings behavior.

## 0.7.18 - 2026-07-03

- Simplified `README.md` to keep only the essential setup, auth reset, deploy, and verification instructions.

## 0.7.17 - 2026-07-03

- Fixed the sidebar brand so both `Personal` and `Activity Hub` open the dashboard without duplicating the app name.
- Improved dark-mode card hover contrast on dashboard and report summary cards.
- Added optional start/end times plus a quick-complete action for tasks, and made task deadline countdowns follow the task end time when provided.
- Updated report filters so all report cards and charts follow the active daily, weekly, or monthly period, renamed the activity-per-day chart to `Kegiatan`, added a permanent category legend, and renamed weekly progress to `Progress Pekerjaan`.

## 0.7.16 - 2026-07-03

- Made `Personal Activity Hub` in the mobile header and sidebar brand open the dashboard directly.
- Fixed dark-mode highlight contrast for selected navigation, agenda labels, and task/activity/routine status chips.
- Added success toast notifications when tasks, activities, and routines are created or marked complete.
- Replaced browser confirms with in-app confirmation popups for deleting tasks, activities, and routines, plus reset data and logout actions.

## 0.7.15 - 2026-07-03

- Added `./reset-auth.sh` as a launcher-style wrapper that prepares local npm dependencies and prompts for the single-user auth reset interactively.

## 0.7.14 - 2026-07-03

- Added an `npm run auth:reset -- --username <username> --password <password>` admin command to reset the single local user and password while invalidating all active sessions.

## 0.7.13 - 2026-07-03

- Added client-side login validation and changed auth feedback to show helper text first, expand into full checklists on focus/typing, then collapse to summary states after valid blur.
- Changed password validation rules and auth placeholders to use 8-64 characters, 1 uppercase letter, 1 number, no spaces, `Buat password`, and `Ulangi password`.

## 0.7.12 - 2026-07-03

- Added username/password prefix icons, placeholders, password visibility toggle on login, and Caps Lock warnings across login, register, and change-password forms.
- Changed register and change-password live validation to checklist-style status feedback with valid and invalid indicators.

## 0.7.11 - 2026-07-03

- Added a custom Activity Dashboard favicon and app icon.

## 0.7.10 - 2026-07-03

- Fixed Docker reverse-proxy auth checks by using an internal app origin for middleware status requests.
- Changed Docker production image to use Next.js standalone output.

## 0.7.9 - 2026-07-03

- Added Docker image support for production deployment behind the existing Waskuy nginx reverse proxy.

## 0.7.8 - 2026-07-03

- Fixed login page Register navigation by allowing unauthenticated access to `/register`.

## 0.7.7 - 2026-07-03

- Changed the login page to always show the register link.

## 0.7.6 - 2026-07-03

- Added a register link on the login page when no account has been created yet.

## 0.7.5 - 2026-07-03

- Fixed the register page login link by allowing `/login` before the first account is registered.

## 0.7.4 - 2026-07-03

- Added live register validation, password visibility toggles, password strength feedback, and a login link.
- Changed first-run register success to show a 5-second countdown before redirecting to login.
- Added a dedicated change-password page from Settings with backend password validation and update support.

## 0.7.3 - 2026-07-03

- Added first-run register backed by SQLite auth storage.
- Added database-backed rate limits for register and login attempts.
- Changed login/session configuration to use generated database secrets instead of required `.env` credentials.
- Added middleware redirects for register, login, authenticated pages, and protected API endpoints.

## 0.7.2 - 2026-07-03

- Added automated coverage for SQLite dashboard persistence across tasks, activities, routines, and settings.

## 0.7.1 - 2026-07-03

- Added `.env.example` with safe placeholders for private login and SQLite configuration.
- Documented copying `.env.example` to `.env.local` before running the app.

## 0.7.0 - 2026-07-03

- Added single-user login with signed HTTP-only sessions for protected dashboard access.
- Moved dashboard persistence from browser localStorage to server-side SQLite storage.
- Added authenticated dashboard data API routes and logout support.
- Changed reset behavior to keep the SQLite database empty after clearing personal data.

## 0.6.0 - 2026-07-03

- Made theme selection apply light, dark, and system display modes.
- Connected preferred activity categories to the default activity filter.
- Removed unused local account fields from settings and new backups.
- Changed data reset to clear local tasks, activities, and routines instead of restoring sample data.

## 0.5.5 - 2026-07-03

- Changed the task status chart to a donut chart with a centered total and permanent status legend.

## 0.5.4 - 2026-07-03

- Added clickable dashboard summary cards that open filtered task and activity views.
- Added always-visible labels to the task status chart.
- Replaced the dashboard activity-per-day chart with a kegiatan-per-day chart combining activities and scheduled routines.

## 0.5.3 - 2026-07-02

- Replaced the time dropdowns with a custom analog clock picker using hour-then-minute selection and 5-minute minute choices.

## 0.5.2 - 2026-07-02

- Replaced start and end time inputs on activities and routines with fast 15-minute `HH:mm` dropdown choices.

## 0.5.1 - 2026-07-02

- Changed the launcher to use a cached production build by default for faster local dashboard startup.
- Added `MODE=dev` launcher support for development hot reload and moved the root redirect into Next.js config.

## 0.5.0 - 2026-06-25

- Added a new `Rutinitas` menu with local CRUD for weekly routines and backup support.
- Replaced the dashboard activity panel with `Kegiatan Hari Ini`, combining unfinished activities and active routines with highlighted type labels and dashboard completion checkboxes for activities.

## 0.4.7 - 2026-06-25

- Aligned dashboard deadline dates and countdown badges on the same row with the countdown right-aligned.
- Added hover highlight states to task rows and daily activity cards for consistency with the dashboard.

## 0.4.6 - 2026-06-25

- Replaced the large deadline countdown cards with a compact `DD:HH:MM:SS` format for active tasks.
- Updated overdue countdowns to compact adaptive labels such as `Terlambat 05 Menit`, `Terlambat 03 Jam`, and `Terlambat 02 Hari 04 Jam`.

## 0.4.5 - 2026-06-25

- Redesigned active deadline countdowns to emphasize the numeric value and apply green, amber, and red urgency states.
- Kept live deadline countdowns on the dashboard and task list while preserving hydration-safe loading behavior.

## 0.4.4 - 2026-06-25

- Fixed hydration mismatch on deadline countdowns by delaying live countdown rendering until the dashboard and task list mount in the browser.

## 0.4.3 - 2026-06-25

- Added clickable dashboard task and activity items that open the matching pages and focus the selected item.
- Replaced the dashboard task panel with nearest active deadlines and added detailed deadline countdowns.

## 0.4.2 - 2026-06-25

- Added an end-user menu guide covering the dashboard, each sidebar menu, and the recommended usage flow.

## 0.4.1 - 2026-06-25

- Added independent pagination controls to the dashboard task and today-activity panels to reduce scrolling.

## 0.4.0 - 2026-06-25

- Added paginated task and activity lists with page range controls.
- Added pagination utility coverage to the Node test suite.

## 0.3.0 - 2026-06-24

- Added ESLint configuration, lint script, and CI validation workflow.
- Added JSON backup export/import and local data reset controls in settings.
- Added confirmation prompts before deleting tasks and activities.
- Added backup parsing and route smoke coverage to the existing Node test suite.

## 0.2.2 - 2026-06-23

- Added Git ignore rules for generated files, dependencies, local toolchain binaries, logs, and environment files.
- Added a `prepare:commit` script to run tests, type-checking, and production build before committing.
- Documented the pre-commit validation flow.

## 0.2.1 - 2026-06-23

- Expanded default seed data to 8 tasks and 20 daily activities.
- Updated dashboard utility tests for the larger seed dataset.

## 0.2.0 - 2026-06-23

- Centralized local dashboard data access in a shared provider and hook.
- Added task and activity form validation with inline error messages.
- Added TypeScript tests for dashboard summaries, report filtering, CSV export, and form validation.

## 0.1.2 - 2026-06-23

- Added project-local Node.js/npm under `.tools/node` so the dashboard does not depend on tools from another repo.
- Updated `launcher.sh` to prefer the project-local npm and remove the `/tmp` fallback.

## 0.1.1 - 2026-06-23

- Added `launcher.sh` to install dependencies when needed and run the Next.js development server.
- Documented launcher usage.

## 0.1.0 - 2026-06-23

- Initial personal activity dashboard MVP with Next.js, TypeScript, Tailwind CSS, local state persistence, charts, reports, and settings.
