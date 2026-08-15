# SIMONA — Sistem Monitoring ArAp
**PT New Ratna Motor**

Aplikasi monitoring dokumen AR (Account Receivable) & AP (Account Payable), dengan alur validasi, laporan SLA/DSO/DPO, manajemen user, dan sinkronisasi ke Google Sheets + Google Drive.

---

## 1. Cara Menjalankan

SIMONA adalah aplikasi web statis (HTML/CSS/JS murni, tanpa server backend sendiri). **Wajib dibuka lewat alamat `http://` atau `https://`** (bukan diklik dua kali dari folder/`file://`), karena beberapa fitur (sinkronisasi Sheets, upload ke Drive) memerlukan itu agar tidak terkena blokir keamanan browser.

### Opsi hosting gratis & cepat
- **Netlify Drop** — buka [app.netlify.com/drop](https://app.netlify.com/drop), seret folder `simona/` ke sana → langsung dapat alamat `https://....netlify.app`
- **GitHub Pages** — upload folder ini ke repo GitHub → aktifkan Pages di Settings → Pages
- **Server internal kantor** — upload folder `simona/` ke web server PT New Ratna Motor via FTP/cPanel/dsb

### Menjalankan secara lokal (untuk uji coba/development)
```bash
cd simona
python3 -m http.server 8080
# lalu buka http://localhost:8080 di browser
```

---

## 2. Struktur Folder

```
simona/
├── index.html                      ← halaman utama, memuat semua file JS di bawah
├── Code.gs                         ← kode backend Google Apps Script (deploy terpisah, lihat §4)
├── css/
│   └── styles.css                  ← styling custom (di luar Tailwind CDN)
└── js/
    ├── constants.js                 ← daftar departemen, status, sumber dana, warna badge, dll
    ├── seed-data.js                 ← data contoh (seed) saat pertama kali dibuka
    ├── state.js                     ← state global aplikasi + fungsi simpan/muat ke penyimpanan lokal
    ├── storage.js                   ← penyimpanan file lampiran per dokumen
    ├── sync-sheets.js                ← semua logika sinkronisasi Google Sheets/Drive + auto-sync
    ├── helpers.js                    ← perhitungan SLA per tahap status
    ├── excel-io.js                   ← export/import Excel
    ├── event-bindings.js             ← "lem" yang menyambungkan klik tombol ↔ fungsi
    ├── pages/
    │   ├── login.js                  ← halaman login
    │   ├── shell.js                  ← sidebar + header (kerangka setelah login)
    │   ├── dashboard.js               ← halaman Dashboard
    │   ├── documents-list.js          ← halaman Daftar Dokumen
    │   ├── document-detail.js         ← halaman Detail Dokumen
    │   ├── reports.js                 ← halaman Laporan (AR/AP, SLA, DSO/DPO)
    │   ├── users.js                   ← halaman Manajemen User
    │   └── sync-page.js               ← halaman Sinkronisasi Sheets
    ├── components/
    │   └── document-modal.js          ← form pop-up Tambah/Ubah Dokumen
    └── app.js                         ← penggerak utama (dimuat PALING TERAKHIR)
```

Lihat **MAINTENANCE.md** untuk penjelasan lebih dalam tentang cara kerja tiap bagian dan cara aman menambah fitur.

---

## 3. Login & Peran (Role)

Halaman login punya dropdown **"Login cepat sebagai (demo)"** untuk mencoba berbagai peran:
- **Super User** — akses & hak penuh ke semua divisi
- **Admin** — akses semua divisi, hak ubah status/disburse bisa diatur per user
- **Staff** — dibatasi ke satu divisi ("Related Dept"), hak ubah status/disburse bisa diatur per user

Kelola daftar user di menu **Manajemen User**.

---

## 4. Mengaktifkan Sinkronisasi Google Sheets & Drive

1. Buat Google Sheet baru → **Extensions → Apps Script**.
2. Hapus kode default, tempel seluruh isi `Code.gs`, simpan.
3. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Saat diminta otorisasi (karena Code.gs juga akses Google Drive), ikuti sampai selesai (Advanced → Go to [nama project] (unsafe) → Allow).
5. Salin **Web app URL** yang dihasilkan (format `.../exec`).
6. Buka menu **Sinkronisasi Sheets** di SIMONA → tempel URL → **Simpan**.
7. Klik **Tes Koneksi** untuk memastikan berhasil.

Setelah tersambung, **Sinkronisasi Otomatis** aktif secara default:
- Perubahan lokal (tambah/ubah/hapus dokumen atau user) otomatis di-push ke Sheets ±2.5 detik setelah perubahan.
- Data dari Sheets ditarik otomatis setiap 45 detik, termasuk mendeteksi & menghapus data yang sudah dihapus di Sheets.
- Bisa dimatikan lewat toggle di halaman Sinkronisasi Sheets kalau tidak diinginkan.

File dokumen yang diupload di form Pengajuan AR/AP maupun halaman Detail otomatis tersimpan ke Google Drive dengan struktur folder:
```
SIMONA - New Ratna Motor / AR atau AP / {Tahun} / {Bulan} / {ID Dokumen}_{nama file}
```

**Setiap kali `Code.gs` diperbarui**, wajib buat **deployment baru**: Deploy → Manage deployments → ikon pensil → Version: **New version** → Deploy.

---

## 5. Bantuan Lebih Lanjut

Untuk penjelasan arsitektur, cara menambah menu/field baru, dan panduan debugging, lihat **MAINTENANCE.md**.
