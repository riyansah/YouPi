# Plan Schedule

## 1. Analisis struktur project saat ini

Project YouPi menggunakan Next.js App Router dengan state utama dashboard yang menggabungkan `tasks`, `activities`, `routines`, dan `settings`. Data inti sudah dipakai lintas halaman melalui store dan util bersama, sehingga fitur `Schedule` paling aman dibuat sebagai halaman agregasi baru, bukan mengganti alur input yang sudah ada.

## 2. File apa saja yang perlu dicek

- `app/dashboard/page.tsx` untuk pola layout dan ringkasan dashboard
- `app/tasks/page.tsx` untuk struktur data Work dan link detail
- `app/activities/page.tsx` untuk model Activities dan pola filter
- `app/routines/page.tsx` untuk model Routines dan pengulangan jadwal
- `lib/types.ts` untuk tipe data Schedule baru
- `lib/utils.ts` untuk agregasi, range tanggal, filter, dan summary
- `lib/navigation.ts` dan `lib/i18n.ts` untuk menu/sidebar dan label route
- `lib/dashboard-store.tsx` atau layer data terkait untuk memastikan Schedule membaca sumber data yang sama
- `tests/dashboard-utils.test.ts` untuk validasi util agregasi

## 3. Perubahan database/model yang diperlukan

Untuk fase ini, Schedule tidak butuh tabel baru karena data yang dibutuhkan sudah tersedia dari model Work, Activities, dan Routines. Schedule dibentuk sebagai view komputasi di atas data yang ada.

Catatan schema:

- `Work` sudah punya `title`, `startDate`, `deadline`, `startTime`, `endTime`, `status`, `priority`.
- `Activities` sudah punya `title`, `category`, `date`, `startTime`, `endTime`, `status`.
- `Routines` sudah punya `title`, `days`, `startTime`, `endTime`, `priority`.
- `reminder` belum menjadi field persistensi umum, jadi pada fase ini nilainya opsional dan ditampilkan `null` bila belum tersedia.

Jika nanti dibutuhkan reminder nyata atau histori penyelesaian routine per occurrence, perubahan schema yang aman adalah menambah field reminder per entitas dan tabel occurrence log terpisah, bukan mengubah struktur dasar yang sekarang.

## 4. Komponen frontend yang perlu dibuat

- Halaman baru `app/schedule/page.tsx`
- Toolbar filter dan kontrol rentang tanggal
- Summary cards untuk total hari ini, work, activity, routine, dan missed
- Kartu item Schedule reusable untuk semua sumber data
- Mode tampilan `Today View`, `Week View`, `Month View`, dan `Agenda List`

## 5. API/backend yang perlu ditambahkan atau disesuaikan

Tidak perlu endpoint backend baru pada fase ini selama halaman Schedule membaca dari store/data source yang sama dengan Work, Activities, dan Routines. Bila di masa depan data dipisah server-side per halaman, endpoint agregasi dapat ditambah belakangan tanpa mengubah kontrak UI saat ini.

## 6. Alur data Schedule dari Work, Activities, dan Routines

1. Ambil `tasks`, `activities`, dan `routines` dari store yang sudah ada.
2. Bentuk `date range` berdasarkan mode view dan tanggal anchor.
3. Map setiap sumber data ke struktur `ScheduleItem` yang seragam.
4. Expand `Routines` menjadi occurrence per tanggal yang cocok pada range aktif.
5. Hitung `displayStatus` seperti `upcoming`, `done`, `missed`, atau `cancelled` dari data sumber dan waktu referensi.
6. Urutkan item berdasarkan tanggal dan waktu.
7. Terapkan filter source/status lalu tampilkan ke view aktif.

## 7. Tahapan implementasi paling aman

1. Tambah tipe dan util agregasi Schedule tanpa mengubah perilaku halaman lama.
2. Tambah route/menu `Schedule` dan label i18n.
3. Buat halaman Schedule read-only yang hanya membaca data yang sudah ada.
4. Tambah ringkasan, filter, dan empat mode tampilan.
5. Tambah test util untuk range, agregasi, filter, dan summary.
6. Update README, changelog, versi, dan panduan menu setelah fitur stabil.

## 8. Risiko perubahan dan cara menghindarinya

- Risiko salah memetakan status dari sumber data berbeda.
  Mitigasi: gunakan util terpusat dan test per kategori.
- Risiko routine tampil ganda atau salah tanggal.
  Mitigasi: expand occurrence hanya dalam range aktif dan pakai util hari yang sudah konsisten.
- Risiko Work/Activities/Routines lama ikut rusak.
  Mitigasi: Schedule dibuat read-only dan tidak mengubah flow create/edit lama.
- Risiko inkonsistensi UI.
  Mitigasi: reuse `PageHeader`, `StatCard`, tone warna, dan komponen layout yang sudah ada.

## 9. Testing yang perlu dilakukan

- Unit test util `buildScheduleRange`
- Unit test agregasi `buildScheduleItems` dari tiga sumber data
- Unit test filter source/status dan summary
- Lint dan typecheck untuk file route baru
- Smoke test render halaman Schedule dan navigasi ke source page terkait

## 10. Status

Plan ini sudah diimplementasikan pada fase awal Schedule read-only. Langkah berikutnya yang masih bisa dikembangkan adalah reminder persistence, routine completion log per occurrence, dan interaksi drag/drop bila memang dibutuhkan nanti.
