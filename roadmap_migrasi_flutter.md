# Roadmap Migrasi Salmon App: React ke Flutter

Dokumen ini berisi rencana strategis dan teknis untuk memigrasikan frontend **Salmon App (Sales Monitor)** dari *tech stack* berbasis Web (React + Vite) ke *Cross-Platform Native* (Flutter).

Tujuan utama migrasi ini adalah:
1.  **Native Performance**: Meningkatkan stabilitas GPS, Kamera, dan Background Service di perangkat Android & iOS.
2.  **Offline-First Capability**: Memungkinkan Sales bekerja di area tanpa sinyal (Blank Spot) dengan sinkronisasi otomatis.
3.  **Unified Codebase**: Satu kode sumber untuk Android, iOS, dan Web Admin.

---

## 1. Analisis Perbandingan Arsitektur

### Current Stack (React PWA) vs Proposed Stack (Flutter)

| Komponen | React (Saat Ini) | Flutter (Masa Depan) | Benefit Migrasi |
| :--- | :--- | :--- | :--- |
| **Bahasa** | TypeScript (JS) | Dart | Tipe data ketat (Type-safe), performa kompilasi AOT (Ahead-of-Time). |
| **Rendering** | HTML DOM (WebView) | Skia/Impeller Engine | UI konsisten pixel-perfect di semua OS, 60/120 FPS. |
| **Akses Hardware** | Browser API (Terbatas) | Platform Channels (Native) | Akses GPS Background, Kamera, Bluetooth, dan Sensor jauh lebih stabil. |
| **Network** | Axios (XHR) | Dio (Http Client) | Kontrol penuh atas koneksi, timeout, dan *interceptors*. |
| **Offline** | Service Worker + IndexedDB | SQLite / Isar / Hive | Database lokal yang robust untuk menyimpan ribuan data transaksi offline. |
| **Web Support** | Native (Sangat Baik) | Canvas/WASM (Cukup Baik) | Flutter Web ideal untuk aplikasi bisnis (SPA), meski load awal sedikit lebih berat dari React. |

---

## 2. Rekomendasi Tech Stack (Flutter Ecosystem)

Untuk memastikan kompatibilitas maksimal dengan backend **Frappe Framework**, berikut adalah library yang disarankan:

| Kategori | Library | Alasan Pemilihan |
| :--- | :--- | :--- |
| **HTTP Client** | `dio` + `dio_cookie_manager` | **Krusial**. Frappe menggunakan Cookie (`sid`) untuk autentikasi. Dio menangani cookie jar secara otomatis, mirip browser. |
| **State Management** | `flutter_riverpod` | Modern, aman, testable, dan memisahkan *business logic* dari UI dengan sangat baik. |
| **Local DB (Offline)** | `isar` atau `hive` | NoSQL database yang sangat cepat. Cocok untuk menyimpan data JSON dari API Frappe. |
| **GPS / Lokasi** | `geolocator` | Standar industri untuk akurasi lokasi foreground. |
| **Background Service** | `flutter_background_service` | Untuk melacak posisi Sales meskipun aplikasi ditutup/layar mati. |
| **Peta** | `flutter_map` (OpenStreetMap) | Gratis, ringan, dan kompatibel dengan setup peta sebelumnya. Opsi lain: `google_maps_flutter` (Berbayar). |
| **Kamera/Foto** | `image_picker` & `flutter_image_compress` | Mengambil foto dan langsung mengompresi ukuran file sebelum diupload ke server untuk menghemat bandwidth. |
| **Navigasi** | `go_router` | Mendukung Deep Linking dan navigasi path URL (penting untuk versi Web). |

---

## 3. Rencana Tahapan Migrasi (Phased Approach)

Strategi ini memungkinkan pengembangan Flutter berjalan paralel tanpa mengganggu operasional aplikasi React yang sedang berjalan.

### Fase 1: Setup & Environment (Minggu 1)
*   [ ] Inisialisasi Project Flutter (Android, iOS, Web support).
*   [ ] Setup `flavors` (Development, Staging, Production) untuk memisahkan URL backend.
*   [ ] Setup arsitektur folder (Clean Architecture atau Feature-based).
*   [ ] Konfigurasi `dio` client dengan `cookie_jar` untuk menangani sesi Frappe.

### Fase 2: Autentikasi & Integrasi Dasar (Minggu 2)
*   [ ] Implementasi UI Login.
*   [ ] Integrasi API `pwa_login`.
*   [ ] Penanganan Error CSRF (Menggunakan Interceptor Dio untuk menyisipkan header `X-Frappe-CSRF-Token`).
*   [ ] Penyimpanan sesi pengguna aman (`flutter_secure_storage`).

### Fase 3: Fitur Inti - Sales Activity (Minggu 3-4)
*   [ ] **Dashboard UI**: Menampilkan ringkasan kunjungan.
*   [ ] **Visit List**: Menampilkan daftar rencana kunjungan (`get_sales_visit_plans`).
*   [ ] **Check-in Logic**:
    *   Validasi jarak GPS.
    *   Kirim API Check-in.
*   [ ] **Check-out Logic**:
    *   Ambil Foto bukti kunjungan.
    *   Kompresi foto.
    *   Kirim API Check-out (`submit_visit_update`).

### Fase 4: Kapabilitas Offline (Sync Engine) (Minggu 5)
*   [ ] Desain Schema Database Lokal (`isar`).
*   [ ] **Logic Sinkronisasi**:
    *   Saat online: Data langsung kirim ke server.
    *   Saat offline: Simpan ke `isar` -> Tandai `is_synced = false`.
    *   Background Worker: Cek koneksi berkala -> Upload data pending -> Update status sync.

### Fase 5: Background Tracking (Minggu 6)
*   [ ] Implementasi `flutter_background_service`.
*   [ ] Logika pengiriman koordinat GPS setiap X menit ke server (untuk fitur *Live Tracking* sales).
*   [ ] Optimasi baterai.

### Fase 6: Adaptasi Web & Admin Panel (Minggu 7)
*   [ ] Memastikan UI responsif (Layout berbeda untuk Mobile vs Web Desktop).
*   [ ] Testing fitur di browser (Chrome/Safari).
*   [ ] Build & Deploy versi Web ke Frappe Server (`www` folder).

### Fase 7: Testing & Deployment (Minggu 8)
*   [ ] UAT (User Acceptance Test) dengan tim Sales terpilih.
*   [ ] Build APK (Android) dan Distribusi via Firebase App Distribution (Beta).
*   [ ] Setup Apple Developer Account (untuk iOS).
*   [ ] Rilis Production.

---

## 4. Struktur Arsitektur Folder (Saran)

```text
lib/
├── main.dart
├── config/              # Konfigurasi Environment & Theme
├── core/                # Utilities, Constants, Network Client (Dio)
│   ├── network/
│   │   ├── api_client.dart
│   │   └── api_endpoints.dart
│   └── utils/
├── data/                # Layer Data
│   ├── models/          # Dart Models (from JSON)
│   ├── repositories/    # Logika komunikasi ke API atau DB Lokal
│   └── local/           # Konfigurasi Database Lokal (Isar/Hive)
├── domain/              # Business Logic (Opsional, jika menggunakan Clean Arch)
└── presentation/        # UI Layer
    ├── common_widgets/  # Widget yang dipakai ulang (Button, Input)
    ├── auth/            # Halaman Login
    ├── dashboard/       # Halaman Utama
    ├── visits/          # Fitur Kunjungan (List, Detail, Map)
    └── profile/         # Profil User
```

## 5. Catatan Khusus untuk Frappe Integration

1.  **Cookie Persistence**: Di Mobile App, cookie tidak otomatis tersimpan saat aplikasi dimatikan (tidak seperti browser). Kita wajib menggunakan `PersistCookieJar` agar user tidak perlu login ulang setiap membuka aplikasi.
2.  **CSRF Token**: Frappe sangat ketat soal CSRF pada metode POST/PUT. Pastikan setiap respon dari GET request yang mengandung cookie juga menyimpan CSRF token (biasanya ada di header atau body HTML), lalu kirim balik di header `X-Frappe-CSRF-Token`.
3.  **Image Upload**: Frappe mengharapkan `multipart/form-data`. Di Flutter menggunakan `FormData.fromMap` dengan `MultipartFile`.

---

**Disiapkan oleh:** Gemini AI Agent
**Tanggal:** 04 Februari 2026
