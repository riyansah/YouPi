# YouPi REST API

YouPi uses the same single-user session cookie as the web UI. Agents should log in first, store the cookie jar, and send that cookie on every request.

## Auth

Login and store the cookie:

```bash
curl -c cookie.jar -X POST http://127.0.0.1:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"owner","password":"Password1"}'
```

Use the cookie for API calls:

```bash
curl -b cookie.jar http://127.0.0.1:3000/api/tasks
```

A missing or invalid session returns `401 {"error":"Unauthorized"}`.

## Resource CRUD

Use `PATCH` for small changes and read the resource again after mutations when exact current state matters. Do not write to history directly.

### Tasks

`GET /api/tasks` lists work items. `GET /api/tasks/{id}` reads one item.

```bash
curl -b cookie.jar -X POST http://127.0.0.1:3000/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Review proposal","description":"Check scope and risks","status":"Berjalan","priority":"Tinggi","startDate":"2026-07-08","deadline":"2026-07-10","startTime":null,"endTime":null,"completedAt":null}'
```

`PATCH /api/tasks/{id}` accepts task fields such as `title`, `description`, `status`, `priority`, dates, times, and `completedAt`. `DELETE /api/tasks/{id}` removes the task and unlinks related notes.

### Activities

`GET /api/activities` lists activities. `GET /api/activities/{id}` reads one item.

```bash
curl -b cookie.jar -X POST http://127.0.0.1:3000/api/activities \
  -H 'Content-Type: application/json' \
  -d '{"title":"Daily review","category":"Kerja","date":"2026-07-08","startTime":"16:00","endTime":"16:30","status":"Direncanakan","notes":"Close open loops"}'
```

`PATCH /api/activities/{id}` accepts activity fields. `DELETE /api/activities/{id}` removes the activity and unlinks related notes.

### Routines

`GET /api/routines` lists routines. `GET /api/routines/{id}` reads one item.

```bash
curl -b cookie.jar -X POST http://127.0.0.1:3000/api/routines \
  -H 'Content-Type: application/json' \
  -d '{"title":"Morning planning","days":["Senin","Selasa","Rabu"],"startTime":"08:00","endTime":"08:30","priority":"Sedang","notes":"Pick top three priorities"}'
```

`PATCH /api/routines/{id}` accepts routine fields. `DELETE /api/routines/{id}` removes the routine and unlinks related notes.

### Notes

`GET /api/notes` supports `q`, `category`, `linkedType`, `linkedId`, and `pinned=true` filters. `GET /api/notes/{id}` reads one note.

```bash
curl -b cookie.jar -X POST http://127.0.0.1:3000/api/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"Decision note","content":"Use PATCH for small agent updates.","category":"work","linkedType":"work","linkedId":"task-123","tags":["api"],"isPinned":false}'
```

`PATCH /api/notes/{id}` accepts note fields. `DELETE /api/notes/{id}` removes the note.

### Settings

`GET /api/settings` returns dashboard preferences. `PATCH /api/settings` accepts `dashboardName`, `theme`, `preferredCategories`, `language`, and `timeZone`.

```bash
curl -b cookie.jar -X PATCH http://127.0.0.1:3000/api/settings \
  -H 'Content-Type: application/json' \
  -d '{"language":"id","theme":"Sistem"}'
```

## Read-Only Menus

- `GET /api/dashboard`: dashboard summaries, agenda, and chart series.
- `GET /api/schedule?view=today|week|month|agenda&anchorDate=YYYY-MM-DD&source=all|work|activity|routine&status=all|upcoming|done|missed`: schedule items and summary.
- `GET /api/reports?selectedDate=YYYY-MM-DD&period=Harian|Mingguan|Bulanan`: report export model.
- `GET /api/history` and `GET /api/history/{id}`: audit history. History is read-only.

## Data Management

Export backup JSON:

```bash
curl -b cookie.jar http://127.0.0.1:3000/api/backup > youpi-backup.json
```

Restore a validated backup:

```bash
curl -b cookie.jar -X PUT http://127.0.0.1:3000/api/backup \
  -H 'Content-Type: application/json' \
  --data-binary @youpi-backup.json
```

Reset dashboard data and settings:

```bash
curl -b cookie.jar -X POST http://127.0.0.1:3000/api/dashboard/reset
```

## Status Codes

- `200`: request succeeded.
- `201`: resource created.
- `400`: invalid payload or validation failure.
- `401`: missing or invalid session.
- `404`: resource not found.
- `429`: login lockout.
