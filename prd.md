# HOSPITALK: Detail Arsitektur (User Flow & Database Schema)

Dokumen ini merinci alur interaksi pengguna (User Flow) dan skema database untuk sistem HOSPITALK berdasarkan PRD versi 1.0.

## 0. Tech Stack (Tumpukan Teknologi)
Sesuai dengan kebutuhan proyek, HOSPITALK akan menggunakan stack teknologi sebagai berikut:
- **Frontend:** Next.js (Khusus UI & Server-Side Rendering)
- **Backend:** Golang (Microservices untuk pemrosesan berat, integrasi LLM, & logika bisnis spesifik)
- **Database & Auth:** Supabase (PostgreSQL untuk relasional & JSONB, serta manajemen Auth)
- **AI & Computer Vision:** TensorFlow.js dan MediaPipe (Pemrosesan pengenalan bahasa isyarat secara *real-time* di *client-side* / Edge)

---

## 0.1. Panduan Desain UI/UX

### Palet Warna
Antarmuka HOSPITALK menggunakan nuansa **Biru dan Putih** sebagai identitas visual utama, mencerminkan kesan profesional, bersih, dan terpercaya dalam konteks medis.

| Token | Kode Warna | Penggunaan |
| :--- | :--- | :--- |
| `--primary` | `#1565C0` (Biru Tua) | Header, tombol utama (CTA), elemen navigasi aktif |
| `--primary-light` | `#42A5F5` (Biru Muda) | Highlight, badge status, ikon aktif |
| `--primary-dark` | `#0D47A1` (Biru Gelap) | Hover state tombol, sidebar aktif |
| `--background` | `#FFFFFF` (Putih) | Latar belakang utama halaman |
| `--surface` | `#F5F9FF` (Putih Kebiruan) | Card, panel, area konten sekunder |
| `--text-primary` | `#1A1A2E` (Hitam Gelap) | Teks utama / body |
| `--text-secondary` | `#5F6368` (Abu-abu) | Teks pendukung, label, placeholder |
| `--accent-success` | `#2E7D32` (Hijau) | Status aktif, indikator sukses |
| `--accent-warning` | `#F57C00` (Oranye) | Peringatan, confidence score rendah |
| `--accent-danger` | `#C62828` (Merah) | Error, status kritis |

### Prinsip Desain
- **Clean & Minimalis:** Antarmuka bersih dengan *whitespace* yang cukup agar mudah dipahami oleh tenaga medis dalam kondisi sibuk.
- **Aksesibilitas Tinggi (WCAG 2.1 AA):** Kontras warna tinggi, ukuran font besar (minimum 16px body, 24px heading), dan area sentuh (*touch target*) minimum 48x48px untuk penggunaan di tablet.
- **Konsistensi Visual:** Komponen UI (tombol, card, form) menggunakan *border-radius* seragam, *spacing* berbasis kelipatan 4px/8px, dan *shadow* halus untuk kedalaman.

### Aset Visual
> ⚠️ **LARANGAN:** Seluruh aset visual (ikon, ilustrasi, gambar) yang digunakan dalam antarmuka HOSPITALK **TIDAK BOLEH** menggunakan hasil *generate* AI (seperti DALL-E, Midjourney, Stable Diffusion, dll). Semua aset harus berasal dari:
> - Pustaka ikon berkualitas tinggi (contoh: Lucide Icons, Heroicons, Phosphor Icons).
> - Ilustrasi manual / hand-crafted yang dibuat oleh desainer, atau pustaka ilustrasi berlisensi (contoh: unDraw, Storyset).
> - Foto stok berlisensi dari penyedia resmi jika diperlukan.

---

## 1. User Flow (Alur Pengguna)

Berikut adalah alur penggunaan sistem dari sudut pandang berbagai *user persona*.

### A. Flow Inisiasi Sesi Konsultasi (Perawat / Resepsionis)
1. **Login:** Perawat/Admin login ke dalam dashboard HOSPITALK di tablet atau komputer.
2. **Identifikasi Pasien:** Perawat memasukkan ID Pasien atau memindai barcode gelang pasien.
3. **Pembuatan Sesi:** Sistem memverifikasi data pasien (terhubung dengan *Electronic Medical Record* - EMR jika ada) dan membuat sesi konsultasi baru.
4. **Persiapan Perangkat:** Perawat mengarahkan tablet/mobile cart ke pasien, memastikan kamera dapat menangkap postur dan gerakan tangan pasien dengan jelas.

### B. Flow Konsultasi Medis (Pasien Disabilitas & Dokter)
1. **Mode Komunikasi Aktif:** Layar tablet menampilkan antarmuka terbagi (*split screen* atau *dual-tab*) — satu sisi untuk melihat teks dari dokter, sisi lain menampilkan tangkapan kamera pasien untuk verifikasi isyarat.
2. **Pasien Menggunakan Bahasa Isyarat (Sign-to-Text):**
   - Pasien menggerakkan tangan menggunakan BISINDO/SIBI.
   - Kamera menangkap gerakan pada 30fps.
   - Model AI berbasis **TensorFlow.js dan MediaPipe** memproses frame secara *real-time* langsung di browser perangkat (*Client-side* / Edge Computing) untuk menjamin latensi super rendah (< 200ms) dan privasi data.
   - Teks hasil terjemahan isyarat muncul di layar dan dapat dibaca oleh dokter.
3. **Dokter Berbicara (Speech-to-Text):**
   - Dokter berbicara menjelaskan diagnosis atau memberikan pertanyaan.
   - Mikrofon menangkap suara dokter.
   - Layanan Speech-to-Text memproses suara menjadi teks.
   - Teks ditampilkan di layar pasien dengan font yang besar dan kontras tinggi (sesuai standar WCAG).
4. **Koreksi Manual (Fallback):** Jika AI salah menerjemahkan isyarat pasien, pasien dapat mengetik koreksi melalui keyboard virtual di tablet.

### C. Flow Pasca-Konsultasi & Dokumentasi
1. **Akhiri Sesi:** Dokter menekan tombol "Selesai" pada dashboard/tablet.
2. **Review Transkrip:** Sistem menampilkan seluruh log percakapan (transkrip komunikasi dua arah) selama sesi.
3. **Konfirmasi & Simpan:** Dokter dapat mengedit transkrip jika ada istilah medis yang kurang tepat, lalu menyimpannya.
4. **Integrasi EMR:** Transkrip percakapan yang sudah divalidasi dikirimkan ke database utama atau sistem EMR rumah sakit sebagai lampiran rekam medis pasien.

---

## 2. Skema Database

Sistem HOSPITALK menggunakan **Supabase (PostgreSQL)** sebagai database utama. Data operasional yang terstruktur disimpan dalam tabel relasional, sedangkan data log transkrip percakapan yang dinamis disimpan secara efisien menggunakan tipe data `JSONB`.

### A. Tabel Relasional
Digunakan untuk manajemen *user*, *patient*, dan relasi *session*.

#### Tabel: `users` (Tenaga Medis & Admin)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identifier unik untuk staf |
| `name` | VARCHAR | Nama lengkap |
| `role` | VARCHAR | `doctor`, `nurse`, `admin` |
| `email` | VARCHAR | Email untuk login |
| `password_hash`| VARCHAR | Hash kata sandi |
| `created_at` | TIMESTAMP | Waktu pembuatan akun |

#### Tabel: `patients` (Data Pasien)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identifier unik pasien |
| `medical_record_id`| VARCHAR (Unique)| Nomor Rekam Medis (terintegrasi RS) |
| `name` | VARCHAR | Nama lengkap pasien |
| `disability_type` | VARCHAR | `deaf`, `mute`, `both` |
| `dob` | DATE | Tanggal lahir |

#### Tabel: `sessions` (Sesi Konsultasi)
| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Identifier sesi |
| `patient_id` | UUID (FK) | Relasi ke tabel `patients` |
| `doctor_id` | UUID (FK) | Relasi ke tabel `users` |
| `start_time` | TIMESTAMP | Waktu mulai sesi |
| `end_time` | TIMESTAMP | Waktu selesai sesi |
| `status` | VARCHAR | `active`, `completed`, `cancelled` |

### B. Penyimpanan JSONB (Log Transkrip)
Digunakan untuk menyimpan log transkrip percakapan *real-time* menggunakan kolom tipe data `JSONB` di PostgreSQL/Supabase. Format dokumen JSON sangat cocok untuk teks yang dinamis dan bervariasi panjangnya.

#### Tabel: `transcripts`
Setiap *row* merepresentasikan satu sesi, dengan kolom `messages` bertipe `JSONB` yang berisi *array of messages*.

```json
{
  "id": "UUID (PK)",
  "session_id": "UUID (FK ke tabel sessions)",
  "patient_id": "UUID",
  "doctor_id": "UUID",
  "date": "ISODate",
  "messages": [
    {
      "message_id": "UUID",
      "timestamp": "ISODate",
      "sender_type": "patient", 
      "input_method": "sign_language", // sign_language, keyboard
      "content": "Sakit di bagian dada sebelah kiri.",
      "ai_confidence_score": 0.92, // Kepercayaan AI saat transkripsi
      "is_edited": false
    },
    {
      "message_id": "UUID",
      "timestamp": "ISODate",
      "sender_type": "doctor",
      "input_method": "speech_to_text",
      "content": "Kapan rasa sakitnya mulai muncul?",
      "ai_confidence_score": 0.98,
      "is_edited": false
    }
  ],
  "summary": "Pasien mengeluhkan sakit dada sebelah kiri. Direkomendasikan untuk EKG.", // Ringkasan opsional yang bisa di-generate NLP
  "synced_to_emr": true
}
```

---

## 3. Strategi Sinkronisasi & Keamanan
- **Data Privacy & Compliance:** Data sensitif pada tabel `patients` dan isi percakapan pada `transcripts` wajib dienkripsi (AES-256) baik saat istirahat (*at rest*) maupun dalam perjalanan (*in transit*) agar memenuhi standar privasi medis (HIPAA/UU PDP).
- **Offline-First & Sinkronisasi:** Karena mengandalkan *local edge-processing* untuk mengatasi koneksi internet tidak stabil, setiap *message* akan disimpan secara lokal di tablet (menggunakan pustaka seperti WatermelonDB yang ramah terhadap arsitektur SQL) lalu di-sinkronisasikan ke database Supabase secara berkala di latar belakang (background sync).

---

## 4. Fitur Peningkatan & Integrasi Lanjutan (Enhancements)
Untuk meningkatkan fungsionalitas dan keamanan standar medis, sistem HOSPITALK juga mencakup fitur-fitur berikut:

1. **Ringkasan Medis Otomatis (Format SOAP via LLM)**
   Transkrip percakapan yang panjang akan diproses oleh *Backend Golang* menggunakan layanan LLM (seperti Gemini/OpenAI) untuk menghasilkan ringkasan otomatis dengan format medis standar **SOAP** *(Subjective, Objective, Assessment, Plan)*. Hal ini mempercepat alur kerja dokumentasi bagi dokter.

2. **Audit Trail (Log Aktivitas Keamanan)**
   Setiap aksi akses, modifikasi, atau pengunduhan data pasien akan dicatat secara ketat dalam tabel `audit_logs` terpisah. Ini menjamin transparansi tinggi dan pemenuhan standar kepatuhan medis (HIPAA/UU PDP).

3. **Supabase Row Level Security (RLS)**
   Penerapan aturan akses berbasis peran (*Role-Based Access Control*) dienkapsulasi langsung di level database Supabase:
   - **Perawat** dapat membuat sesi baru tetapi tidak dapat melihat riwayat transkrip dari pasien yang tidak ditanganinya.
   - **Dokter** hanya diberikan hak akses (baca/tulis) pada transkrip sesi yang dikelolanya.

4. **Penyimpanan Fallback Media (Supabase Storage)**
   Apabila *confidence score* model AI isyarat berada di bawah ambang batas (misal < 70%), sistem otomatis mengunggah potongan video singkat (1-3 detik) ke Supabase Storage. Rekaman ini berfungsi sebagai referensi visual bagi dokter dan (dengan *consent* pasien) sebagai data untuk melatih ulang (*retrain*) model Edge AI.

5. **Dasbor Monitoring Perangkat Real-Time**
   Memanfaatkan *Supabase Realtime*, sistem menyediakan antarmuka dasbor bagi Administrator IT / Kepala Perawat untuk memantau status tablet yang tersebar (koneksi aktif, sisa baterai, status sesi) secara langsung tanpa perlu menyegarkan (*refresh*) halaman.
