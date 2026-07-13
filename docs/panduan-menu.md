# Panduan Menu YouPi

Panduan ini menjelaskan fungsi menu utama YouPi agar pengguna baru bisa langsung memahami alur kerja aplikasi.

## Ringkasan

YouPi adalah dashboard pribadi untuk mengelola pekerjaan, aktivitas, rutinitas, jadwal, catatan, riwayat, laporan, dan pengaturan dalam satu akun lokal.

Semua data tersimpan di SQLite dan hanya dapat diakses setelah login. Waktu aplikasi dikunci ke `Asia/Jakarta (WIB)`.

## Navigasi

Menu utama berada di sidebar:

- `Dashboard`
- `Work` atau `Pekerjaan`
- `Activities` atau `Aktivitas`
- `Routines` atau `Rutinitas`
- `Schedule` atau `Jadwal`
- `Notes` atau `Catatan`
- `History` atau `Riwayat`
- `Reports` atau `Laporan`
- `Settings` atau `Pengaturan`

Pada layar mobile, sidebar dibuka dari tombol menu di header. Brand `YouPi` dan tagline `You Plan It` mengarah ke `Dashboard`.

Badge pada `Work` menampilkan jumlah pekerjaan yang sedang berjalan. Badge pada `Activities` menampilkan jumlah aktivitas yang sudah lewat waktu dan masih membutuhkan aksi.

## Dashboard

`Dashboard` menampilkan ringkasan utama hari ini:

- kartu statistik pekerjaan dan aktivitas,
- grafik status dan progres,
- deadline pekerjaan terdekat,
- agenda hari ini dari work, activities, dan routines,
- indikator hari, tanggal, dan jam aktif dalam WIB.

Gunakan halaman ini untuk melihat kondisi umum sebelum masuk ke menu detail.

## Work

`Work` dipakai untuk pekerjaan, tugas, proyek, dan deadline.

Di halaman ini pengguna bisa:

- membuat, mengedit, menyelesaikan, membatalkan, dan menghapus pekerjaan,
- mengatur prioritas, status, tanggal deadline, serta waktu mulai/akhir,
- memakai filter dan pagination,
- menambahkan catatan terkait pekerjaan,
- melihat countdown untuk pekerjaan yang akan mulai, sedang berjalan, atau terlambat.

Status `Dibatalkan` tidak menjadi pilihan awal saat membuat item, tetapi tersedia sebagai aksi setelah item dibuat.

## Activities

`Activities` dipakai untuk kegiatan sekali jalan atau kegiatan umum yang dijadwalkan pada tanggal tertentu.

Di halaman ini pengguna bisa:

- membuat, mengedit, menyelesaikan, membatalkan, dan menghapus aktivitas,
- mengatur kategori, status, tanggal, serta waktu mulai/akhir,
- memfilter berdasarkan tanggal, kategori, status, dan preferensi,
- menambahkan catatan terkait aktivitas,
- menangani aktivitas overdue melalui panel `Activities need attention`.

Panel overdue menyediakan aksi `Selesai` dan `Dibatalkan`. Saat panel dibuka dari toast, toast disembunyikan sementara sampai panel ditutup.

## Routines

`Routines` dipakai untuk rutinitas mingguan yang berulang.

Di halaman ini pengguna bisa:

- membuat, mengedit, dan menghapus rutinitas,
- memilih hari aktif dan rentang waktu,
- menghubungkan catatan ke rutinitas,
- melihat kemunculan rutinitas pada `Dashboard` dan `Schedule`.

Kemunculan routine yang waktunya sudah lewat tidak otomatis dianggap `Missed` di tampilan `Schedule`.

## Schedule

`Schedule` menggabungkan `Work`, `Activities`, dan `Routines` dalam tampilan waktu.

Di halaman ini pengguna bisa:

- membuka tampilan `Today`, `Week`, `Month`, dan `Agenda`,
- memfilter item berdasarkan sumber data dan status,
- melihat ringkasan jumlah work, activity, routine, dan missed item,
- membuka item terkait kembali ke menu asalnya.

Gunakan menu ini untuk melihat benturan jadwal dan urutan kegiatan berdasarkan waktu.

## Notes

`Notes` adalah pusat catatan pribadi.

Di halaman ini pengguna bisa:

- membuat, membuka, mengedit, menghapus, dan melakukan pin pada catatan,
- mencari catatan berdasarkan judul, isi, tag, atau kategori,
- memfilter catatan berdasarkan kategori atau status pinned,
- membuka catatan cepat lewat drawer,
- mengedit catatan panjang lewat halaman detail,
- menghubungkan catatan ke work, activities, atau routines.

## History

`History` adalah timeline otomatis untuk perubahan penting.

Di halaman ini pengguna bisa:

- mencari riwayat berdasarkan judul, deskripsi, kategori, atau event,
- memfilter berdasarkan kategori item, jenis event, dan rentang tanggal,
- membuka detail history di drawer kanan,
- kembali ke item terkait jika item tersebut masih tersedia.

History mencatat event penting seperti created, updated, completed, missed, cancelled, deleted, pinned, dan unpinned.

## Reports

`Reports` menampilkan ringkasan produktivitas.

Di halaman ini pengguna bisa:

- memilih periode harian, mingguan, atau bulanan,
- melihat metrik pekerjaan dan aktivitas,
- membaca grafik status, kategori, dan progres,
- mengekspor laporan ke CSV, Excel, atau PDF.

Semua periode laporan mengikuti waktu `Asia/Jakarta (WIB)`.

## Settings

`Settings` dipakai untuk pengaturan aplikasi dan data.

Di halaman ini pengguna bisa:

- mengubah nama dashboard,
- memilih bahasa antarmuka `English` atau `Indonesia`,
- memilih tema `Light`, `Dark`, atau `System`,
- mengatur kategori aktivitas preferensi,
- mengunduh backup JSON serta mempreview dan memulihkan backup versi 1-6 dengan backup pengaman otomatis,
- mereset data work, activities, routines, notes, dan history,
- membuka halaman ubah password.

Reset data tidak menghapus akun login, tetapi mengosongkan data dashboard dan mengembalikan preferensi ke default.
