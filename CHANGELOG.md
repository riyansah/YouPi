# Changelog

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
