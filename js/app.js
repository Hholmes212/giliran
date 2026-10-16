/* ==========================================================================
   Giliran: titik awal
   Memuat pengaturan tampilan (ukuran huruf, kontras, suara), menyiapkan data,
   lalu menjalankan halaman. File ini harus dimuat paling akhir.
   ========================================================================== */
(function (G) {
  var KEY = "giliran.settings";
  G.settings = { size: 1, contrast: false, voice: true };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) Object.assign(G.settings, saved);
  } catch (e) { /* abaikan */ }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(G.settings)); } catch (e) { /* abaikan */ }
  }

  function apply() {
    var root = document.documentElement;
    root.style.setProperty("--fs", G.settings.size);
    if (G.settings.contrast) root.setAttribute("data-contrast", "high");
    else root.removeAttribute("data-contrast");

    document.querySelectorAll("[data-size]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(Number(b.dataset.size) === Number(G.settings.size)));
    });
    document.getElementById("btnContrast").setAttribute("aria-pressed", String(G.settings.contrast));
    document.getElementById("btnVoice").setAttribute("aria-pressed", String(G.settings.voice));
  }

  document.querySelectorAll("[data-size]").forEach(function (b) {
    b.addEventListener("click", function () { G.settings.size = Number(b.dataset.size); persist(); apply(); });
  });
  document.getElementById("btnContrast").addEventListener("click", function () {
    G.settings.contrast = !G.settings.contrast; persist(); apply();
  });
  document.getElementById("btnVoice").addEventListener("click", function () {
    G.settings.voice = !G.settings.voice; persist(); apply();
    if (G.settings.voice) G.speech.say("Suara dinyalakan");
    G.ui.toast(G.settings.voice ? "Suara menyala" : "Suara dimatikan");
  });
  document.getElementById("btnReset").addEventListener("click", function () {
    G.state.reset();
    G.ui.toast("Data contoh dikembalikan");
    G.router.go();
  });

  apply();
  G.state.init();
  G.router.start();
})(window.Giliran = window.Giliran || {});
