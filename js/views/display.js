/* ==========================================================================
   Halaman: Layar ruang tunggu
   Menampilkan nomor yang dipanggil di tiap loket. Nama pasien sengaja tidak
   ditampilkan demi privasi. Jika panel petugas dibuka di tab lain, layar ini
   ikut berubah dan membunyikan panggilan.
   ========================================================================== */
(function (G) {
  var ui = G.ui;

  G.views = G.views || {};
  G.views.display = {
    mount: function (el) {
      var cfg = G.config;
      var seen = {};      // callSeq terakhir yang sudah ditampilkan, per loket
      var unsub = null;
      var firstDraw = true;

      el.innerHTML =
        '<div class="wrap">' +
          '<section class="board" aria-label="Layar ruang tunggu">' +
            '<div class="board__head"><h1>Sedang dipanggil</h1><span class="board__clock" id="bclock" aria-hidden="true">' + ui.clock() + '</span></div>' +
            '<div class="board__main">' +
              '<div class="board__counters" id="bcounters"></div>' +
              '<div class="bnext"><h2>Berikutnya</h2><ol id="bnext"></ol></div>' +
            '</div>' +
            '<p class="board__foot">Lansia, ibu hamil, dan penyandang disabilitas dilayani lebih dulu. Jam layanan: ' + ui.esc(cfg.clinic.hours) + '.</p>' +
          '</section>' +
          '<div class="board-tools">' +
            '<button type="button" class="btn" data-act="demo">' + ui.icon("volume") + 'Panggil berikutnya (contoh)</button>' +
            '<button type="button" class="btn btn--ghost" data-act="full">Layar penuh</button>' +
            '<p>Tombol di atas hanya untuk mencoba. Di lokasi sungguhan, petugas memanggil dari panel petugas, dan layar ini ikut berubah. Buka panel petugas di tab lain untuk melihatnya.</p>' +
          '</div>' +
        '</div>';

      function draw(s, source) {
        var wrap = el.querySelector("#bcounters");
        wrap.innerHTML = s.counters.map(function (c) {
          return '<div class="bcounter" data-c="' + c.id + '"><h2>' + c.name + '</h2>' +
            '<div class="bcounter__no ' + (c.serving ? "" : "is-empty") + '">' + (c.serving || "Kosong") + '</div></div>';
        }).join("");

        // Kedipkan loket yang baru memanggil
        s.counters.forEach(function (c) {
          var changed = seen[c.id] !== undefined && seen[c.id] !== c.callSeq;
          if (changed && c.serving) {
            var box = wrap.querySelector('[data-c="' + c.id + '"]');
            if (box) box.classList.add("pulse");
            // Panggilan dari tab lain: bunyikan di sini. Panggilan dari tab ini sudah berbunyi lewat queue.js.
            if (source === "remote") G.speech.announce(G.queue.find(s, c.serving), c);
          }
          seen[c.id] = c.callSeq;
        });

        el.querySelector("#bnext").innerHTML = G.queue.waiting(s).slice(0, 6).map(function (t) {
          return '<li class="' + (t.priority ? "is-prio" : "") + '">' + t.no + '</li>';
        }).join("") || '<li>Tidak ada</li>';
        firstDraw = false;
      }

      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]");
        if (!b) return;
        if (b.dataset.act === "demo") {
          var s = G.state.get();
          // Pilih loket yang paling lama tidak memanggil
          var target = s.counters.slice().sort(function (a, b2) { return a.callSeq - b2.callSeq; })[0];
          if (!G.queue.callNext(target.id)) ui.toast("Tidak ada antrian untuk dipanggil. Daftarkan pasien dulu.");
        }
        if (b.dataset.act === "full") {
          var board = el.querySelector(".board");
          if (document.fullscreenElement) document.exitFullscreen();
          else if (board.requestFullscreen) board.requestFullscreen().catch(function () { ui.toast("Layar penuh tidak tersedia di sini."); });
          else ui.toast("Layar penuh tidak tersedia di sini.");
        }
      });

      draw(G.state.get(), "init");
      unsub = G.state.subscribe(draw);
      var clock = setInterval(function () {
        var c = el.querySelector("#bclock");
        if (c) c.textContent = ui.clock();
      }, 15000);

      return function () { unsub(); clearInterval(clock); };
    }
  };

  G.router.register("layar", G.views.display);
})(window.Giliran = window.Giliran || {});
