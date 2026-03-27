# 🗄️ SQL Dump Analyzer

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4.svg)](https://tailwindcss.com/)

**SQL Dump Analyzer** adalah perangkat lunak antarmuka berbasis web mutakhir yang dapat membaca, membedah (*parse*), dan memetakan konten basis data berformat murni `.sql`—**tanpa memerlukan koneksi server basis data sama sekali**. Aplikasi mereduksi arsitektur skrip kompleks menjadi tampilan tabel yang interaktif langsung dari ujung *Client-Side Browser*.

## ✨ Fitur Utama
- **Generasi Tabel Visual Instan**: Menyerap perintah dasar `CREATE TABLE` serta `INSERT INTO`, mengubahnya spontan menjadi wujud baris tabel cantik berpraktek tata letak (*Pagination*) yang terurut.
- **Micro-Interactions Kelas Berat**: Ditenagai penuh oleh **Framer Motion**, memadukan konsep pergeseran tata letak mulus dan *Accordion Single-View* (Satu Buka-Lain Tutup) untuk pengalaman berkelas Enterprise tanpa guncangan visual layar.
- **Editor IDE Terintegrasi (Monaco)**: Mesin inti VSCode tertanam di jantung aplikasi. Mampu menahan hentakan ratusan Megabyte naskah data tanpa *crash* berkat racikan sistem **Timer Debounce UI** dan pemakaian memori tak terikat *(Uncontrolled Component)*.
- **Detektif Sintaks Pintar**: Menolak melempar Error kepada baris *Komentar SQL* murni, menahan siklus mati *(Deadlock Loading)* saat memutar data kembar, serta membuang muatan raksasa yang tidak diperlukan demi kewarasan *memory browser*.
- **Auto-Detection Project Type**: Menganalisis nama tabel-tabel penyusun, menebak untuk keperluan framework / pola proyeksi aplikasi apa tumpukan data dump ini biasanya ditujukan.

---

## 🛠️ Tech Stack
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 6 (*Include Native Environment Tree-Shaking*)
- **Styling**: Tailwind CSS v4 + UI Pradana
- **Editor Text UI**: Monaco Editor (`@monaco-editor/react`)
- **Animasi Core**: Framer Motion
- **Ikonografi**: Lucide React

---

## 🏗️ Panduan Menjalankan Lingkungan Lokal

Sistem ini bersifat modern dan cepat. Pastikan perangkat Anda sudah ditopang setidaknya oleh `Node.js` v18+ dan NPM.

```bash
# 1. Klon repositori utama
git clone https://github.com/AlvinPradanaAntony/sql_analyzer-vibecodes.git

# 2. Masuk ke ruang arsitektural proyek
cd projek_vibecode

# 3. Rakit instalasi paket Node (*Dependencies*)
npm install

# 4. Bangkitkan Server Pengembangan
npm run dev
```

Selesai. Anda cukup membuka *browser* dengan alamat de facto `http://localhost:5173`.

---

## 🌳 Panduan Kolaborasi (Git Workflow)

Repositori ini secara ketat memeluk aliran pengembangan standar industri: **Feature Branch Workflow**. Hal ini bertujuan menjamin *branch* utama (`main`) senantiasa menopang lingkungan siap tayang (*Production-Ready*) dan tak pernah dihantam kode setengah matang.

### 1. Sinkronkan Senjata (Pangkalan Utama)
Sebelum menulis apapun, pastikan lingkungan dasar *(main)* Anda sejajar dengan *Server Origin* tertinggi.
```bash
git checkout main
git pull origin main
```

### 2. Pisahkan Ruang Kerja Anda (Branching)
Dilarang keras menyalurkan kode *(commit)* ke nadi `main` secara langsung. Buatlah ranting *(Branch)* yang bermuatan makna konvensi jelas.
- `feature/` (Menambahkan tabel baru, mode _Dark_)
- `bugfix/` (Menanggulangi fitur tabrakan, layar macet)
- `refactor/` (Merapikan susunan kotoran file, mengoptimalkan _Array_ pemrosesan data)

```bash
git checkout -b feature/ekspor-gambar-tabel
```

### 3. Penancapan Memori Diskrit (Conventional Commits)
Sembari bekerja, bekukanlah perubahan dengan menguncinya per kelompok kecil *(Granular)*. Pesan histori *(Commit Message)* Anda harus mengandung awalan deskriptif:

```bash
git add src/App.tsx
git commit -m "feat: mengalihkan animasi tabel ke posisi murni mencegah distorsi gepeng"

git add src/hooks/
git commit -m "fix: melompati timer bawaan sistem jika data upload ganda terjadi"
```

### 4. Pelacakan Ulang & Pertempuran Basis (Rebase / Merge)
Jika Anda sudah menyelesaikan fitur satu minggu kemudian, sangat mungkin wujud `main` pusat sudah berevolusi maju ditinggalkan Anda. Wajib menurunkannya *(Pull)*, menggabungkannya dengan kode Anda, dan menguji bahwa aplikasi tidak memunculkan *"Layar Merah / Merged Conflict"*.
```bash
git checkout main
git pull origin main
git checkout feature/ekspor-gambar-tabel
# Sang Raja Git lebih menyarankan Rebase demi garis waktu yang linear!
git rebase main    
```

### 5. Memohon Intervensi (Pull Request)
Pampangkan ranting fitur Anda kembali ke awan *(Cloud/GitHub)*.
```bash
git push origin feature/ekspor-gambar-tabel
```
Loncat buka repositori GitHub, pilih **Compare & Pull Request**, dan jelaskan rangkuman karya spektakuler Anda. Admin (Code Reviewer) akan menginvestigasi naskahnya dan barulah menyuntikkannya *(Merge)* masuk melebur sepenuhnya ke `main` master.

---

> **Dokumentasi Lengkap Histori Versi**
> Jika Anda penasaran lintasan masalah arsitektural apa saja yang berhasil ditundukkan, Anda dapat meninjau penuh rangkumannya di ruang dokumen `CHANGELOG.md`.
