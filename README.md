# Personal Activity Dashboard

Dashboard pribadi untuk mengelola pekerjaan, aktivitas, rutinitas, laporan, dan pengaturan dalam satu akun lokal.

## Kebutuhan

- Node.js 22.5+
- npm
- SQLite via `node:sqlite`

## Menjalankan

Jalankan launcher:

```bash
./launcher.sh
```

Alternatif via npm:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run setup
```

Aplikasi berjalan di `http://127.0.0.1:3000`.

## Login dan Data

- Aplikasi memakai single-user login.
- Jika belum ada akun, aplikasi otomatis mengarahkan ke `/register` untuk membuat akun pertama.
- Data akun, sesi, rate limit auth, pekerjaan, aktivitas, rutinitas, dan pengaturan disimpan di SQLite.
- Lokasi default database: `./data/activity.sqlite`.
- Opsional atur lokasi database lewat `.env.local`:

```bash
SQLITE_PATH=./data/activity.sqlite
```

## Fitur Utama

- Login, register, logout, ubah password, dan reset auth.
- Dashboard dengan ringkasan pekerjaan, agenda hari ini, dan grafik.
- Pekerjaan dengan status, prioritas, quick action `Selesai`, dan jam mulai/selesai opsional.
- Aktivitas harian dengan filter kategori preferensi dan rutinitas mingguan.
- Laporan dengan filter `Harian`, `Mingguan`, dan `Bulanan`, export CSV detail, export Excel, dan export PDF informatif.
- Backup JSON export/import.
- Tema `Terang`, `Gelap`, dan `Sistem`.

## Reset Auth

Reset interaktif:

```bash
./reset-auth.sh
```

Reset langsung:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run auth:reset -- --username owner --password "PasswordBaru1"
```

Reset auth mengganti username dan password akun lokal, menghapus rate limit auth, dan memaksa semua sesi login lama menjadi tidak berlaku.

## Testing

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run test
PATH="$PWD/.tools/node/bin:$PATH" npm run lint
PATH="$PWD/.tools/node/bin:$PATH" npm run typecheck
PATH="$PWD/.tools/node/bin:$PATH" npm run build
```

## Deploy Docker

Deploy dari direktori host yang memakai `docker compose`:

```bash
cd ~/waskuy
docker compose up -d --build
```

Aplikasi diharapkan berjalan di balik reverse proxy yang meneruskan trafik ke service ini pada port internal `3000`.

## Catatan

- Root `/` mengarah ke `/dashboard`.
- Data baru dimulai kosong.
- Tombol reset data di Pengaturan mengosongkan pekerjaan, aktivitas, dan rutinitas lalu mengembalikan preferensi ke default.
- Panduan menu pengguna tersedia di [docs/panduan-menu.md](docs/panduan-menu.md) dan sudah disesuaikan dengan perilaku menu terbaru, termasuk rutinitas, quick action pekerjaan, serta filter laporan.
