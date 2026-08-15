# MAINTENANCE.md — Panduan Pengembangan SIMONA

Dokumen ini untuk siapa pun yang akan melanjutkan pengembangan SIMONA — baik developer internal, tim IT PT New Ratna Motor, atau AI assistant lain.

---

## 1. Filosofi Arsitektur

SIMONA **sengaja** dibuat tanpa proses build (tidak ada `npm install`, webpack, dsb). Semua file JS adalah **script global biasa** (bukan ES Module), dimuat lewat tag `<script src="...">` berurutan di `index.html`. Alasannya:
- Bisa langsung di-hosting di server statis apa pun tanpa proses compile
- Gampang dibuka & diedit siapa saja tanpa setup development environment
- Tidak butuh Node.js/npm untuk menjalankan (hanya untuk testing opsional)

**Konsekuensinya:** semua `const`, `let`, dan `function` di level atas file bersifat **global** — bisa dipakai file lain selama filenya dimuat lebih dulu (lihat §2). Tidak ada `import`/`export`.

---

## 2. Urutan Pemuatan Script (WAJIB DIPAHAMI)

Urutan di `index.html` **tidak sembarangan** — ini mengikuti aturan:

> Sebuah fungsi BOLEH memanggil sesuatu yang didefinisikan belakangan, ASALKAN definisinya sudah selesai dimuat sebelum fungsi itu benar-benar DIPANGGIL (bukan sebelum didefinisikan).

Karena hampir semua kode ada di dalam `function`, dan `function` baru benar-benar jalan saat dipanggil (biasanya lewat klik tombol, jauh setelah semua script selesai dimuat), urutan file JAUH lebih longgar daripada kelihatannya. Yang **wajib** diperhatikan:

1. **`js/constants.js` harus paling awal** — berisi `DEPARTMENTS`, `STATUS_LIST`, dll yang dipakai di mana-mana.
2. **`js/state.js` harus sebelum file lain yang memanggil `state.xxx` di level atas** (di luar function) — tapi hampir semua pemakaian `state` ada di dalam function, jadi ini jarang jadi masalah.
3. **`js/app.js` HARUS PALING TERAKHIR** — file ini berisi:
   - Fungsi `render()` (router utama)
   - Baris eksekusi langsung: `state.documents = seedDocuments(); render(); initStorage();`
   
   Baris-baris ini LANGSUNG JALAN begitu file dimuat (tidak dibungkus function), jadi semua fungsi yang dipanggilnya (`seedDocuments()`, `render()`, dll) harus SUDAH terdefinisi — makanya file ini wajib di posisi terakhir.

**Kalau menambah file JS baru**, taruh `<script src="...">`-nya di `index.html` SEBELUM `js/app.js`, di posisi mana pun setelah `constants.js`. Kalau ragu, taruh persis sebelum baris `<script src="js/app.js">`.

---

## 3. Peta File → Fungsi (untuk mencari kode dengan cepat)

| Ingin ubah... | Buka file... |
|---|---|
| Nama departemen, status dokumen, sumber dana (TAM/Affiliasi/dll) | `js/constants.js` |
| Data contoh yang muncul saat pertama kali dibuka | `js/seed-data.js` |
| Struktur data global aplikasi (`state`), cara simpan ke storage | `js/state.js` |
| Cara file lampiran disimpan lokal | `js/storage.js` |
| Apa pun soal Google Sheets/Drive (push, tarik, auto-sync) | `js/sync-sheets.js` |
| Perhitungan SLA per tahap status | `js/helpers.js` |
| Tampilan & logika halaman Login | `js/pages/login.js` |
| Sidebar kiri & header atas | `js/pages/shell.js` |
| Halaman Dashboard (scorecard, rencana bayar, aktivitas terbaru) | `js/pages/dashboard.js` |
| Tabel Daftar Dokumen & filter-filternya | `js/pages/documents-list.js` |
| Halaman Detail Dokumen (status, disburse, komentar, SLA) | `js/pages/document-detail.js` |
| Halaman Laporan (SLA/DSO/DPO, evaluasi disburse, dll) | `js/pages/reports.js` |
| Halaman Manajemen User & hak akses | `js/pages/users.js` |
| Halaman Sinkronisasi Sheets (tampilan) | `js/pages/sync-page.js` |
| Export ke Excel, import massal Excel | `js/excel-io.js` |
| Form pop-up Tambah/Ubah Dokumen | `js/components/document-modal.js` |
| **Semua event `onclick` tombol** (termasuk tombol Hapus, dsb) | `js/event-bindings.js` |
| Router utama & inisialisasi aplikasi | `js/app.js` |
| Backend Google Sheets/Drive | `Code.gs` (dideploy terpisah di Apps Script) |

---

## 4. Alur Data Penting

### 4.1 Render ulang halaman
Aplikasi ini **tidak** pakai framework (React/Vue/dst) — semua render lewat `innerHTML` manual:
```js
function render(){
  const app = document.getElementById('app');
  if(state.view==='login'){ app.innerHTML = renderLogin(); bindLogin(); return; }
  app.innerHTML = renderShell();
  bindShell();
}
```
`renderX()` = mengembalikan string HTML. `bindX()` = mencari elemen di DOM lalu memasang `onclick`/`onchange`. **Pola ini WAJIB diikuti** kalau menambah halaman baru: buat `renderNamaHalaman()` di file page terkait, panggil dari `bindShell()` di `shell.js`, lalu pasang event handler-nya di `bindPageEvents()` (`event-bindings.js`).

### 4.2 Penyimpanan lokal
Semua data (`state.documents`, `state.users`, dll) disimpan lewat `window.storage` (API bawaan Claude Artifacts). Fungsi `persistDocs()`/`persistUsers()` di `state.js` menangani ini, dan **otomatis memicu auto-push** ke Sheets kalau URL sudah diatur (lihat §4.3). Kalau memindah SIMONA ke luar Claude Artifacts (hosting sendiri), `window.storage` TIDAK tersedia — perlu diganti dengan `localStorage` atau backend sungguhan. Semua pemanggilan `window.storage` sudah dibungkus `try/catch` sehingga aplikasi tetap jalan (data hanya tidak tersimpan permanen) kalau API ini tidak ada.

### 4.3 Sinkronisasi otomatis (auto-sync)
Inti logikanya di `js/sync-sheets.js`:
- `scheduleAutoPush(kind)` — dipanggil otomatis dari `persistDocs()`/`persistUsers()`, men-debounce 2.5 detik lalu push ke Sheets.
- `startAutoSync()` / `stopAutoSync()` — mengatur `setInterval` tarik data tiap 45 detik (`AUTO_PULL_INTERVAL_MS`).
- `performPull()` — logika inti tarik+gabung+**deteksi hapus** (dipakai baik oleh tombol manual maupun auto-pull terjadwal).
- `deleteDocWithSync()` / `deleteUserWithSync()` — dipanggil saat user klik Hapus; menghapus lokal DAN mengirim permintaan hapus ke Sheets kalau data itu sebelumnya pernah tersinkron.
- `state.syncedDocIds` / `state.syncedUserIds` — daftar ID yang **diketahui pernah tersinkron ke Sheets**. Ini kunci dari deteksi hapus: kalau sebuah ID ada di daftar ini tapi TIDAK muncul lagi di hasil tarik dari Sheets, dianggap sudah dihapus di sana dan ikut dihapus lokal.

**Kalau menambah field baru ke dokumen/user** (misalnya field baru di form), jangan lupa update juga:
1. `Code.gs` — tambahkan ke `DOC_HEADERS`/`USER_HEADERS`
2. `js/sync-sheets.js` — fungsi `normalizeSheetDoc()`/`normalizeSheetUser()` (mapping saat tarik dari Sheets)
3. `js/components/document-modal.js` — field form + payload saat simpan

---

## 5. Cara Aman Menambah Fitur

### Menambah field baru ke dokumen (AR/AP)
1. Tambahkan default value di `js/seed-data.js` (fungsi `mk()`)
2. Tambahkan field di form: `js/components/document-modal.js`
3. Tambahkan ke payload saat simpan (juga di `document-modal.js`)
4. Kalau perlu tampil di tabel: `js/pages/documents-list.js`
5. Kalau perlu ikut tersinkron: update `Code.gs` (`DOC_HEADERS`) + `normalizeSheetDoc()` di `sync-sheets.js`

### Menambah menu/halaman baru
1. Buat file baru `js/pages/nama-halaman.js` berisi `function renderNamaHalaman(){ return `...html...`; }`
2. Tambahkan `<script src="js/pages/nama-halaman.js"></script>` di `index.html` (sebelum `app.js`)
3. Tambahkan item baru ke array `nav` di `js/pages/shell.js`
4. Tambahkan routing di `bindShell()` (`shell.js`): `if(state.view==='namahalaman') main.innerHTML = renderNamaHalaman();`
5. Kalau ada tombol/interaksi di halaman itu, pasang event handler-nya di `bindPageEvents()` (`js/event-bindings.js`)

### Menambah role atau hak akses baru
Lihat `hasDeptAccess()`, `canEditStatus()`, `canEditDisburse()` di `js/constants.js` — pola izinnya konsisten, tinggal ikuti pola yang sama untuk hak akses baru.

---

## 6. Testing Manual Sebelum Deploy

Karena tidak ada automated test suite, selalu cek manual sebelum publish perubahan:
1. Buka `index.html` lewat local server (`python3 -m http.server`) — **jangan** double-click file
2. Buka Console browser (F12) — pastikan tidak ada error merah saat load maupun saat klik-klik menu
3. Uji alur inti: Login → Dashboard → Daftar Dokumen (tambah/ubah/hapus) → Detail (ubah status & disburse) → Laporan → Manajemen User
4. Kalau ada perubahan di `Code.gs`, deploy versi baru (lihat README.md §4) dan uji Tes Koneksi + Push + Tarik dari halaman Sinkronisasi Sheets

---

## 7. Batasan yang Perlu Diketahui

- **Bukan aplikasi multi-user real-time.** Setiap user membuka SIMONA di browser masing-masing dengan data lokalnya sendiri; Google Sheets adalah titik temu bersama, tapi sinkronisasi punya jeda beberapa detik/menit, bukan instan seperti Google Docs.
- **Ukuran file upload dibatasi 4MB** (`MAX_FILE_BYTES` di `document-modal.js` dan `event-bindings.js`) agar aman di bawah batas penyimpanan.
- **`window.storage`** hanya tersedia saat SIMONA dijalankan di dalam Claude Artifacts. Untuk hosting mandiri jangka panjang, pertimbangkan mengganti dengan backend sungguhan (mis. yang sama dengan `Code.gs`/Sheets, dijadikan sumber data utama, bukan sekadar sinkronisasi).
