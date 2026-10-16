/* ==========================================================================
   Halaman: Kiosk
   Layar sentuh di lokasi. Tiga tombol besar, satu pertanyaan prioritas,
   lalu nomor keluar dan layar kembali sendiri ke awal.
   ========================================================================== */
(function (G) {
  var ui = G.ui;

  G.views = G.views || {};
  G.views.kiosk = {
    mount: function (el) {
      var cfg = G.config;
      var picked = null;
      var countdown = null;
      var tick = null;

      el.innerHTML =
        '<div class="wrap kiosk-frame">' +
          '<p>Tampilan layar kiosk, misalnya tablet 10 inci di dekat pintu masuk.</p>' +
          '<div class="kiosk" id="kiosk"></div>' +
        '</div>';
      var box = el.querySelector("#kiosk");

      function head() {
        return '<div class="kiosk__head"><span>' + ui.esc(cfg.clinic.name) + '</span><span id="kclock">' + ui.clock() + '</span></div>';
      }

      function stopTimer() { clearInterval(countdown); countdown = null; }

      function home() {
        stopTimer();
        picked = null;
        box.innerHTML = head() +
          '<h1>Selamat datang. Sentuh salah satu tombol.</h1>' +
          '<div class="kiosk__list">' +
            cfg.services.filter(function (s) { return s.kiosk; }).map(function (s) {
              return '<button type="button" class="kbtn" data-service="' + s.id + '">' +
                '<span class="kbtn__chip" aria-hidden="true">' + s.prefix + '</span><span>' + s.label + '</span></button>';
            }).join("") +
          '</div>';
      }

      function priority() {
        var sv = G.queue.service(picked);
        box.innerHTML = head() +
          '<h1>' + sv.label + '. Apakah Bapak atau Ibu berumur 60 tahun ke atas, sedang hamil, atau berkebutuhan khusus?</h1>' +
          '<div class="kiosk__list">' +
            '<button type="button" class="kbtn" data-prio="yes"><span class="kbtn__chip" aria-hidden="true">' + ui.icon("check") + '</span><span>Ya, jalur prioritas</span></button>' +
            '<button type="button" class="kbtn kbtn--alt" data-prio="no"><span class="kbtn__chip" aria-hidden="true">' + ui.icon("next") + '</span><span>Tidak</span></button>' +
            '<button type="button" class="btn btn--ghost" data-act="home">' + ui.icon("back") + 'Kembali</button>' +
          '</div>';
      }

      function ticket(t) {
        var left = cfg.kioskResetSeconds;
        box.innerHTML = head() +
          '<div class="kiosk__done">' +
            '<h1>Ambil kertas nomor Anda</h1>' +
            ui.ticketHTML(t, G.state.get()) +
            '<p>Silakan duduk. Layar ruang tunggu akan memanggil nomor Anda.</p>' +
            '<button type="button" class="btn btn--ghost" data-act="home">Selesai (<span id="kleft">' + left + '</span>)</button>' +
          '</div>';
        stopTimer();
        countdown = setInterval(function () {
          left -= 1;
          var n = el.querySelector("#kleft");
          if (n) n.textContent = left;
          if (left <= 0) home();
        }, 1000);
      }

      box.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        if (b.dataset.service) { picked = b.dataset.service; return priority(); }
        if (b.dataset.prio) {
          var t = G.queue.create({ service: picked, name: "Pasien kiosk", via: "kiosk", priority: b.dataset.prio === "yes" });
          return ticket(t);
        }
        if (b.dataset.act === "home") home();
      });

      home();
      tick = setInterval(function () {
        var c = el.querySelector("#kclock");
        if (c) c.textContent = ui.clock();
      }, 20000);

      return function () { stopTimer(); clearInterval(tick); };
    }
  };

  G.router.register("kiosk", G.views.kiosk);
})(window.Giliran = window.Giliran || {});
