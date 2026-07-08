# Panduan Menu YouPi

Panduan ini menjelaskan fungsi setiap menu utama agar pengguna bisa langsung memahami alur kerja aplikasi.

## Ringkasan Aplikasi

`YouPi` dipakai untuk mengelola:

- work,
- activities,
- routines,
- reports,
- dan settings.

Semua data disimpan di SQLite dan hanya bisa diakses setelah login.

## Navigasi Utama

Menu utama ada di sidebar:

- Badge pada `Work` menampilkan jumlah pekerjaan yang sedang `Berjalan`, dengan tooltip yang menjelaskan arti angkanya.
- Badge pada `Activities` menampilkan jumlah aktivitas overdue yang masih membutuhkan aksi pengguna, dengan tooltip yang menjelaskan arti angkanya.


- `Dashboard`
- `Work` atau `Pekerjaan`
- `Activities` atau `Aktivitas`
- `Routines` atau `Rutinitas`
- `Schedule` atau `Jadwal`
- `Notes` atau `Catatan`
- `History` atau `Riwayat`
- `Reports` atau `Laporan`
- `Settings` atau `Pengaturan`

Pada mobile, sidebar dibuka dari tombol menu di header. Brand `YouPi` dan tagline `You Plan It` di sidebar sama-sama mengarah ke dashboard. Setelah login, indikator hari, tanggal, dan jam aktif tampil sejajar dengan judul menu pada setiap halaman, mengikuti waktu tetap `Asia/Jakarta (WIB)`, dan sekarang tampil dalam kartu waktu yang lebih menonjol.

## Menu Schedule

`Schedule` adalah pusat tampilan waktu untuk menggabungkan data dari `Work`, `Activities`, dan `Routines` dalam satu halaman. Occurrence `Routines` yang jamnya sudah lewat tidak dianggap `missed`; item tersebut ditandai selesai di tampilan jadwal.

Di halaman ini pengguna bisa:

- melihat jadwal hari ini, minggu ini, bulan ini, atau daftar agenda,
- memfilter item berdasarkan sumber data dan status,
- melihat ringkasan jumlah work, activity, routine, dan item missed,
- membuka item terkait kembali ke halaman `Work`, `Activities`, atau `Routines`.

## Menu Notes

`Notes` adalah pusat catatan pribadi di YouPi. Note bisa berdiri sendiri sebagai catatan personal atau dihubungkan ke item `Work`, `Activities`, dan `Routines`.

Di halaman ini pengguna bisa:

- membuat, membuka, mengedit, dan menghapus note,
- mencari note berdasarkan judul, isi, tag, atau kategori,
- memfilter note berdasarkan kategori atau status pinned,
- membuka note cepat lewat drawer atau edit panjang lewat halaman detail note,
- melihat note terkait saat mengedit item `Work`, `Activities`, atau `Routines`.


## Menu History

`History` adalah timeline otomatis untuk melihat jejak perubahan penting dari `Work`, `Activities`, `Routines`, dan `Notes`.

Di halaman ini pengguna bisa:

- mencari riwayat berdasarkan title, description, kategori, atau event,
- memfilter riwayat berdasarkan kategori item, jenis event, dan rentang tanggal,
- membuka detail history di drawer kanan,
- kembali ke item terkait jika item tersebut masih tersedia.

## Catatan

- Bahasa antarmuka dapat diubah dari menu `Settings`, sementara seluruh waktu aplikasi dikunci ke `Asia/Jakarta (WIB)`.
- Default bahasa untuk preference baru adalah `English`, dan seluruh waktu sistem memakai `Asia/Jakarta`.

- Pada form perencanaan `Work` dan `Activities`, status `Dibatalkan` tidak ditampilkan sebagai opsi input awal. Status itu hanya muncul pada daftar item untuk penyesuaian setelah item dibuat.
- Daftar `Work` dan `Activities` sekarang sama-sama memiliki quick action `Selesai` dan `Dibatalkan` dengan tampilan yang konsisten.
- Panel `Activities need attention` sekarang menyediakan aksi `Selesai` dan `Dibatalkan` untuk aktivitas yang sudah lewat waktu. Saat tombol `View` ditekan dari toast, toast akan menghilang sementara sampai panel ditutup lagi.
