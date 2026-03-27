# Changelog - SQL Dump Analyzer (Vibecode)

Dokumen ini merangkum seluruh perbaikan arsitektur, pemolesan UI/UX, dan optimasi performa *React* yang telah dilakukan selama proses pengembangan aplikasi.

## 🚀 Fitur Baru & Peningkatan Antarmuka (UI/UX)
- **Tampilan Accordion pada Tabel**: Mengubah sifat *expand/collapse* daftar tabel menjadi *Accordion Mutlak*. Membuka satu tabel akan otomatis melipat tabel lainnya untuk menjaga kerapian antarmuka, namun tetap mempertahankan fungsi tombol "Buka Semua / Tutup Semua".
- **Lahirnya UI Panel "Upload Progress" Terpisah**: Memindahkan logika *progress bar* yang panjang ke komponen mandiri `<UploadProgressPanel />` demi mematuhi rasio *Separation of Concerns (SoC)*.
- **Transisi Animasi Halus untuk File Mega (GB/MB)**: Menerapkan penahan layar *(Holding State)* untuk mencegah antarmuka lompat menjadi kosong (*blank*) saat Browser sedang menyusun arsitektur Regex parser untuk file SQL raksasa. Menambahkan *overlay spinner* pada Monaco Editor.

## ⚡ Optimasi Performa & Stabilitas (React & Vite)
- **Debouncing pada Monaco Editor**: Menambahkan jeda *timer* `500ms` pada *hook* `useSqlAnalyzer` menggunakan `debouncedSqlText`. Mencegah browser *freeze* *(lag)* ketika pengguna mengetik kode secara manual akibat Parser SQL yang dirender setiap ketukan.
- **Konversi Monaco ke Uncontrolled Component**: Mengganti sistem kendali React `value={...}` menjadi `defaultValue={...}` disertai manipulasi langsung via `editorRef.current?.setValue()`. Ini adalah *Best Practice* resmi untuk memperbaiki _bug_ kursor melompat ke akhir baris saat mengetik cepat.
- **Tree-Shaking Vite untuk Deployment**: Membungkus `<Inspector>` dari `react-dev-inspector` dengan variabel bawaan mesin `import.meta.env.DEV` di `main.tsx`. Memastikan *bundle* akhir khusus *Production* bersih dari paket developer yang berat.

## 🐛 Perbaikan Bug (Bugs Fixed)
- **Bug Layar Merah pada Teks Bawaan (Placeholder)**: Memperbaiki kesalahan pembacaan *line-ending* (`\r\n` vs `\n`) oleh Monaco Editor yang memicu layar *Error* saat halaman kosong/baru dimuat.
- **Bug Layar Merah pada Komentar**: Membedakan logika respons komponen antara "input teks ngawur" dan "input berupa komentar murni (`--`)". Komentar kini tidak direspons dengan Error Merah, melainkan dirender ke bentuk `EmptyState` dengan damai.
- **Bug Freeze Tombol Reset & Upload (Bypass Debounce)**: Teks editor yang dibersihkan/diunggah tertunda 500ms akibat `Debounce`. Diperbaiki dengan menginjeksi langsung (mutasi paksa seketika) pada _state buffer_ debounce untuk melompati antrean memori.
- **Bug Caching Browser pada File Ganda**: Input HTML tidak mau memicu *event* unggahan jika file yang sama dimasukkan 2x. Solusi dicapai dengan mereset manual `event.target.value = ""`.
- **Bug Deadlock Loading Abadi (Re-upload Same File)**: Mencegah *looping UI Loading* hancur apabila pengguna mengeklik file yang kontennya 100% identik dengan layar. Dipasang pagar fungsi `if (text === sqlText) return;`.
- **Bug Animasi "Gepeng" pada Pagination Tabel**: Memperbaiki distorsi / efek melar komponen anak tabel ketika jumlah baris halaman diubah. Mengubah pelacak dimensi Framer Motion dari `layout` penuh menjadi `layout="position"` agar sistem tidak lagi memaksa melakukan rotasi _Scale Y_ ke dalam kolom-kolom.
