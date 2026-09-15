(function () {
  'use strict';

  var MOEDAS = {
    '25': { nome: '25 centavos', canto: '#87785b' },
    '100': { nome: '1 real', canto: '#9b7753' }
  };

  var RECUO = 0.60;
  var VOO = 3.00;
  var POUSO = 0.85;
  var TOTAL = RECUO + VOO + POUSO;

  var $ = function (id) { return document.getElementById(id); };
  var sala = $('sala'), rig = $('rig'), arco = $('arco'), moeda = $('moeda'),
    canto = $('canto'), sombra = $('sombra'), btn = $('jogar'),
    elDica = $('dica'), anuncio = $('anuncio'), btnSom = $('somToggle');

  var Som = window.Som || { lancar: function () {}, pouso: function () {}, alternar: function () { return true; }, estaMudo: function () { return true; } };

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var chaves = Object.keys(MOEDAS);
  var CHAVE = chaves[Math.floor(Math.random() * chaves.length)];
  var MOEDA = MOEDAS[CHAVE];

  $('faceCara').src = 'img/' + CHAVE + '-cara.webp';
  $('faceCoroa').src = 'img/' + CHAVE + '-coroa.webp';
  $('denominacao').textContent = MOEDA.nome;
  document.documentElement.style.setProperty('--cor-canto', MOEDA.canto);

  var FATIAS = 16;
  var RAZAO_ESPESSURA = 0.055;
  var RAIO = 0, ESPESSURA = 0, CHAO = 0;

  function medir() {
    RAIO = (moeda.offsetWidth / 2) || 100;
    ESPESSURA = Math.max(5, Math.min(12, RAIO * RAZAO_ESPESSURA));
    CHAO = RAIO * 1.35;
    document.documentElement.style.setProperty('--espessura', ESPESSURA.toFixed(2) + 'px');
    sala.style.perspective = (RAIO * 7.4).toFixed(0) + 'px';
    montarCanto();
  }

  function montarCanto() {
    canto.textContent = '';
    var frag = document.createDocumentFragment();
    var util = Math.max(1, ESPESSURA - 1.6);
    for (var i = 0; i < FATIAS; i++) {
      var fatia = document.createElement('i');
      var z = -util / 2 + (util * i) / (FATIAS - 1);
      fatia.style.transform = 'translateZ(' + z.toFixed(2) + 'px)';
      frag.appendChild(fatia);
    }
    canto.appendChild(frag);
  }

  var fase = 'ocioso';
  var t0 = 0, resultado = null, giroFinal = 0, apice = 0, pousoTocado = false;
  var placar = { cara: 0, coroa: 0 };

  function trava(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function suave(x) { x = trava(x); return x * x * (3 - 2 * x); }
  function saiCubica(x) { return 1 - Math.pow(1 - trava(x), 3); }
  function entre(a, b, t) { return a + (b - a) * t; }

  var CAMERA = [
    { t: 0.00, z: 0.00, rx: 7, y: 0.00, origem: 46 },
    { t: 0.16, z: -1.37, rx: 6, y: 0.16, origem: 58 },
    { t: 0.42, z: -1.58, rx: 4, y: 0.21, origem: 66 },
    { t: 0.80, z: -1.47, rx: 46, y: -0.37, origem: 40 },
    { t: 1.00, z: -1.74, rx: 72, y: -0.50, origem: 28 }
  ];

  function camera(u) {
    if (u <= 0) return CAMERA[0];
    if (u >= 1) return CAMERA[CAMERA.length - 1];
    for (var i = 0; i < CAMERA.length - 1; i++) {
      var a = CAMERA[i], b = CAMERA[i + 1];
      if (u >= a.t && u <= b.t) {
        var k = suave((u - a.t) / (b.t - a.t));
        return {
          z: entre(a.z, b.z, k), rx: entre(a.rx, b.rx, k),
          y: entre(a.y, b.y, k), origem: entre(a.origem, b.origem, k)
        };
      }
    }
    return CAMERA[CAMERA.length - 1];
  }

  function aplicarCamera(c) {
    rig.style.transform = 'translateZ(' + (c.z * RAIO).toFixed(1) + 'px) rotateX(' +
      c.rx.toFixed(2) + 'deg) translateY(' + (c.y * RAIO).toFixed(1) + 'px)';
    sala.style.perspectiveOrigin = '50% ' + c.origem.toFixed(1) + '%';
  }

  function aplicarSombra(altura) {
    var h = trava(altura / (RAIO * 5));

    sombra.style.opacity = (0.46 * (1 - h * 0.80)).toFixed(3);

    var e = 1.28 + h * 0.70;

    var ox = RAIO * 0.05 * (1 + h * 1.4);
    var oy = RAIO * 0.04 * (1 + h);

    var d = CHAO + RAIO + ESPESSURA;
    sombra.style.transform =
      'rotateX(-90deg) translateZ(' + d.toFixed(1) + 'px)' +
      ' translateX(' + ox.toFixed(1) + 'px) translateY(' + oy.toFixed(1) + 'px)' +
      ' scale(' + e.toFixed(3) + ')';
  }

  function jogar() {
    if (fase !== 'ocioso') return;

    resultado = Math.random() < 0.5 ? 'cara' : 'coroa';

    var voltas = 5 + Math.floor(Math.random() * 3);
    giroFinal = voltas * 360 + (resultado === 'cara' ? 0 : 180);
    apice = RAIO * (2.6 + Math.random() * 0.6);
    pousoTocado = false;

    btn.disabled = true;
    elDica.style.opacity = '0';
    anuncio.textContent = 'Moeda lançada.';
    Som.lancar();

    if (reduzido) { pousar(); Som.pouso(); concluir(); return; }

    fase = 'animando';
    t0 = performance.now() / 1000;
  }

  function pousar() {
    arco.style.transform = 'translateY(' + CHAO.toFixed(0) + 'px) translateZ(0px)';
    moeda.style.transform = 'rotateX(' + giroFinal + 'deg)';
    aplicarCamera(CAMERA[CAMERA.length - 1]);
    aplicarSombra(0);
  }

  function concluir() {
    fase = 'ocioso';
    placar[resultado]++;
    $('nCara').textContent = placar.cara;
    $('nCoroa').textContent = placar.coroa;
    anuncio.textContent = 'Resultado: ' + resultado + '. Cara ' + placar.cara +
      ', coroa ' + placar.coroa + '.';
    btn.disabled = false;
    btn.textContent = 'Jogar de novo';
  }

  function quadro() {
    requestAnimationFrame(quadro);
    var agora = performance.now() / 1000;

    if (fase === 'ocioso') {
      if (!resultado) {
        var s = agora * 0.55;
        var flutua = Math.sin(s) * (RAIO * 0.05);
        arco.style.transform = 'translateY(' + flutua.toFixed(1) + 'px)';
        moeda.style.transform = 'rotateX(0deg) rotateY(' + (Math.sin(s * 0.7) * 9).toFixed(2) + 'deg)';
        aplicarSombra(CHAO + flutua);
      }
      return;
    }

    var t = agora - t0;
    var alturaAcimaDoChao;

    if (t < RECUO) {
      var u = t / RECUO;
      var y = -Math.sin(u * Math.PI) * (RAIO * 0.18);
      var z = entre(0, -RAIO * 1.1, saiCubica(u));
      arco.style.transform = 'translateY(' + y.toFixed(1) + 'px) translateZ(' + z.toFixed(1) + 'px)';
      moeda.style.transform = 'rotateX(' + (u * 26).toFixed(2) + 'deg)';
      alturaAcimaDoChao = CHAO + y;

    } else if (t < RECUO + VOO) {
      var u2 = (t - RECUO) / VOO;
      var alturaRel = 4 * u2 * (1 - u2);
      var yBase = entre(0, CHAO, u2);
      var yTotal = yBase - apice * alturaRel;
      var z2 = entre(-RAIO * 1.1, 0, suave(u2));
      arco.style.transform = 'translateY(' + yTotal.toFixed(1) + 'px) translateZ(' + z2.toFixed(1) + 'px)';

      var giro = 1 - Math.pow(1 - u2, 2.1);
      moeda.style.transform = 'rotateX(' + (giroFinal * giro).toFixed(2) + 'deg) ' +
        'rotateY(' + (Math.sin(u2 * Math.PI) * 7).toFixed(2) + 'deg)';
      alturaAcimaDoChao = CHAO - yTotal;

    } else if (t < TOTAL) {
      if (!pousoTocado) { pousoTocado = true; Som.pouso(); }
      var u3 = (t - RECUO - VOO) / POUSO;
      var quique = Math.abs(Math.sin(u3 * Math.PI * 2.4)) * (RAIO * 0.16) * Math.pow(1 - u3, 2);
      arco.style.transform = 'translateY(' + (CHAO - quique).toFixed(1) + 'px) translateZ(0px)';
      moeda.style.transform = 'rotateX(' + giroFinal + 'deg) rotateY(' +
        (Math.sin(u3 * Math.PI * 6) * 5 * Math.pow(1 - u3, 2)).toFixed(2) + 'deg)';
      alturaAcimaDoChao = quique;

    } else {
      pousar();
      concluir();
      return;
    }

    aplicarCamera(camera(trava(t / TOTAL)));
    aplicarSombra(alturaAcimaDoChao);
  }

  function atualizarBtnSom() {
    if (!btnSom) return;
    var mudo = Som.estaMudo();
    btnSom.setAttribute('aria-pressed', mudo ? 'true' : 'false');
    btnSom.setAttribute('aria-label', mudo ? 'Ativar som' : 'Silenciar');
  }

  btn.addEventListener('click', jogar);
  if (btnSom) {
    btnSom.addEventListener('click', function () {
      Som.alternar();
      atualizarBtnSom();
    });
    atualizarBtnSom();
  }
  window.addEventListener('keydown', function (e) {
    if ((e.code === 'Space' || e.code === 'Enter') &&
        document.activeElement !== btn && document.activeElement !== btnSom) {
      e.preventDefault();
      jogar();
    }
  });

  var espera;
  function aoRedimensionar() {
    clearTimeout(espera);
    espera = setTimeout(function () {
      medir();
      if (fase === 'ocioso') {
        if (resultado) { pousar(); } else { aplicarCamera(CAMERA[0]); aplicarSombra(CHAO); }
      }
    }, 120);
  }
  window.addEventListener('resize', aoRedimensionar);
  window.addEventListener('orientationchange', aoRedimensionar);

  medir();
  aplicarCamera(CAMERA[0]);
  aplicarSombra(CHAO);
  requestAnimationFrame(quadro);
})();
