# Personal Activity Dashboard

Dashboard pribadi untuk mengelola pekerjaan, aktivitas harian, grafik progress, dan laporan produktivitas.

## Stack

- Next.js
- Node.js 22.5+ (`node:sqlite`)
- TypeScript
- Tailwind CSS
- Recharts
- SQLite server-side untuk data pribadi
- Login satu akun dengan session cookie bertanda tangan
- ESLint

## Konfigurasi Login

Aplikasi tidak lagi membutuhkan `APP_USERNAME`, `APP_PASSWORD_HASH`, atau `SESSION_SECRET` di `.env`. Jalankan aplikasi, lalu jika database belum memiliki akun, middleware otomatis menampilkan halaman `/register` untuk membuat user pertama. Username harus 3-20 karakter dan hanya memakai huruf kecil serta angka. Password harus 8-64 karakter, boleh huruf, angka, dan simbol tanpa spasi, serta wajib memiliki minimal 1 huruf besar dan 1 angka. Username, password hash `scrypt`, session secret acak, dan rate limit auth tersimpan di SQLite.

`SQLITE_PATH` tetap opsional; default-nya `./data/activity.sqlite`. Folder `data/` diabaikan Git agar database pribadi tidak ikut commit. Jika ingin mengubah lokasi database, buat `.env.local` berisi:

```bash
SQLITE_PATH=./data/activity.sqlite
```

## Menjalankan

```bash
./launcher.sh
```

Atau jalankan script setup yang sama melalui npm:

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run setup
```

Launcher memakai Node/npm lokal dari `.tools/node`, menjalankan `npm install` jika `node_modules` belum ada atau `package-lock.json` lebih baru, lalu menjalankan server produksi lokal di `http://127.0.0.1:3000`. Saat pertama kali berjalan, aplikasi menampilkan halaman register jika database belum memiliki akun; link masuk tetap dapat membuka halaman login, halaman login menampilkan link register yang membuka `/register`, dan register sukses mengarahkan ke halaman login setelah akun dibuat. Setelah login, seluruh data dibaca dan disimpan ke SQLite server-side. Jika build produksi belum ada atau source berubah, launcher menjalankan `npm run build` terlebih dahulu; setelah itu pembukaan berikutnya memakai hasil build agar dashboard lebih cepat terbuka. Semua kebutuhan runtime proyek disimpan di repo ini. Halaman `/` akan diarahkan ke `/dashboard`.

Database baru dimulai kosong. Tombol reset di halaman Pengaturan mengosongkan pekerjaan, aktivitas, dan rutinitas, lalu mengembalikan preferensi ke default.

Halaman Pengaturan menyediakan tema terang/gelap/sistem, preferensi kategori aktivitas, halaman khusus ubah password, serta export/import backup JSON untuk data pekerjaan, aktivitas, rutinitas, dan preferensi pribadi. Import backup akan memvalidasi struktur file sebelum mengganti data SQLite.

Daftar pekerjaan dan aktivitas harian memakai paginasi 10 item per halaman setelah filter diterapkan. Menu Aktivitas memakai filter kategori `Preferensi` secara default berdasarkan kategori yang dipilih di Pengaturan. Card ringkasan di dashboard bisa diklik untuk membuka menu terkait dengan filter otomatis, seperti status pekerjaan atau aktivitas tanggal hari ini.
Pilihan jam mulai dan selesai pada aktivitas harian serta rutinitas memakai picker jam analog dengan alur pilih jam lalu menit, dan menit tersedia dalam interval 5 menit.
Dashboard menampilkan grafik status pekerjaan berbentuk donut dengan total di tengah dan legend permanen, serta grafik `Kegiatan Per Hari` yang menggabungkan aktivitas dengan rutinitas terjadwal dalam 7 hari terakhir. Dashboard menampilkan panel `Deadline Terdekat` dan `Kegiatan Hari Ini` dengan paginasi 4 item per halaman. Item di kedua panel bisa diklik untuk membuka halaman terkait dan langsung memfokuskan item yang dipilih. Panel kegiatan menggabungkan aktivitas hari ini yang belum selesai dengan rutinitas yang aktif pada hari dan jam saat ini, serta menampilkan label ter-highlight `Aktivitas` atau `Rutinitas`. Aktivitas yang waktunya lewat tetapi belum diceklis tetap tampil sampai ditandai selesai, sedangkan rutinitas otomatis hilang setelah jamnya lewat. Pada panel deadline, tanggal deadline dan countdown compact `DD:HH:MM:SS` berada pada baris yang sama dengan countdown rata kanan. Warna countdown tetap hijau saat sisa waktu lebih dari 3 hari, oranye saat kurang dari 3 hari, dan merah saat kurang dari 1 hari atau sudah lewat deadline. Jika deadline terlewat, tampilannya berubah ke label ringkas seperti `Terlambat 05 Menit`, `Terlambat 03 Jam`, atau `Terlambat 02 Hari 04 Jam`. Untuk mencegah mismatch hydration, countdown live baru aktif setelah halaman selesai dimuat di browser.

Panduan penjelasan menu untuk pengguna tersedia di [docs/panduan-menu.md](docs/panduan-menu.md).

Port dan host bisa diubah:

```bash
PORT=3001 HOST=0.0.0.0 ./launcher.sh
```

Untuk development dengan kompilasi on-demand dan hot reload, jalankan:

```bash
MODE=dev ./launcher.sh
```

## Testing

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run test
PATH="$PWD/.tools/node/bin:$PATH" npm run lint
PATH="$PWD/.tools/node/bin:$PATH" npm run typecheck
PATH="$PWD/.tools/node/bin:$PATH" npm run build
```

Test otomatis mencakup utilitas dashboard, register/login database, rate limit auth, session token, dan persistensi SQLite server-side untuk pekerjaan, aktivitas, rutinitas, serta pengaturan.

## Sebelum Commit

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run prepare:commit
```

File hasil build, dependency, toolchain lokal, cache TypeScript, dan file environment sudah dikecualikan lewat `.gitignore`. GitHub Actions menjalankan test, lint, typecheck, dan build pada push ke `main` dan pull request.

## Build

```bash
PATH="$PWD/.tools/node/bin:$PATH" npm run build
```

## Tes Manual

- Dengan database kosong, buka `/dashboard` dan pastikan diarahkan ke `/register`, cek link masuk membuka `/login`, cek link register dari login kembali ke `/register`, cek validasi live register, buat akun pertama, pastikan countdown mengarah ke `/login`, lalu login ke dashboard. Logout lalu login ulang dan pastikan rate limit menolak percobaan berlebihan.
- Klik semua menu sidebar: Dashboard, Pekerjaan, Aktivitas Harian, Rutinitas, Laporan, Pengaturan.
- Di `/dashboard`, klik card ringkasan pekerjaan dan aktivitas untuk memastikan menu tujuan terbuka dengan filter otomatis, cek donut chart status pekerjaan dengan total di tengah dan legend permanen, cek grafik `Kegiatan Per Hari`, lalu cek urutan pekerjaan berdasarkan deadline aktif terdekat, format compact `DD:HH:MM:SS`, perubahan warna pada threshold 3 hari dan 1 hari, lalu verifikasi panel `Kegiatan Hari Ini` menggabungkan aktivitas dan rutinitas dengan label tipe yang benar serta urutan item lewat waktu di paling atas.
- Di `/tasks`, tambah, edit, hapus dengan konfirmasi, filter, ubah status pekerjaan, cek pagination, verifikasi label countdown compact pada task aktif maupun yang terlambat, dan cek hover highlight pada setiap baris task.
- Di `/activities`, tambah, edit, hapus dengan konfirmasi, filter, ubah status aktivitas, cek pagination, verifikasi deep link dari dashboard membuka aktivitas yang tepat, cek hover highlight pada setiap kartu aktivitas, dan cek opsi ceklis mengubah status menjadi `Selesai`.
- Di `/routines`, tambah, edit, hapus rutinitas mingguan, pilih satu atau banyak hari aktif, lalu verifikasi rutinitas hanya tampil di dashboard pada hari yang cocok dan hilang setelah jam lewat.
- Refresh browser dan login ulang bila perlu untuk memastikan data tersimpan di SQLite.
- Di `/reports`, ubah filter laporan dan jalankan export CSV.
- Di `/settings`, ubah tema tampilan, pilih preferensi kategori aktivitas, buka halaman ubah password dan simpan password baru, export backup JSON, import backup JSON, dan reset data sampai daftar pekerjaan/aktivitas/rutinitas kosong.
- Cek tampilan desktop dan mobile, termasuk tombol hamburger.
