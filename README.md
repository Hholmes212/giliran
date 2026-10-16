# Giliran

Prototipe sistem antrian pendaftaran berobat yang dirancang agar mudah dipakai
lansia dan orang yang belum terbiasa dengan teknologi.

Banyak aplikasi antrian dibuat untuk orang yang sudah lancar memakai HP, padahal
yang paling butuh antrian yang jelas justru lansia. Giliran mencoba sebaliknya:
beberapa jalan masuk yang berbeda, semuanya menuju satu antrian yang sama.

## Fitur

| Halaman | Untuk siapa | Isinya |
| --- | --- | --- |
| Daftar | Pasien dan keluarga | Empat langkah, satu pertanyaan per layar, nomor antrian dengan perkiraan waktu tunggu |
| WhatsApp | Lansia yang sudah memakai WhatsApp | Simulasi percakapan: kirim `DAFTAR`, balas dengan angka |
| Kiosk | Pasien yang datang tanpa HP | Tiga tombol besar, layar kembali sendiri setelah nomor keluar |
| Petugas | Petugas pendaftaran | Panggil berikutnya, panggil ulang, lewati, selesai, dan daftar pasien yang datang langsung |
| Ruang tunggu | Semua yang menunggu | Nomor besar, nada dan suara panggilan, tanpa nama pasien |

Pengaturan di bilah atas: ukuran huruf (tiga tingkat), kontras tinggi, dan suara.
Tema terang dan gelap mengikuti pengaturan perangkat.

Aturan antrian: jalur prioritas (60 tahun ke atas, ibu hamil, penyandang
disabilitas) selalu dipanggil lebih dulu, lalu berdasarkan urutan datang.

## Cara menjalankan

Tidak perlu instalasi apa pun.

1. Unduh atau `git clone` folder ini.
2. Buka `index.html` dengan browser (klik dua kali).

Untuk mencoba panel petugas dan layar ruang tunggu bersamaan, buka dua tab:
data tersinkron antar tab, dan layar ruang tunggu ikut berbunyi saat petugas memanggil.

## Memasang di GitHub Pages

1. Buat repositori baru di GitHub, lalu unggah seluruh isi folder ini.
2. Buka **Settings** lalu **Pages**.
3. Pada **Source**, pilih **Deploy from a branch**, cabang `main`, folder `/ (root)`.
4. Tunggu satu dua menit. Alamat situs muncul di halaman yang sama.

## Struktur folder

```
giliran/
├── index.html            Kerangka halaman, memuat semua CSS dan JS
├── css/
│   ├── tokens.css        Warna, huruf, ukuran dasar (tema terang, gelap, kontras tinggi)
│   ├── base.css          Reset, tipografi, tombol, bilah atas, kaki halaman
│   ├── components.css    Kertas nomor, pilihan besar, isian, label, progres
│   └── views.css         Gaya khusus tiap halaman
└── js/
    ├── config.js         Nama tempat, layanan, loket, alasan prioritas
    ├── state.js          Penyimpanan data (localStorage) dan sinkron antar tab
    ├── queue.js          Aturan antrian: nomor, urutan, panggilan, perkiraan waktu
    ├── speech.js         Suara: bacaan nomor dalam bahasa Indonesia dan nada panggilan
    ├── ui.js             Ikon, pengaman teks, notifikasi, kertas nomor
    ├── router.js         Perpindahan halaman lewat hash (#daftar, #kiosk, ...)
    ├── app.js            Titik awal: pengaturan tampilan, lalu menjalankan halaman
    └── views/
        ├── home.js       Beranda
        ├── register.js   Daftar (empat langkah)
        ├── whatsapp.js   Simulasi WhatsApp
        ├── kiosk.js      Kiosk
        ├── staff.js      Panel petugas
        └── display.js    Layar ruang tunggu
```

Urutan `<script>` di `index.html` penting: `config`, `state`, `queue`, `speech`, `ui`,
`router`, semua `views`, dan terakhir `app`.

## Menyesuaikan

- **Nama puskesmas, layanan, loket**: ubah `js/config.js`.
- **Warna dan huruf**: ubah `css/tokens.css`.
- **Aturan antrian** (misalnya prioritas, cara menghitung estimasi): ubah `js/queue.js`.

## Yang belum ada (batas prototipe)

Prototipe ini berjalan sepenuhnya di browser. Beberapa hal sengaja masih simulasi:

- Data antrian tersimpan di browser, bukan di server. Dua perangkat berbeda belum
  berbagi antrian.
- Percakapan WhatsApp adalah simulasi. Versi sungguhan memakai WhatsApp Business API.
- Tombol "Isi dari KTP" hanya mengisi contoh. Versi sungguhan membaca KTP lewat kamera.
- Pemberitahuan ke HP keluarga belum terkirim sungguhan.
- Nama dan nomor di halaman adalah data contoh. Jangan memasukkan data pasien asli.

## Langkah berikutnya

1. Server dan database supaya antrian dipakai bersama banyak perangkat.
2. Integrasi WhatsApp Business API dan pengingat saat tiga giliran lagi.
3. Pembaca KTP atau kartu BPJS lewat kamera.
4. Perlindungan data pribadi: persetujuan penggunaan data, enkripsi, dan masa simpan.
5. Uji langsung dengan lansia di satu puskesmas, lalu perbaiki dari pengamatan itu.

## Lisensi

MIT. Lihat berkas `LICENSE`.
