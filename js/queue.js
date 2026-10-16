/* ==========================================================================
   Giliran: aturan antrian
   Membuat nomor, mengurutkan (prioritas lebih dulu), memanggil, memperkirakan
   waktu tunggu. Tidak menyentuh tampilan sama sekali.
   ========================================================================== */
(function (G) {
  var cfg = G.config;

  function service(id) {
    return cfg.services.find(function (s) { return s.id === id; });
  }

  function freshState() {
    return {
      v: 1,
      seq: {},
      tickets: [],
      counters: cfg.counters.map(function (c) {
        return { id: c.id, name: c.name, serving: null, callSeq: 0 };
      })
    };
  }

  function pad(n) { return String(n).padStart(3, "0"); }

  // Menambah satu nomor ke dalam state (dipanggil di dalam G.state.update).
  function add(s, o) {
    var sv = service(o.service);
    var seq = (s.seq[sv.prefix] || 0) + 1;
    s.seq[sv.prefix] = seq;
    var t = {
      no: sv.prefix + "-" + pad(seq),
      service: sv.id,
      name: o.name || "Pasien",
      priority: !!o.priority,
      via: o.via || "web",
      status: "waiting",       // waiting, calling, done, skipped
      createdAt: o.createdAt || Date.now(),
      calledAt: null,
      doneAt: null,
      counter: null
    };
    s.tickets.push(t);
    return t;
  }

  // Urutan tunggu: prioritas dulu, lalu siapa yang datang lebih awal.
  function waiting(s) {
    return s.tickets
      .filter(function (t) { return t.status === "waiting"; })
      .sort(function (a, b) {
        if (a.priority !== b.priority) return a.priority ? -1 : 1;
        return a.createdAt - b.createdAt;
      });
  }

  function find(s, no) {
    return s.tickets.find(function (t) { return t.no === no; });
  }

  // Perkiraan: jumlah layanan di depan, dibagi jumlah loket, dibulatkan ke 5 menit.
  function estimate(s, t) {
    var list = waiting(s);
    var idx = list.findIndex(function (x) { return x.no === t.no; });
    if (idx < 0) return null;
    var total = list.slice(0, idx).reduce(function (sum, x) { return sum + service(x.service).avgMin; }, 0);
    var busy = s.counters.some(function (c) { return c.serving; });
    var mins = total / Math.max(1, s.counters.length) + (busy ? 3 : 0);
    return { ahead: idx, mins: idx === 0 && !busy ? 0 : Math.max(5, Math.ceil(mins / 5) * 5) };
  }

  function human(mins) {
    return mins <= 5 ? "kurang dari 5 menit" : "sekitar " + mins + " menit";
  }

  // Kalimat status untuk satu nomor, dipakai di kertas nomor.
  function info(s, t) {
    var cur = find(s, t.no) || t;
    if (cur.status === "calling") {
      var c = s.counters.find(function (x) { return x.id === cur.counter; });
      return { kind: "go", main: "Giliran Anda! Ke " + (c ? c.name : "loket"), sub: "Silakan masuk sekarang" };
    }
    if (cur.status === "done") return { kind: "done", main: "Sudah selesai", sub: "Terima kasih sudah datang" };
    if (cur.status === "skipped") return { kind: "skip", main: "Nomor dilewati", sub: "Silakan temui petugas loket" };
    var e = estimate(s, cur);
    return {
      kind: "wait",
      main: e.ahead === 0 ? "Anda berikutnya" : e.ahead + " orang di depan Anda",
      sub: "Perkiraan " + human(e.mins),
      ahead: e.ahead,
      mins: e.mins
    };
  }

  /* ---------- Aksi (mengubah data) ---------- */

  function create(o) {
    var made = null;
    G.state.update(function (s) { made = add(s, o); });
    return made;
  }

  function closeCurrent(s, c, status) {
    if (!c.serving) return;
    var cur = find(s, c.serving);
    if (cur && cur.status === "calling") { cur.status = status; cur.doneAt = Date.now(); }
    c.serving = null;
  }

  function callNext(counterId) {
    var called = null;
    G.state.update(function (s) {
      var c = s.counters.find(function (x) { return x.id === counterId; });
      if (!c) return;
      closeCurrent(s, c, "done");
      var next = waiting(s)[0];
      if (!next) return;
      next.status = "calling";
      next.counter = c.id;
      next.calledAt = Date.now();
      c.serving = next.no;
      c.callSeq += 1;
      called = { ticket: Object.assign({}, next), counter: Object.assign({}, c) };
    });
    if (called) G.speech.announce(called.ticket, called.counter);
    return called;
  }

  function recall(counterId) {
    var called = null;
    G.state.update(function (s) {
      var c = s.counters.find(function (x) { return x.id === counterId; });
      if (!c || !c.serving) return;
      c.callSeq += 1;
      called = { ticket: Object.assign({}, find(s, c.serving)), counter: Object.assign({}, c) };
    });
    if (called) G.speech.announce(called.ticket, called.counter);
  }

  function finish(counterId) {
    G.state.update(function (s) {
      var c = s.counters.find(function (x) { return x.id === counterId; });
      if (c) closeCurrent(s, c, "done");
    });
  }

  function skip(counterId) {
    G.state.update(function (s) {
      var c = s.counters.find(function (x) { return x.id === counterId; });
      if (c) closeCurrent(s, c, "skipped");
    });
  }

  function stats(s) {
    var done = s.tickets.filter(function (t) { return t.status === "done"; });
    var called = s.tickets.filter(function (t) { return t.calledAt; });
    var avg = called.length
      ? Math.round(called.reduce(function (a, t) { return a + (t.calledAt - t.createdAt); }, 0) / called.length / 60000)
      : 0;
    return { waiting: waiting(s).length, done: done.length, avgWait: avg };
  }

  /* ---------- Data contoh ---------- */

  function seedDemo(s) {
    var now = Date.now(), m = 60000;
    s.seq = { A: 16, B: 5, C: 10, D: 1, E: 2 };

    function mk(sv, name, prio, via, ago, status, extra) {
      var t = add(s, { service: sv, name: name, priority: prio, via: via, createdAt: now - ago * m });
      t.status = status;
      Object.assign(t, extra || {});
      return t;
    }
    function finished(ago, counter) {
      return { counter: counter, calledAt: now - (ago - 14) * m, doneAt: now - (ago - 21) * m };
    }

    mk("umum", "Pak Slamet", false, "loket", 70, "done", finished(70, 1));
    mk("umum", "Mbak Ayu", false, "web", 64, "done", finished(64, 2));
    mk("umum", "Pak Rudi", false, "kiosk", 58, "done", finished(58, 1));
    mk("umum", "Bu Nia", false, "wa", 52, "done", finished(52, 2));
    mk("kontrol", "Bu Wati", true, "loket", 55, "done", finished(55, 1));
    mk("obat", "Pak Darto", false, "kiosk", 40, "done", finished(40, 2));

    mk("umum", "Pak Hendra", false, "kiosk", 31, "calling", { counter: 1, calledAt: now - 1 * m });
    mk("kontrol", "Bu Sumarni", true, "wa", 26, "calling", { counter: 2, calledAt: now - 0.5 * m });
    s.counters[0].serving = "A-021"; s.counters[0].callSeq = 1;
    s.counters[1].serving = "B-007"; s.counters[1].callSeq = 1;

    mk("umum", "Bu Tarmi", true, "wa", 24, "waiting");
    mk("umum", "Mas Dimas", false, "web", 20, "waiting");
    mk("umum", "Bu Lastri", true, "loket", 14, "waiting");
    mk("obat", "Pak Joko", false, "kiosk", 9, "waiting");
    mk("kia", "Mbak Rina", true, "web", 5, "waiting");
  }

  G.queue = {
    service: service, freshState: freshState, waiting: waiting, find: find,
    estimate: estimate, human: human, info: info, stats: stats,
    create: create, callNext: callNext, recall: recall, finish: finish, skip: skip,
    seedDemo: seedDemo
  };
})(window.Giliran = window.Giliran || {});
