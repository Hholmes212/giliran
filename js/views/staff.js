/* ==========================================================================
   Halaman: Petugas
   Memanggil, memanggil ulang, melewati, menyelesaikan, dan mendaftarkan
   pasien yang datang langsung tanpa HP.
   ========================================================================== */
(function (G) {
  var ui = G.ui;

  G.views = G.views || {};
  G.views.staff = {
    mount: function (el) {
      var cfg = G.config;
      var counterId = cfg.counters[0].id;
      var unsub = null;

      el.innerHTML =
        '<div class="wrap">' +
          '<div class="staff-head">' +
            '<h1>Panel petugas</h1>' +
            '<div class="tabs" role="group" aria-label="Pilih loket">' +
              cfg.counters.map(function (c) {
                return '<button type="button" data-counter="' + c.id + '" aria-pressed="' + (c.id === counterId) + '">' + c.name + '</button>';
              }).join("") +
            '</div>' +
          '</div>' +
          '<div id="stats" class="stats"></div>' +
          '<div class="staff">' +
            '<div id="now" class="panel"></div>' +
            '<div class="panel"><h2>Menunggu</h2><ol id="list" class="wait-list"></ol></div>' +
          '</div>' +
          '<form id="walkin" class="panel walkin" style="margin-top:1.5rem" novalidate>' +
            '<h2>Daftarkan pasien yang datang langsung</h2>' +
            '<div class="field" style="margin-top:0"><label for="w-name">Nama pasien</label>' +
              '<input id="w-name" type="text" maxlength="40" autocomplete="off"><div class="field__error" id="w-err" role="alert"></div></div>' +
            '<div class="field" style="margin-top:0"><label for="w-svc">Layanan</label>' +
              '<select id="w-svc">' + cfg.services.map(function (s) { return '<option value="' + s.id + '">' + s.label + '</option>'; }).join("") + '</select></div>' +
            '<label class="check"><input id="w-prio" type="checkbox">Jalur prioritas (lansia, ibu hamil, disabilitas)</label>' +
            '<div class="actions" style="margin-top:0"><button type="submit" class="btn">Daftarkan</button></div>' +
          '</form>' +
        '</div>';

      function counter(s) { return s.counters.find(function (c) { return c.id === counterId; }); }
      function minsSince(ts) { return Math.max(0, Math.round((Date.now() - ts) / 60000)); }

      function draw(s) {
        var st = G.queue.stats(s);
        el.querySelector("#stats").innerHTML =
          '<div><b>' + st.waiting + '</b><span>Menunggu</span></div>' +
          '<div><b>' + st.done + '</b><span>Selesai</span></div>' +
          '<div><b>' + st.avgWait + ' mnt</b><span>Rata-rata tunggu</span></div>';

        var c = counter(s);
        var cur = c.serving ? G.queue.find(s, c.serving) : null;
        var list = G.queue.waiting(s);
        var now = el.querySelector("#now");

        now.innerHTML =
          '<h2>Sedang dilayani di ' + c.name + '</h2>' +
          (cur
            ? '<div class="now__no">' + cur.no + '</div>' +
              '<div class="now__meta"><span>' + ui.esc(cur.name) + '</span><span class="pill">' + G.queue.service(cur.service).label + '</span>' +
              (cur.priority ? '<span class="pill pill--prio">Prioritas</span>' : "") + '</div>'
            : '<div class="now__no now--empty">Kosong</div><p class="now--empty">Belum ada pasien di loket ini.</p>') +
          '<div class="now__actions">' +
            '<button type="button" class="btn btn--ticket btn--main" data-act="next"' + (list.length || cur ? "" : " disabled") + '>' +
              (list.length ? 'Panggil berikutnya (' + list[0].no + ')' : (cur ? 'Selesai, tidak ada antrian lagi' : 'Tidak ada antrian')) + '</button>' +
            '<button type="button" class="btn btn--ghost" data-act="recall"' + (cur ? "" : " disabled") + '>' + ui.icon("volume") + 'Panggil ulang</button>' +
            '<button type="button" class="btn btn--ghost" data-act="skip"' + (cur ? "" : " disabled") + '>Tidak hadir, lewati</button>' +
            '<button type="button" class="btn btn--ok btn--main" data-act="finish"' + (cur ? "" : " disabled") + '>Selesai dilayani</button>' +
          '</div>';

        var ol = el.querySelector("#list");
        ol.innerHTML = list.length
          ? list.slice(0, 8).map(function (t) {
              return '<li class="' + (t.priority ? "is-prio" : "") + '"><span class="no">' + t.no + '</span>' +
                '<span class="who"><b>' + ui.esc(t.name) + '</b>' +
                '<span class="tags"><span class="pill">' + G.queue.service(t.service).label + '</span>' +
                (t.priority ? '<span class="pill pill--prio">Prioritas</span>' : "") +
                '<span class="pill">' + cfg.channels[t.via] + '</span></span>' +
                '<small>Menunggu ' + minsSince(t.createdAt) + ' menit</small></span></li>';
            }).join("") + (list.length > 8 ? '<li><span class="no"></span><span class="who">dan ' + (list.length - 8) + ' lainnya</span></li>' : "")
          : '<li class="empty">Tidak ada yang menunggu.</li>';
      }

      el.addEventListener("click", function (e) {
        var tab = e.target.closest("[data-counter]");
        if (tab) {
          counterId = Number(tab.dataset.counter);
          el.querySelectorAll("[data-counter]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === tab)); });
          return draw(G.state.get());
        }
        var b = e.target.closest("[data-act]");
        if (!b) return;
        var act = b.dataset.act;
        if (act === "next") {
          var called = G.queue.callNext(counterId);
          if (called) ui.toast("Memanggil " + called.ticket.no);
        }
        if (act === "recall") { G.queue.recall(counterId); ui.toast("Memanggil ulang"); }
        if (act === "skip") G.queue.skip(counterId);
        if (act === "finish") G.queue.finish(counterId);
      });

      el.querySelector("#walkin").addEventListener("submit", function (e) {
        e.preventDefault();
        var nameEl = el.querySelector("#w-name");
        var name = nameEl.value.trim();
        if (name.length < 2) {
          nameEl.setAttribute("aria-invalid", "true");
          el.querySelector("#w-err").textContent = "Tulis nama pasien dulu.";
          nameEl.focus();
          return;
        }
        nameEl.removeAttribute("aria-invalid");
        el.querySelector("#w-err").textContent = "";
        var t = G.queue.create({
          service: el.querySelector("#w-svc").value, name: name, via: "loket",
          priority: el.querySelector("#w-prio").checked
        });
        nameEl.value = "";
        el.querySelector("#w-prio").checked = false;
        ui.toast("Terdaftar: " + t.no + " untuk " + name);
      });

      draw(G.state.get());
      unsub = G.state.subscribe(draw);
      var refresh = setInterval(function () { draw(G.state.get()); }, 30000); // perbarui "menunggu x menit"

      return function () { unsub(); clearInterval(refresh); };
    }
  };

  G.router.register("petugas", G.views.staff);
})(window.Giliran = window.Giliran || {});
