# Panduan Menu Personal Activity Dashboard

Panduan ini membantu pengguna memahami fungsi setiap menu pada aplikasi `Personal Activity Dashboard`, mulai dari halaman utama dashboard sampai pengaturan data pribadi.

## Gambaran Umum Aplikasi

Personal Activity Dashboard adalah aplikasi untuk:

- memantau pekerjaan yang sedang dikerjakan,
- mencatat aktivitas harian,
- melihat ringkasan progress,
- membuat laporan produktivitas,
- dan mengelola backup data pribadi.

Semua data pribadi disimpan di SQLite pada server dan hanya bisa dibuka setelah login.

## Struktur Menu Utama

Menu utama aplikasi ada di sidebar sebelah kiri:

- `Dashboard`
- `Pekerjaan`
- `Aktivitas Harian`
- `Laporan`
- `Pengaturan`

Pada layar kecil atau mobile, sidebar dapat dibuka melalui tombol menu di bagian atas.

## Dashboard

Halaman `Dashboard` adalah ringkasan utama kondisi pekerjaan dan aktivitas Anda saat ini. Halaman ini cocok dipakai sebagai halaman pertama saat membuka aplikasi.

### Isi Dashboard

Dashboard berisi beberapa bagian:

1. `Kartu ringkasan`
   Menampilkan angka penting seperti:
   - total pekerjaan,
   - pekerjaan yang sedang berjalan,
   - pekerjaan selesai,
   - pekerjaan tertunda,
   - jumlah aktivitas hari ini,
   - persentase penyelesaian pekerjaan.

2. `Grafik progress`
   Menampilkan visual ringkasan data, seperti:
   - komposisi status pekerjaan,
   - aktivitas per hari,
   - progress mingguan.

3. `Panel Deadline Terdekat`
   Menampilkan pekerjaan aktif dengan deadline paling dekat, lengkap dengan status, tanggal deadline, dan hitung mundur detail.

4. `Panel Aktivitas Hari Ini`
   Menampilkan aktivitas yang dijadwalkan pada tanggal hari ini, lengkap dengan jam, kategori, dan status.

### Interaksi di Dashboard

Untuk membantu navigasi lebih cepat:

- panel `Deadline Terdekat` memakai pagination sendiri,
- panel `Aktivitas Hari Ini` juga memakai pagination sendiri,
- item pekerjaan dan aktivitas dapat diklik,
- klik item akan membuka halaman terkait dan langsung memfokuskan item tersebut ke mode edit.

Masing-masing panel menampilkan `4 item per halaman`. Anda bisa berpindah halaman tanpa memengaruhi panel lainnya.

### Countdown Deadline

Pekerjaan aktif di dashboard menampilkan hitung mundur deadline secara detail dalam format:

- hari,
- jam,
- menit,
- detik.

Jika deadline sudah lewat, dashboard akan menampilkan status keterlambatan dengan format yang sama.

## Pekerjaan

Halaman `Pekerjaan` dipakai untuk mengelola daftar pekerjaan atau task.

### Fungsi Utama Menu Pekerjaan

Di halaman ini Anda bisa:

- menambah pekerjaan baru,
- mengedit pekerjaan yang sudah ada,
- menghapus pekerjaan dengan konfirmasi,
- mengubah status pekerjaan,
- memfilter pekerjaan berdasarkan status,
- memfilter pekerjaan berdasarkan prioritas,
- melihat daftar pekerjaan dalam beberapa halaman,
- melihat countdown deadline pada pekerjaan yang masih aktif.

### Informasi yang Dicatat pada Pekerjaan

Setiap pekerjaan memiliki data:

- judul,
- deskripsi,
- status,
- prioritas,
- tanggal mulai,
- deadline.

### Pagination di Menu Pekerjaan

Daftar pekerjaan memakai pagination `10 item per halaman` setelah filter diterapkan. Jika filter diubah, halaman akan kembali ke halaman pertama agar hasil lebih mudah dibaca.

## Aktivitas Harian

Halaman `Aktivitas Harian` dipakai untuk mencatat kegiatan harian yang dilakukan atau direncanakan.

### Fungsi Utama Menu Aktivitas Harian

Di halaman ini Anda bisa:

- menambah aktivitas baru,
- mengedit aktivitas,
- menghapus aktivitas dengan konfirmasi,
- mengubah status aktivitas,
- memfilter aktivitas berdasarkan tanggal,
- memfilter aktivitas berdasarkan kategori,
- melihat daftar aktivitas dalam beberapa halaman.

### Informasi yang Dicatat pada Aktivitas

Setiap aktivitas memiliki data:

- judul,
- kategori,
- tanggal,
- jam mulai,
- jam selesai,
- status,
- catatan tambahan.

### Pagination di Menu Aktivitas

Daftar aktivitas juga memakai pagination `10 item per halaman` setelah filter aktif diterapkan.

## Laporan

Halaman `Laporan` dipakai untuk melihat ringkasan produktivitas berdasarkan periode tertentu.

### Fungsi Utama Menu Laporan

Di halaman ini Anda bisa:

- memilih tanggal acuan,
- memilih jenis laporan `Harian`, `Mingguan`, atau `Bulanan`,
- melihat ringkasan total pekerjaan dan aktivitas,
- melihat grafik berdasarkan data yang sedang difilter,
- mengekspor ringkasan laporan ke file CSV.

### Kapan Menu Laporan Digunakan

Menu ini cocok dipakai saat Anda ingin:

- mengevaluasi progress kerja,
- melihat kategori aktivitas yang paling dominan,
- mengetahui jumlah pekerjaan selesai,
- memeriksa pekerjaan yang melewati deadline,
- menyimpan ringkasan laporan dalam format CSV.

## Pengaturan

Halaman `Pengaturan` dipakai untuk mengelola preferensi dashboard dan data pribadi.

### Fungsi Utama Menu Pengaturan

Di halaman ini Anda bisa:

- mengganti nama dashboard,
- memilih tema tampilan,
- mengatur preferensi kategori aktivitas,
- mengekspor backup JSON,
- mengimpor backup JSON,
- mengosongkan pekerjaan, aktivitas, dan rutinitas.

### Backup dan Reset

Fitur backup dan reset penting untuk dipahami:

- `Export JSON` membuat salinan data pekerjaan, aktivitas, rutinitas, dan preferensi.
- `Import JSON` memulihkan data dari file backup yang valid.
- `Reset data` menghapus seluruh pekerjaan, aktivitas, dan rutinitas, lalu mengembalikan preferensi ke default.

Sebelum impor atau reset, aplikasi akan meminta konfirmasi agar perubahan besar tidak terjadi tanpa sengaja.

## Alur Penggunaan yang Disarankan

Berikut alur penggunaan yang paling mudah untuk user baru:

1. Buka `Dashboard` untuk melihat kondisi umum pekerjaan dan aktivitas.
2. Klik pekerjaan atau aktivitas penting langsung dari dashboard jika ingin segera membuka item yang relevan.
3. Masuk ke `Pekerjaan` untuk menambah atau memperbarui task.
4. Masuk ke `Aktivitas Harian` untuk mencatat agenda dan aktivitas yang dijalankan.
5. Gunakan `Laporan` untuk mengevaluasi hasil harian, mingguan, atau bulanan.
6. Buka `Pengaturan` jika ingin mengubah preferensi atau membuat backup data.

## Ringkasan Singkat Fungsi Tiap Menu

- `Dashboard`: pusat ringkasan, deadline terdekat, dan pantauan cepat.
- `Pekerjaan`: tempat mengelola task dan deadline.
- `Aktivitas Harian`: tempat mencatat aktivitas harian.
- `Laporan`: tempat membaca ringkasan dan export CSV.
- `Pengaturan`: tempat mengubah preferensi dan mengelola backup data.

## Catatan untuk Pengguna

- Data aplikasi bersifat pribadi dan membutuhkan login.
- Pastikan file SQLite di server masuk strategi backup jika data penting.
- Gunakan fitur backup JSON secara berkala bila data penting ingin disimpan.
