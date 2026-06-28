# Changelog


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
