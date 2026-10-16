/* ==========================================================================
   Halaman: WhatsApp
   Simulasi percakapan. Pasien cukup mengetik DAFTAR lalu membalas dengan angka.
   Nomor yang dihasilkan masuk ke antrian yang sama dengan jalur lain.
   Ini bukan koneksi WhatsApp sungguhan; versi nyata memakai WhatsApp Business API.
   ========================================================================== */
(function (G) {
  var ui = G.ui;

  // Ubah teks pesan menjadi HTML aman: *tebal* dan baris baru.
  function format(text) {
    return ui.esc(text).replace(/\*(.+?)\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  }

  G.views = G.views || {};
  G.views.whatsapp = {
    mount: function (el) {
      var cfg = G.config;
      var flow = { step: "idle", service: null, name: "", ticket: null };
      var timers = [];

      el.innerHTML =
        '<div class="wrap wa">' +
          '<div class="wa__text">' +
            '<h1>Daftar lewat WhatsApp</h1>' +
            '<p class="q-help">Tidak perlu aplikasi baru. Bapak dan Ibu yang sudah biasa berkirim pesan cukup mengetik satu kata.</p>' +
            '<ol class="wa-steps">' +
              '<li><b>Kirim kata DAFTAR</b>ke nomor WhatsApp puskesmas.</li>' +
              '<li><b>Balas dengan angka</b>untuk memilih layanan. Tidak perlu mengetik panjang.</li>' +
              '<li><b>Tulis nama pasien</b>lalu jawab Ya atau Tidak untuk jalur prioritas.</li>' +
              '<li><b>Terima nomor antrian</b>beserta perkiraan waktu tunggu.</li>' +
            '</ol>' +
            '<p class="demo-note">Coba di ponsel di samping. Ini simulasi percakapan, belum tersambung ke WhatsApp sungguhan.</p>' +
          '</div>' +
          '<div class="phone"><div class="phone__screen">' +
            '<div class="phone__head"><span class="phone__avatar" aria-hidden="true">P</span>' +
              '<div><b>' + ui.esc(cfg.clinic.name) + '</b><small>akun resmi (contoh)</small></div></div>' +
            '<div class="chat" id="chat" role="log" aria-live="polite" aria-label="Percakapan"></div>' +
            '<div class="quick" id="quick"></div>' +
            '<form class="composer" id="composer">' +
              '<label class="sr-only" for="wa-input">Tulis pesan</label>' +
              '<input id="wa-input" type="text" autocomplete="off" placeholder="Tulis pesan" maxlength="60">' +
              '<button type="submit" aria-label="Kirim">' + ui.icon("send") + '</button>' +
            '</form>' +
          '</div></div>' +
        '</div>';

      var chat = el.querySelector("#chat");
      var quick = el.querySelector("#quick");
      var input = el.querySelector("#wa-input");

      function bubble(text, me) {
        var b = document.createElement("div");
        b.className = "bubble" + (me ? " bubble--me" : "");
        b.innerHTML = format(text) + "<time>" + ui.clock() + "</time>";
        chat.appendChild(b);
        chat.scrollTop = chat.scrollHeight;
        return b;
      }

      function setQuick(items) {
        quick.innerHTML = items.map(function (t) { return '<button type="button">' + ui.esc(t) + "</button>"; }).join("");
      }

      // Balasan bot muncul setelah jeda singkat, dengan penanda "mengetik".
      function botSay(text, quickItems) {
        setQuick([]);
        var typing = document.createElement("div");
        typing.className = "bubble bubble--typing";
        typing.setAttribute("aria-hidden", "true");
        typing.textContent = "...";
        chat.appendChild(typing);
        chat.scrollTop = chat.scrollHeight;
        timers.push(setTimeout(function () {
          typing.remove();
          bubble(text, false);
          setQuick(quickItems || []);
        }, 650));
      }

      function serviceMenu() {
        return cfg.services.map(function (s, i) { return (i + 1) + ". " + s.label; });
      }

      function handle(raw) {
        var text = raw.trim();
        var low = text.toLowerCase();
        var num = parseInt(text, 10);

        if (low === "batal" || low === "ulang") {
          flow = { step: "idle", service: null, name: "", ticket: null };
          return botSay("Baik, dibatalkan. Kirim kata *DAFTAR* kapan saja untuk mulai lagi.", ["DAFTAR"]);
        }

        if (low === "status") {
          if (!flow.ticket) return botSay("Anda belum punya nomor antrian. Kirim kata *DAFTAR* untuk mengambil nomor.", ["DAFTAR"]);
          var st = G.queue.info(G.state.get(), flow.ticket);
          return botSay("Nomor *" + flow.ticket.no + "*\n" + st.main + ".\n" + st.sub + ".");
        }

        switch (flow.step) {
          case "idle":
            if (low.indexOf("daftar") >= 0) {
              flow.step = "service";
              return botSay("Selamat datang di " + cfg.clinic.name + ".\nMau berobat apa? Balas dengan angka:\n" + serviceMenu().join("\n"), serviceMenu());
            }
            return botSay("Kirim kata *DAFTAR* untuk mengambil nomor antrian.", ["DAFTAR"]);

          case "service":
            if (num >= 1 && num <= cfg.services.length) {
              flow.service = cfg.services[num - 1];
              flow.step = "name";
              return botSay("Baik, " + flow.service.label + ".\nSiapa nama pasien? Tulis nama saja, contoh: Bu Sumarni");
            }
            return botSay("Maaf, balas dengan angka 1 sampai " + cfg.services.length + ".", serviceMenu());

          case "name":
            if (text.length < 2) return botSay("Tulis nama pasien, minimal dua huruf.");
            flow.name = text.slice(0, 40);
            flow.step = "priority";
            return botSay("Apakah pasien berumur 60 tahun ke atas, sedang hamil, atau penyandang disabilitas?\n1. Ya\n2. Tidak", ["1. Ya", "2. Tidak"]);

          case "priority":
            if (num !== 1 && num !== 2) return botSay("Balas dengan angka 1 untuk Ya atau 2 untuk Tidak.", ["1. Ya", "2. Tidak"]);
            flow.ticket = G.queue.create({ service: flow.service.id, name: flow.name, priority: num === 1, via: "wa" });
            flow.step = "done";
            var info = G.queue.info(G.state.get(), flow.ticket);
            return botSay(
              "Terima kasih, " + flow.name + ".\nNomor antrian Anda: *" + flow.ticket.no + "*\n" +
              info.main + ", " + info.sub.toLowerCase() + ".\nKetik *STATUS* kapan saja untuk melihat giliran.",
              ["STATUS"]
            );

          default:
            return botSay("Nomor Anda *" + flow.ticket.no + "*. Ketik *STATUS* untuk melihat giliran, atau *ULANG* untuk mendaftarkan orang lain.", ["STATUS", "ULANG"]);
        }
      }

      function send(text) {
        if (!text.trim()) return;
        bubble(text, true);
        handle(text);
      }

      el.querySelector("#composer").addEventListener("submit", function (e) {
        e.preventDefault();
        var v = input.value;
        input.value = "";
        send(v);
      });
      quick.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (b) send(b.textContent);
      });

      // Pesan pembuka, supaya halaman tidak kosong
      var hint = document.createElement("div");
      hint.className = "chat__hint";
      hint.textContent = "Hari ini";
      chat.appendChild(hint);
      botSay("Halo, ini layanan antrian " + cfg.clinic.name + ".\nKirim kata *DAFTAR* untuk mengambil nomor.", ["DAFTAR"]);

      return function () { timers.forEach(clearTimeout); };
    }
  };

  G.router.register("whatsapp", G.views.whatsapp);
})(window.Giliran = window.Giliran || {});
