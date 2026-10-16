/* ==========================================================================
   Giliran: perpindahan halaman
   Memakai hash di alamat (#daftar, #kiosk, dan seterusnya) supaya bisa dibuka
   langsung dari GitHub Pages tanpa server khusus.
   Setiap halaman punya mount(el) yang boleh mengembalikan fungsi pembersih.
   ========================================================================== */
(function (G) {
  var routes = {};
  var cleanup = null;
  var first = true;

  function register(name, view) { routes[name] = view; }

  function go() {
    var name = (location.hash || "#beranda").slice(1);
    var main = document.getElementById("view");

    // Tautan "Langsung ke isi halaman": cukup pindahkan fokus.
    if (name === "view") { main.focus(); return; }
    if (!routes[name]) name = "beranda";

    if (cleanup) { cleanup(); cleanup = null; }

    var el = document.createElement("div");
    el.className = "view";
    el.dataset.view = name;
    main.replaceChildren(el);
    cleanup = routes[name].mount(el) || null;

    document.querySelectorAll(".nav a").forEach(function (a) {
      if (a.dataset.route === name) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    // Setelah pindah halaman, fokus ke judul supaya pembaca layar langsung membacanya.
    var h1 = el.querySelector("h1");
    if (h1 && !first) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); }
    if (!first) window.scrollTo(0, 0);
    first = false;
  }

  G.router = {
    register: register,
    go: go,
    start: function () { window.addEventListener("hashchange", go); go(); }
  };
})(window.Giliran = window.Giliran || {});
