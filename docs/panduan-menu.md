# Panduan Menu Personal Activity Dashboard

Panduan ini menjelaskan fungsi setiap menu utama agar pengguna bisa langsung memahami alur kerja aplikasi.

## Ringkasan Aplikasi

`Personal Activity Dashboard` dipakai untuk mengelola:

- pekerjaan,
- aktivitas harian,
- rutinitas mingguan,
- laporan produktivitas,
- dan pengaturan data pribadi.

Semua data disimpan di SQLite dan hanya bisa diakses setelah login.

## Navigasi Utama

Menu utama ada di sidebar:

- `Dashboard`
- `Pekerjaan`
- `Aktivitas Harian`
- `Rutinitas`
- `Laporan`
- `Pengaturan`

Pada mobile, sidebar dibuka dari tombol menu di header. Brand `Personal` dan `Activity Hub` di sidebar sama-sama mengarah ke dashboard.

## Dashboard

`Dashboard` adalah halaman ringkasan utama.

Di halaman ini pengguna bisa melihat:

- kartu ringkasan pekerjaan dan aktivitas,
- grafik status pekerjaan,
- grafik kegiatan,
- panel `Deadline Terdekat`,
- panel `Kegiatan Hari Ini`.

Interaksi penting:

- kartu ringkasan bisa diklik untuk membuka halaman terkait,
- item pada `Deadline Terdekat` bisa diklik untuk membuka pekerjaan terkait,
- item pada `Kegiatan Hari Ini` bisa diklik untuk membuka aktivitas atau rutinitas terkait,
- aktivitas dan rutinitas pada agenda hari ini bisa langsung ditandai `Selesai`.

Panel deadline dan agenda memakai pagination sendiri, masing-masing `4 item per halaman`.

## Pekerjaan

`Pekerjaan` dipakai untuk mengelola task.

Fungsi utamanya:

- tambah pekerjaan,
- edit pekerjaan,
- hapus pekerjaan dengan konfirmasi,
- ubah status pekerjaan,
- tandai cepat dengan tombol `Selesai`,
- filter berdasarkan status,
- filter berdasarkan prioritas.

Data yang dicatat pada pekerjaan:

- judul,
- deskripsi,
- status,
- prioritas,
- tanggal mulai,
- deadline,
- jam mulai opsional,
- jam selesai opsional.

Catatan penting:

- jika jam mulai dan jam selesai diisi, countdown deadline akan mengikuti jam selesai,
- jika jam tidak diisi, countdown memakai akhir hari deadline,
- daftar pekerjaan memakai pagination `10 item per halaman`.

## Aktivitas Harian

`Aktivitas Harian` dipakai untuk mencatat kegiatan pada tanggal tertentu.

Fungsi utamanya:

- tambah aktivitas,
- edit aktivitas,
- hapus aktivitas dengan konfirmasi,
- ubah status aktivitas,
- tandai selesai dengan cepat,
- filter berdasarkan tanggal,
- filter berdasarkan kategori, termasuk filter `Preferensi` dari Pengaturan.

Data aktivitas:

- judul,
- kategori,
- tanggal,
- jam mulai,
- jam selesai,
- status,
- catatan.

Daftar aktivitas memakai pagination `10 item per halaman`.

## Rutinitas

`Rutinitas` dipakai untuk mencatat kegiatan berulang mingguan.

Fungsi utamanya:

- tambah rutinitas,
- edit rutinitas,
- hapus rutinitas dengan konfirmasi,
- pilih satu atau lebih hari aktif.

Data rutinitas:

- judul,
- hari aktif,
- jam mulai,
- jam selesai,
- prioritas,
- catatan.

Rutinitas yang aktif pada hari dan jam saat ini akan muncul juga di agenda dashboard.

## Laporan

`Laporan` dipakai untuk melihat ringkasan produktivitas berdasarkan periode.

Fungsi utamanya:

- pilih `Tanggal acuan`,
- pilih jenis laporan `Harian`, `Mingguan`, atau `Bulanan`,
- melihat kartu ringkasan yang mengikuti filter aktif,
- melihat grafik yang mengikuti filter aktif,
- export CSV detail yang mengikuti filter aktif,
- export Excel yang mengikuti filter aktif,
- export PDF dalam mode `Ringkas + detail penting` atau `Semua data filter`.

Grafik laporan yang tersedia:

- `Pekerjaan Berdasarkan Status`,
- `Aktivitas Berdasarkan Kategori`,
- `Kegiatan`,
- `Progress Pekerjaan`.

Semua judul dan data grafik berubah mengikuti periode aktif.

## Pengaturan

`Pengaturan` dipakai untuk mengelola preferensi dan data pribadi.

Fungsi utamanya:

- ganti nama dashboard,
- pilih tema `Terang`, `Gelap`, atau `Sistem`,
- atur preferensi kategori aktivitas,
- export backup JSON,
- import backup JSON,
- reset data,
- buka halaman ubah password.

Catatan penting:

- `Import JSON`, `Reset data`, dan `Logout` selalu memakai konfirmasi,
- `Reset data` mengosongkan pekerjaan, aktivitas, dan rutinitas lalu mengembalikan preferensi ke default.

## Alur Penggunaan yang Disarankan

1. Buka `Dashboard` untuk melihat kondisi hari ini.
2. Kelola task di `Pekerjaan`.
3. Catat agenda aktual di `Aktivitas Harian`.
4. Atur kegiatan berulang di `Rutinitas`.
5. Evaluasi hasil di `Laporan`.
6. Simpan backup dan atur preferensi di `Pengaturan`.

## Ringkasan Singkat

- `Dashboard`: pusat ringkasan, agenda hari ini, dan deadline terdekat.
- `Pekerjaan`: kelola task dan countdown deadline.
- `Aktivitas Harian`: catat kegiatan harian.
- `Rutinitas`: kelola kegiatan mingguan berulang.
- `Laporan`: baca ringkasan dan export CSV.
- `Pengaturan`: ubah preferensi, backup, reset data, dan ubah password.
