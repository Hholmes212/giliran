/* ==========================================================================
   Giliran: alat bantu tampilan
   Ikon, pengaman teks, jam, notifikasi singkat, dan kertas nomor antrian.
   ========================================================================== */
(function (G) {
  var ICONS = {
    back:   "M15 5l-7 7 7 7",
    next:   "M9 5l7 7-7 7",
    check:  "M5 13l4 4L19 7",
    volume: "M4 9v6h4l5 4V5L8 9H4z M16.5 8.5a5 5 0 010 7 M19 6a8.5 8.5 0 010 12",
    copy:   "M9 9h11v11H9z M5 15V4h11",
    send:   "M3 11l18-8-8 18-2-8-8-2z",
    id:     "M3 6h18v12H3z M7 10h5 M7 14h3 M15 10h2v4h-2z"
  };

  function icon(name) {
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
      'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICONS[name] + '"/></svg>';
  }

  // Semua teks dari pengguna (nama pasien) wajib lewat sini sebelum masuk innerHTML.
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function clock(ts) {
    var d = new Date(ts || Date.now());
    return String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0");
  }

  function toast(message) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-on");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove("is-on"); }, 3400);
  }

  // Salin teks. Jika browser menolak, beri tahu pengguna dengan jelas.
  function copy(text, okMessage) {
    function fail() { toast("Tidak bisa menyalin otomatis. Tekan dan tahan teks untuk menyalin."); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMessage || "Sudah disalin"); }, fail);
    } else { fail(); }
  }

  // Kertas nomor antrian. Isi status diperbarui lewat refreshTicket.
  function ticketHTML(t, s) {
    var sv = G.queue.service(t.service);
    var st = G.queue.info(s, t);
    return '<div class="ticket-wrap"><div class="ticket' + (st.kind === "go" ? " is-go" : "") + '" data-ticket="' + esc(t.no) + '">' +
      '<div class="ticket__top">' +
        '<span class="ticket__clinic">' + esc(G.config.clinic.name) + '</span>' +
        '<span class="ticket__label">Nomor antrian</span>' +
        '<strong class="ticket__no">' + esc(t.no) + '</strong>' +
        '<span class="ticket__svc">' + esc(sv.label) + (t.priority ? ' <span class="pill">Jalur prioritas</span>' : "") + '</span>' +
      '</div>' +
      '<div class="ticket__stub"><strong class="ticket__status">' + esc(st.main) + '</strong>' +
      '<span class="ticket__sub">' + esc(st.sub) + '</span></div>' +
    '</div></div>';
  }

  function refreshTicket(root, t, s) {
    var el = root.querySelector(".ticket");
    if (!el) return null;
    var st = G.queue.info(s, t);
    el.classList.toggle("is-go", st.kind === "go");
    el.querySelector(".ticket__status").textContent = st.main;
    el.querySelector(".ticket__sub").textContent = st.sub;
    return st;
  }

  G.ui = {
    icon: icon, esc: esc, clock: clock, toast: toast, copy: copy,
    ticketHTML: ticketHTML, refreshTicket: refreshTicket
  };
})(window.Giliran = window.Giliran || {});
