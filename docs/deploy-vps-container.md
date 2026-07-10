# Deploy ke VPS dengan Docker

Panduan ini menjelaskan langkah demi langkah agar `YouPi` bisa online di VPS dengan domain sendiri menggunakan container.

## Ringkasan Arsitektur

- Aplikasi berjalan di container `app` pada port internal `3000`.
- Caddy berjalan sebagai reverse proxy pada port `80` dan `443`.
- HTTPS dibuat otomatis oleh Caddy selama domain sudah mengarah ke IP VPS.
- Database SQLite disimpan di Docker volume agar data tetap ada walau container dibuat ulang.
- Jika reverse proxy menimpa header IP client, set `TRUST_PROXY_HEADERS=true` agar rate limit memakai IP asli. Biarkan `false` jika proxy tidak dikonfigurasi untuk menimpa `X-Forwarded-For`/`X-Real-IP`.

## Yang Perlu Disiapkan

- VPS Linux yang bisa diakses lewat SSH.
- Domain atau subdomain yang sudah Anda miliki.
- Akses ke DNS domain.
- Akses ke repository GitHub: `https://github.com/riyansah/activity.git`
