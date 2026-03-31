# Panduan Git Workflow & Release Otomatis

Dokumen ini merangkum alur kerja _(workflow)_ **Git** yang profesional untuk digunakan selama pengembangan proyek ini, baik saat Anda bekerja sendirian maupun dalam tim. Alur ini memastikan bahwa setiap perubahan fitur tercatat rapi, terdokumentasi, dan dipublikasikan (_release_) secara otomatis.

---

## 1. Fase Pengembangan (Development)

Setiap kali Anda ingin menambahkan fitur baru atau memperbaiki _bug_, ikuti langkah-langkah berikut:

### Langkah 1: Sinkronisasi dan Pembuatan Branch
Jangan langsung menulis kode di branch `main`. Pastikan repository lokal Anda *up-to-date*, lalu buat _branch_ khusus.
```bash
# Tarik perubahan terbaru dari server
git checkout main
git pull origin main

# Buat branch baru untuk fitur atau perbaikan Anda
# Format standar: feature/nama-fitur, bugfix/nama-bug
git checkout -b feature/pencarian-tabel
```

### Langkah 2: Tulis Kode & Simpan Perubahan (Commit)
Lakukan pengembangan seperti biasa. Setelah satu fitur/modul selesai, *commit* perubahan Anda dengan pesan yang terstruktur (menggunakan standar konvensi *Commit*).
```bash
git add .
git commit -m "feat: Menambahkan fitur pencarian tabel secara realtime"
```
_**Catatan Tipe Commit Standar:**_
- `feat:` (Fitur baru)
- `fix:` (Perbaikan bug)
- `refactor:` (Perbaikan struktur kode tanpa mengubah logika internal)
- `docs:` (Perubahan pada dokumentasi/readme)
- `style:` (Format ulang CSS/Tailwind, pembersihan spasi)
- `ci:` (Perubahan pada file konfigurasi GitHub Actions, dsb)

---

## 2. Fase Integrasi (Sinkronisasi Tim)

Setelah Anda selesai dan ingin menyuntikkan kode ke branch utama (`main`):

### Langkah 1: Simpan Kode Branch ke Remote
```bash
git push origin feature/pencarian-tabel
```

### Langkah 2: Buka Pull Request (Bila Bekerja dalam Tim)
Masuk ke antarmuka GitHub, buat **Pull Request (PR)** dari `feature/pencarian-tabel` menuju `main`. Ini adalah pintu keamanan untuk me-review kode bersama programmer lain.

### Langkah 3: Gabungkan (Merge)
Jika bekerja sendiri atau PR sudah disetujui, gabungkan (_merge_) _branch_ Anda ke `main`.
```bash
git checkout main
git pull origin main
git merge feature/pencarian-tabel
git push origin main
```
_Catatan: Jika terjadi konflik saat Pull, gunakan `git pull --rebase origin main` untuk merapihkan history deret waktunya agar selaras dengan server, layaknya yang kita praktikkan sebelumnya._

---

## 3. Fase Rilis (Production & Automated Release)

Apabila branch `main` sudah berisi beberapa perbaikan mapan dan siap diluncurkan sebagai tonggak versi baru (misal: dari versi `0.1.0` ke `0.2.0`), ikuti sekuensi profesional berikut:

### Langkah 1: Modifikasi Versi dan Dokumentasi
Anda *wajib* mencatat perubahan yang Anda rilis untuk rekam jejak pengguna/klien.
1. Buka file `package.json`, naikkan angka `"version"` menjadi versi terbaru (misal: `"0.2.0"`).
   *(Bisa juga ditambahkan secara instan via Terminal dengan komando: `npm version minor` atau `npm version patch`)*
2. Buka file `CHANGELOG.md`, tulis judul `## 🚀 Versi 0.2.0` di posisi **paling atas** dan jabarkan seluruh perbaikan atau fitur baru.

### Langkah 2: Commit Status Rilis
Simpan perubahan *package* dan *changelog* tersebut ke `main`.
```bash
git add package.json CHANGELOG.md
git commit -m "chore: Rilis versi 0.2.0 dan perbarui changelog"
git push origin main
```

### Langkah 3: Rilis Otomatis Menggunakan Git Tag (CI/CD GitHub Actions)
Langkah terakhir dan paling krusial! Buat **SemVer Tag** dan tembak tag tersebut ke server.
```bash
# Buat Penanda Versi (Tag Lokal)
git tag -a v0.2.0 -m "Release v0.2.0"

# Mendorong Tag ke Server Github
git push origin v0.2.0
```

> **🔥 KEAJAIBAN OTOMATISASI TERJADI DI SINI 🔥**
> Berkat pengaturan `.github/workflows/release.yml` yang telah kita buat, manakala GitHub mendeteksi `git push origin v0.2.0`:
> 1. Robot *Continuous Integration* langsung dihidupkan (Bisa dilihat di tab "Actions").
> 2. Robot membaca file `CHANGELOG.md` khusus untuk bagian "v0.2.0".
> 3. Membuat "Official GitHub Release Page" yang keren dan elegan di GitHub.
> 4. Menyudahi proses *release* dengan mempublikasikan rincian versinya kepada pengguna. Anda sama sekali tidak perlu pergi ke Web GitHub untuk melakukan _copy-paste_.
