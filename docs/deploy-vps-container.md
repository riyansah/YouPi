# Deploy ke VPS dengan Docker

Panduan ini menjelaskan deployment YouPi pada satu VPS dengan Docker Compose, Caddy, HTTPS otomatis, dan volume SQLite persisten.

## Arsitektur

- Container `app` menjalankan Next.js pada port internal `3000`.
- Container `caddy` menerima trafik publik pada port `80` dan `443` lalu meneruskannya ke `app`.
- Database disimpan di volume bernama `youpi-data`, bukan di filesystem sementara container.
- Waktu aplikasi tetap menggunakan `Asia/Jakarta (WIB)`.

## Prasyarat

- VPS Linux dengan Docker Engine dan plugin Docker Compose.
- Domain atau subdomain yang A/AAAA record-nya sudah mengarah ke IP VPS.
- Port `80` dan `443` terbuka pada firewall VPS.
- Repository sudah di-clone ke VPS.

Verifikasi instalasi:

```bash
docker --version
docker compose version
```

## Konfigurasi Compose

Buat `compose.yaml` di root repository:

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    environment:
      TZ: Asia/Jakarta
      SQLITE_PATH: /data/activity.sqlite
      APP_INTERNAL_ORIGIN: http://127.0.0.1:3000
      TRUST_PROXY_HEADERS: "true"
    volumes:
      - youpi-data:/data
    expose:
      - "3000"

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config

volumes:
  youpi-data:
    name: youpi-data
  caddy-data:
  caddy-config:
```

`TRUST_PROXY_HEADERS=true` aman pada konfigurasi ini karena Caddy menjadi satu-satunya jalur publik menuju aplikasi dan menimpa header IP client. Jangan publikasikan port `3000` langsung ke internet.

## Konfigurasi Domain dan HTTPS

Buat `Caddyfile` dan ganti domain contoh dengan domain Anda:

```caddyfile
youpi.example.com {
  reverse_proxy app:3000 {
    header_up X-Real-IP {remote_host}
    header_up X-Forwarded-For {remote_host}
  }
}
```

Pastikan DNS sudah mengarah ke VPS sebelum menjalankan Caddy. Sertifikat HTTPS akan diminta dan diperbarui otomatis oleh Caddy.

## Build dan Jalankan

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 app caddy
```

Buka `https://youpi.example.com/register` untuk membuat akun pertama. Setelah akun dibuat, endpoint register tidak menerima pembuatan akun tambahan.

Verifikasi dari terminal:

```bash
curl -I https://youpi.example.com/login
```

## Backup dan Restore

Cara utama adalah menu `Settings`: unduh backup JSON secara berkala dan simpan salinannya di lokasi lain. Restore melalui menu yang sama akan memvalidasi file, membuat backup pengaman, lalu mengganti data dalam satu transaksi.

Untuk snapshot volume sebelum update besar:

```bash
mkdir -p backups
docker compose stop app
docker run --rm -v youpi-data:/data -v "$PWD/backups":/backup busybox \
  tar -czf /backup/youpi-data.tar.gz -C /data .
docker compose start app
```

Menghentikan `app` saat snapshot mencegah salinan file SQLite yang tidak konsisten. Jangan memasukkan file backup atau database ke Git.

## Update dan Rollback

Sebelum update, unduh backup JSON dan catat commit atau tag yang sedang digunakan. Kemudian:

```bash
git pull --ff-only
docker compose up -d --build
docker compose logs --tail=100 app
```

Saat pertama kali berpindah dari image lama yang berjalan sebagai `root` ke image non-root versi 0.7.64 atau lebih baru, perbaiki ownership volume satu kali sebelum menjalankan container baru:

```bash
docker compose build app
docker compose run --rm --user root --entrypoint chown app -R node:node /data
docker compose up -d
```

Perintah tersebut hanya mengubah ownership volume aplikasi; data SQLite tidak dihapus atau diganti.

Jika versi baru gagal, checkout kembali commit atau tag sebelumnya lalu jalankan `docker compose up -d --build`. Pulihkan backup hanya jika data memang perlu dikembalikan; rollback image saja tidak otomatis mengubah volume SQLite.

## Troubleshooting

- **`502 Bad Gateway`**: periksa `docker compose ps` dan log container `app`.
- **HTTPS belum aktif**: periksa DNS, firewall, dan log `caddy`; port `80` serta `443` harus dapat diakses publik.
- **Database tidak bisa ditulis**: pastikan volume `youpi-data` terpasang pada `/data`; untuk volume dari image root lama, jalankan perintah migrasi ownership pada bagian update.
- **Rate limit memakai IP proxy**: pastikan hanya Caddy yang dapat mengakses `app` dan `TRUST_PROXY_HEADERS=true` aktif.
- **Login terus kembali ke halaman login**: pastikan akses memakai HTTPS dan waktu sistem VPS tersinkron.

## Operasional Minimum

- Simpan backup di luar VPS dan uji restore secara berkala.
- Pantau `docker compose logs` dan kapasitas disk volume.
- Terapkan update OS, Docker, dan dependency aplikasi secara berkala.
- Batasi SSH, aktifkan firewall, dan jangan mengekspos port internal aplikasi.
