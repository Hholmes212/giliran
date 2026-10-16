/* ==========================================================================
   Halaman: Beranda
   ========================================================================== */
(function (G) {
  var CHANNELS = [
    ["daftar",   "Di layar ini",       "Pilih layanan, tulis nama, ambil nomor. Satu pertanyaan di setiap layar.", "Untuk pasien dan keluarga"],
    ["whatsapp", "Lewat WhatsApp",     "Kirim kata DAFTAR, lalu balas dengan angka. Tanpa aplikasi baru.",           "Untuk lansia yang sudah memakai WhatsApp"],
    ["kiosk",    "Kiosk di lokasi",    "Layar sentuh dengan tombol besar. Kembali sendiri setelah nomor keluar.",    "Untuk yang datang tanpa HP"],
    ["petugas",  "Petugas loket",      "Memanggil, melewati, menyelesaikan. Pasien yang datang langsung didaftarkan dengan form singkat.", "Untuk petugas pendaftaran"],
    ["layar",    "Layar ruang tunggu", "Nomor besar dan suara panggilan. Nama pasien tidak ditampilkan.",             "Untuk semua yang menunggu"]
  ];

  var PRINCIPLES = [
    ["Satu langkah di setiap layar", "Tidak ada menu bertumpuk. Setiap layar hanya bertanya satu hal, dan tombol Kembali selalu ada."],
    ["Huruf besar, kontras jelas", "Ukuran huruf dan kontras bisa diubah dari bilah di atas. Semua tombol cukup besar untuk jari yang kurang stabil."],
    ["Dibacakan dengan suara", "Nomor antrian bisa dibacakan, dan pemanggilan di ruang tunggu memakai nada dan suara."],
    ["Prioritas tanpa harus meminta", "Pertanyaan umur dan kehamilan sudah ada di alur. Lansia, ibu hamil, dan penyandang disabilitas dipanggil lebih dulu."]
  ];

  // Urutan layar contoh di kertas nomor. Hanya ilustrasi, bukan data antrian.
  var DEMO = [
    { left: 3, now: "A-021" },
    { left: 2, now: "A-022" },
    { left: 1, now: "A-023" },
    { left: 0, now: "A-024" }
  ];

  G.views = G.views || {};
  G.views.home = {
    mount: function (el) {
      var clinic = G.ui.esc(G.config.clinic.name);

      el.innerHTML =
        '<section class="hero wrap" aria-labelledby="judul">' +
          '<div class="hero__text">' +
            '<h1 id="judul">Daftar berobat tanpa bingung.</h1>' +
            '<p class="lead">Giliran membantu bapak, ibu, dan keluarga mendapat nomor antrian lewat layar, WhatsApp, atau petugas. Satu langkah di setiap layar, huruf besar, dan bisa dibacakan.</p>' +
            '<div class="hero__actions">' +
              '<a class="btn btn--ticket btn--xl" href="#daftar">Ambil nomor antrian</a>' +
              '<a class="btn btn--ghost btn--xl" href="#whatsapp">Coba lewat WhatsApp</a>' +
            '</div>' +
            '<p class="hero__note">Ini prototipe. Nama dan nomor di halaman ini hanya contoh.</p>' +
          '</div>' +
          '<figure class="hero__ticket" style="margin:0">' +
            '<div aria-hidden="true">' +
              '<div class="ticket-wrap"><div class="ticket" id="demoTicket">' +
                '<div class="ticket__top">' +
                  '<span class="ticket__clinic">' + clinic + '</span>' +
                  '<span class="ticket__label">Nomor antrian</span>' +
                  '<strong class="ticket__no">A-024</strong>' +
                  '<span class="ticket__svc">Berobat umum</span>' +
                '</div>' +
                '<div class="ticket__stub"><strong class="ticket__status" id="demoStatus">3 orang di depan Anda</strong>' +
                '<span class="ticket__sub" id="demoSub">Sekarang dipanggil: A-021</span></div>' +
              '</div></div>' +
            '</div>' +
            '<figcaption>Contoh kertas nomor. Pasien cukup duduk, layar memberi tahu saat giliran tiba.</figcaption>' +
          '</figure>' +
        '</section>' +

        '<section class="section wrap" aria-labelledby="jalur">' +
          '<div class="section__head"><h2 id="jalur">Lima jalan masuk, satu antrian yang sama</h2>' +
          '<p>Tidak semua orang harus memakai aplikasi. Siapa pun yang mendaftar lewat jalur mana pun masuk ke antrian yang sama.</p></div>' +
          '<ul class="channels">' +
            CHANNELS.map(function (c) {
              return '<li><a href="#' + c[0] + '"><div><h3>' + c[1] + '</h3><small>' + c[3] + '</small></div><p>' + c[2] + '</p>' + G.ui.icon("next") + '</a></li>';
            }).join("") +
          '</ul>' +
        '</section>' +

        '<section class="section wrap" aria-labelledby="prinsip">' +
          '<div class="section__head"><h2 id="prinsip">Dibuat untuk yang jarang memakai teknologi</h2></div>' +
          '<dl class="principles">' +
            PRINCIPLES.map(function (p) { return '<div><dt>' + p[0] + '</dt><dd>' + p[1] + '</dd></div>'; }).join("") +
          '</dl>' +
        '</section>';

      /* Kertas nomor contoh berganti status setiap beberapa detik. */
      var ticket = el.querySelector("#demoTicket");
      var status = el.querySelector("#demoStatus");
      var sub = el.querySelector("#demoSub");
      var i = 0;
      var timer = setInterval(function () {
        i = (i + 1) % (DEMO.length + 1); // satu jeda ekstra di akhir
        var d = DEMO[Math.min(i, DEMO.length - 1)];
        if (i >= DEMO.length) return; // jeda: tetap di layar "giliran Anda"
        if (d.left === 0) {
          ticket.classList.add("is-go");
          status.textContent = "Giliran Anda! Ke Loket 2";
          sub.textContent = "Silakan masuk sekarang";
        } else {
          ticket.classList.remove("is-go");
          status.textContent = d.left + " orang di depan Anda";
          sub.textContent = "Sekarang dipanggil: " + d.now;
        }
      }, 2800);

      return function () { clearInterval(timer); };
    }
  };

  G.router.register("beranda", G.views.home);
})(window.Giliran = window.Giliran || {});
