/* ==========================================================================
   Giliran: penyimpanan data antrian
   Data disimpan di localStorage browser. Dua tab yang terbuka bersamaan
   (misalnya panel petugas dan layar ruang tunggu) saling menyinkronkan data.
   Untuk dipakai sungguhan, bagian ini diganti dengan server dan database.
   ========================================================================== */
(function (G) {
  var KEY = "giliran.v1";
  var state = null;
  var subs = [];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.v === 1) return parsed;
      }
    } catch (e) { /* localStorage bisa diblokir, abaikan */ }
    return null;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* abaikan */ }
  }

  function emit(source) {
    subs.slice().forEach(function (fn) { fn(state, source); });
  }

  G.state = {
    init: function () {
      state = load();
      if (!state) {
        state = G.queue.freshState();
        G.queue.seedDemo(state);
        save();
      }
    },
    get: function () { return state; },

    // Ubah data lewat fungsi, lalu simpan dan beri tahu semua yang berlangganan.
    update: function (mutator) {
      mutator(state);
      save();
      emit("local");
    },

    subscribe: function (fn) {
      subs.push(fn);
      return function () { subs = subs.filter(function (f) { return f !== fn; }); };
    },

    reset: function () {
      state = G.queue.freshState();
      G.queue.seedDemo(state);
      save();
      emit("local");
    }
  };

  // Perubahan dari tab lain
  window.addEventListener("storage", function (e) {
    if (e.key !== KEY || !e.newValue) return;
    try { state = JSON.parse(e.newValue); emit("remote"); } catch (err) { /* abaikan */ }
  });
})(window.Giliran = window.Giliran || {});
