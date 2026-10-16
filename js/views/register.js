/* ==========================================================================
   Halaman: Daftar
   Empat langkah, satu pertanyaan per layar, lalu kertas nomor.
   ========================================================================== */
(function (G) {
  var ui = G.ui;
  var TOTAL = 4;

  G.views = G.views || {};
  G.views.register = {
    mount: function (el) {
      var cfg = G.config;
      var data = { step: 1, service: null, name: "", idNo: "", reasons: [], ticket: null };
      var unsub = null;

      function progress() {
        return '<div class="progress"><span>Langkah ' + data.step + ' dari ' + TOTAL + '</span>' +
          '<div class="progress__bar" aria-hidden="true"><i style="width:' + (data.step / TOTAL * 100) + '%"></i></div></div>';
      }
      function back() {
        return '<button type="button" class="btn btn--ghost" data-act="back">' + ui.icon("back") + 'Kembali</button>';
      }

      function stepService() {
        return progress() +
          '<h1 class="q">Hari ini mau berobat apa?</h1>' +
          '<p class="q-help">Sentuh satu pilihan.</p>' +
          '<div class="choices">' +
            cfg.services.map(function (s) {
              return '<button type="button" class="choice choice--plain" data-service="' + s.id + '">' +
                '<span class="choice__body"><b>' + s.label + '</b><small>' + s.hint + '</small></span>' +
                '<span class="choice__chip" aria-hidden="true">' + s.prefix + '</span></button>';
            }).join("") +
          '</div>';
      }

      function stepPerson() {
        return progress() +
          '<h1 class="q">Siapa yang akan berobat?</h1>' +
          '<p class="q-help">Boleh diisi oleh anak atau cucu untuk orang tuanya.</p>' +
          '<form id="personForm" novalidate>' +
            '<div class="field"><label for="f-name">Nama pasien</label>' +
              '<input id="f-name" name="name" type="text" autocomplete="name" maxlength="40" value="' + ui.esc(data.name) + '" aria-describedby="f-name-err">' +
              '<div class="field__error" id="f-name-err" role="alert"></div></div>' +
            '<div class="field"><label for="f-id">Nomor BPJS atau KTP</label>' +
              '<input id="f-id" name="idNo" type="text" inputmode="numeric" autocomplete="off" maxlength="20" value="' + ui.esc(data.idNo) + '" aria-describedby="f-id-help">' +
              '<small id="f-id-help">Boleh dikosongkan. Petugas akan menanyakan lagi di loket.</small></div>' +
            '<div class="actions">' +
              '<button type="button" class="btn btn--ghost" data-act="scan">' + ui.icon("id") + 'Isi dari KTP (contoh)</button>' +
            '</div>' +
            '<div class="actions">' + back() +
              '<button type="submit" class="btn btn--xl">Lanjut' + ui.icon("next") + '</button></div>' +
          '</form>';
      }

      function stepPriority() {
        return progress() +
          '<h1 class="q">Apakah ada yang berlaku untuk pasien?</h1>' +
          '<p class="q-help">Yang dipilih akan dipanggil lebih dulu. Boleh memilih lebih dari satu.</p>' +
          '<div class="choices">' +
            cfg.priorityReasons.map(function (r) {
              var on = data.reasons.indexOf(r.id) >= 0;
              return '<button type="button" class="choice choice--plain" data-reason="' + r.id + '" aria-pressed="' + on + '">' +
                '<span class="choice__body"><b>' + r.label + '</b></span>' +
                '<span class="choice__mark" aria-hidden="true">' + ui.icon("check") + '</span></button>';
            }).join("") +
            '<button type="button" class="choice choice--plain" data-reason="none" aria-pressed="' + (data.reasons.length === 0) + '">' +
              '<span class="choice__body"><b>Tidak ada</b></span>' +
              '<span class="choice__mark" aria-hidden="true">' + ui.icon("check") + '</span></button>' +
          '</div>' +
          '<div class="actions">' + back() +
            '<button type="button" class="btn btn--xl" data-act="next">Lanjut' + ui.icon("next") + '</button></div>';
      }

      function stepReview() {
        var sv = G.queue.service(data.service);
        var reasons = data.reasons.length
          ? data.reasons.map(function (id) { return cfg.priorityReasons.find(function (r) { return r.id === id; }).label; }).join(", ")
          : "Tidak ada";
        return progress() +
          '<h1 class="q">Periksa sebentar</h1>' +
          '<p class="q-help">Kalau sudah benar, sentuh tombol kuning.</p>' +
          '<dl class="summary">' +
            '<div><dt>Layanan</dt><dd>' + sv.label + '</dd></div>' +
            '<div><dt>Nama</dt><dd>' + ui.esc(data.name) + '</dd></div>' +
            '<div><dt>No. BPJS/KTP</dt><dd>' + (data.idNo ? ui.esc(data.idNo) : "Tidak diisi") + '</dd></div>' +
            '<div><dt>Prioritas</dt><dd>' + reasons + '</dd></div>' +
          '</dl>' +
          '<div class="actions">' + back() +
            '<button type="button" class="btn btn--ticket btn--xl" data-act="take">Ambil nomor antrian</button></div>';
      }

      function stepTicket() {
        var s = G.state.get();
        var t = data.ticket;
        return '<div class="ticket-page">' +
          '<h1 class="q">Ini nomor antrian Anda</h1>' +
          ui.ticketHTML(t, s) +
          '<p class="q-help" id="ticketHelp">Silakan duduk. Halaman ini berubah sendiri saat giliran Anda tiba.</p>' +
          '<div class="actions">' +
            '<button type="button" class="btn" data-act="speak">' + ui.icon("volume") + 'Bacakan untuk saya</button>' +
            '<button type="button" class="btn btn--ghost" data-act="copy">' + ui.icon("copy") + 'Salin pesan untuk keluarga</button>' +
          '</div>' +
          '<div class="actions"><button type="button" class="btn btn--ghost" data-act="again">Daftarkan orang lain</button></div>' +
          '<p class="demo-note">Contoh: pemberitahuan ke HP keluarga belum benar-benar terkirim di prototipe ini.</p>' +
        '</div>';
      }

      function render() {
        if (unsub) { unsub(); unsub = null; }
        var html = [null, stepService, stepPerson, stepPriority, stepReview, stepTicket][data.step]();
        el.innerHTML = '<div class="wrap wrap--narrow">' + html + '</div>';
        if (data.step > 1) {
          var h1 = el.querySelector("h1");
          h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true });
        }
        if (data.step === 5) {
          unsub = G.state.subscribe(function (s) { ui.refreshTicket(el, data.ticket, s); });
        }
      }

      function ticketText() {
        var s = G.state.get(), t = data.ticket;
        var st = G.queue.info(s, t);
        return "Nomor antrian " + t.no + " di " + G.config.clinic.name + ". " + st.main + ". " + st.sub + ".";
      }

      el.addEventListener("click", function (e) {
        var btn = e.target.closest("button");
        if (!btn) return;
        var act = btn.dataset.act;

        if (btn.dataset.service) { data.service = btn.dataset.service; data.step = 2; return render(); }

        if (btn.dataset.reason) {
          var r = btn.dataset.reason;
          if (r === "none") data.reasons = [];
          else {
            var i = data.reasons.indexOf(r);
            if (i >= 0) data.reasons.splice(i, 1); else data.reasons.push(r);
          }
          el.querySelectorAll("[data-reason]").forEach(function (b) {
            var on = b.dataset.reason === "none" ? data.reasons.length === 0 : data.reasons.indexOf(b.dataset.reason) >= 0;
            b.setAttribute("aria-pressed", String(on));
          });
          return;
        }

        if (act === "back") { data.step -= 1; return render(); }
        if (act === "next") { data.step += 1; return render(); }

        if (act === "scan") {
          el.querySelector("#f-name").value = "Bu Sumarni";
          el.querySelector("#f-id").value = "0001234567890";
          el.querySelector("#f-name-err").textContent = "";
          ui.toast("Contoh data KTP terisi. Di perangkat sungguhan, kamera membaca KTP.");
          return;
        }

        if (act === "take") {
          data.ticket = G.queue.create({
            service: data.service, name: data.name, via: "web",
            priority: data.reasons.length > 0
          });
          data.step = 5;
          return render();
        }

        if (act === "speak") {
          var ok = G.speech.say(ticketText());
          if (!ok) ui.toast("Perangkat ini belum bisa membacakan. Nomor Anda " + data.ticket.no);
          return;
        }
        if (act === "copy") return ui.copy(ticketText(), "Pesan disalin. Tinggal tempel di WhatsApp.");
        if (act === "again") { data = { step: 1, service: null, name: "", idNo: "", reasons: [], ticket: null }; return render(); }
      });

      el.addEventListener("submit", function (e) {
        e.preventDefault();
        if (e.target.id !== "personForm") return;
        var nameInput = el.querySelector("#f-name");
        var name = nameInput.value.trim();
        if (name.length < 2) {
          nameInput.setAttribute("aria-invalid", "true");
          el.querySelector("#f-name-err").textContent = "Tulis nama pasien dulu.";
          nameInput.focus();
          return;
        }
        data.name = name;
        data.idNo = el.querySelector("#f-id").value.trim();
        data.step = 3;
        render();
      });

      render();
      return function () { if (unsub) unsub(); };
    }
  };

  G.router.register("daftar", G.views.register);
})(window.Giliran = window.Giliran || {});
