/* ==========================================================================
   Giliran: suara
   Membacakan nomor dengan Web Speech API bawaan browser (bahasa Indonesia)
   dan membunyikan nada pendek sebelum pemanggilan. Browser hanya mengizinkan
   suara setelah pengguna menyentuh halaman, jadi dipicu dari tombol.
   ========================================================================== */
(function (G) {
  var synth = window.speechSynthesis;
  var voice = null;
  var audio = null;

  function pickVoice() {
    if (!synth) return;
    voice = synth.getVoices().find(function (v) { return /^id([-_]|$)/i.test(v.lang); }) || null;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  var ones = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];

  // 24 menjadi "dua puluh empat", 112 menjadi "seratus dua belas"
  function terbilang(n) {
    if (n < 10) return ones[n];
    if (n === 10) return "sepuluh";
    if (n === 11) return "sebelas";
    if (n < 20) return ones[n - 10] + " belas";
    if (n < 100) return ones[Math.floor(n / 10)] + " puluh" + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 200) return "seratus" + (n % 100 ? " " + terbilang(n % 100) : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " ratus" + (n % 100 ? " " + terbilang(n % 100) : "");
    return String(n);
  }

  // "A-024" menjadi "A dua puluh empat"
  function ticketWords(no) {
    var parts = no.split("-");
    return parts[0] + " " + terbilang(parseInt(parts[1], 10));
  }

  function say(text) {
    if (!synth) return false;
    try {
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      u.rate = 0.85;
      if (voice) u.voice = voice;
      synth.speak(u);
      return true;
    } catch (e) { return false; }
  }

  function chime() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === "suspended") audio.resume();
      [660, 880].forEach(function (freq, i) {
        var osc = audio.createOscillator();
        var gain = audio.createGain();
        var t0 = audio.currentTime + i * 0.28;
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        osc.connect(gain); gain.connect(audio.destination);
        osc.start(t0); osc.stop(t0 + 0.55);
      });
    } catch (e) { /* abaikan */ }
  }

  function announce(ticket, counter) {
    if (!G.settings || !G.settings.voice) return;
    chime();
    setTimeout(function () {
      say("Nomor antrian " + ticketWords(ticket.no) + ", silakan menuju " + counter.name);
    }, 750);
  }

  G.speech = {
    supported: !!synth,
    say: say, chime: chime, announce: announce,
    terbilang: terbilang, ticketWords: ticketWords
  };
})(window.Giliran = window.Giliran || {});
