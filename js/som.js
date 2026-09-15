(function () {
  'use strict';

  // Dois efeitos, sintetizados na hora com Web Audio — sem arquivo de áudio,
  // sem dependência, do mesmo jeito que o resto do projeto. `lancar()` é um
  // sopro (ruído passando por um filtro que sobe de frequência); `pouso()` é
  // um impacto surdo seguido de um tinido metálico curto.

  var CHAVE = 'caraOuCoroaSom';
  var mudo = false;
  try {
    mudo = localStorage.getItem(CHAVE) === 'mudo';
  } catch (e) { /* localStorage indisponível (modo privado, etc.) — segue com som ligado */ }

  var ctx = null;
  function contexto() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function bufferRuido(c, duracao) {
    var n = Math.max(1, Math.floor(c.sampleRate * duracao));
    var buffer = c.createBuffer(1, n, c.sampleRate);
    var dados = buffer.getChannelData(0);
    for (var i = 0; i < n; i++) dados[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function lancar() {
    if (mudo) return;
    var c = contexto();
    if (!c) return;
    var agora = c.currentTime;

    var fonte = c.createBufferSource();
    fonte.buffer = bufferRuido(c, 0.5);

    var filtro = c.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 0.9;
    filtro.frequency.setValueAtTime(500, agora);
    filtro.frequency.exponentialRampToValueAtTime(2600, agora + 0.32);

    var ganho = c.createGain();
    ganho.gain.setValueAtTime(0.0001, agora);
    ganho.gain.linearRampToValueAtTime(0.15, agora + 0.05);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + 0.42);

    fonte.connect(filtro).connect(ganho).connect(c.destination);
    fonte.start(agora);
    fonte.stop(agora + 0.5);
  }

  function pouso() {
    if (mudo) return;
    var c = contexto();
    if (!c) return;
    var agora = c.currentTime;

    var thud = c.createBufferSource();
    thud.buffer = bufferRuido(c, 0.12);
    var filtroThud = c.createBiquadFilter();
    filtroThud.type = 'lowpass';
    filtroThud.frequency.setValueAtTime(650, agora);
    var ganhoThud = c.createGain();
    ganhoThud.gain.setValueAtTime(0.2, agora);
    ganhoThud.gain.exponentialRampToValueAtTime(0.0001, agora + 0.14);
    thud.connect(filtroThud).connect(ganhoThud).connect(c.destination);
    thud.start(agora);
    thud.stop(agora + 0.15);

    [1900, 3100].forEach(function (freq, i) {
      var osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, agora);
      var g = c.createGain();
      var inicio = agora + 0.01 + i * 0.015;
      g.gain.setValueAtTime(0.0001, inicio);
      g.gain.linearRampToValueAtTime(0.06, inicio + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.28);
      osc.connect(g).connect(c.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.3);
    });
  }

  function alternar() {
    mudo = !mudo;
    try { localStorage.setItem(CHAVE, mudo ? 'mudo' : 'som'); } catch (e) { /* ignora */ }
    if (!mudo) contexto(); // já aproveita o gesto do clique para destravar o áudio
    return mudo;
  }

  window.Som = {
    lancar: lancar,
    pouso: pouso,
    alternar: alternar,
    estaMudo: function () { return mudo; }
  };
})();
