/* ==========================================================================
   Giliran: pengaturan
   Ganti nama tempat, layanan, dan loket di sini tanpa menyentuh file lain.
   ========================================================================== */
(function (G) {
  G.config = {
    clinic: {
      name: "Puskesmas Contoh Sukamaju",
      hours: "Senin sampai Sabtu, 07.30 sampai 13.00"
    },

    // prefix = huruf di depan nomor antrian. avgMin = lama layanan rata-rata (menit).
    // kiosk: true = muncul sebagai tombol di layar kiosk.
    services: [
      { id: "umum",    label: "Berobat umum",  hint: "Sakit, batuk, pusing, dan keluhan lain",  prefix: "A", avgMin: 8,  kiosk: true },
      { id: "kontrol", label: "Kontrol rutin", hint: "Tensi, gula darah, penyakit lama",         prefix: "B", avgMin: 6,  kiosk: true },
      { id: "obat",    label: "Ambil obat",    hint: "Menebus resep dari dokter",                prefix: "C", avgMin: 4,  kiosk: true },
      { id: "kia",     label: "Ibu dan anak",  hint: "Periksa kehamilan, imunisasi, balita",     prefix: "D", avgMin: 10 },
      { id: "gigi",    label: "Gigi",          hint: "Sakit gigi, cabut, tambal",                prefix: "E", avgMin: 12 }
    ],

    counters: [
      { id: 1, name: "Loket 1" },
      { id: 2, name: "Loket 2" }
    ],

    // Siapa yang dipanggil lebih dulu
    priorityReasons: [
      { id: "lansia",      label: "Umur 60 tahun ke atas" },
      { id: "hamil",       label: "Sedang hamil" },
      { id: "disabilitas", label: "Penyandang disabilitas" }
    ],

    kioskResetSeconds: 12,

    // Nama jalur masuk, dipakai di panel petugas
    channels: { web: "Layar", wa: "WhatsApp", kiosk: "Kiosk", loket: "Loket" }
  };
})(window.Giliran = window.Giliran || {});
