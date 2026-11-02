// La Solución · Reformas: menú, formulario a WhatsApp, comparadores antes/después, scroll suave, parallax y entradas de texto
(function () {
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tactil = matchMedia('(hover: none), (pointer: coarse)').matches;
  var g = window.gsap, ST = window.ScrollTrigger;

  // ---------- menú ----------
  var bm = document.querySelector('[data-menu]'), pm = document.querySelector('[data-menu-panel]');
  function menu(abrir) { if (!bm) return; bm.setAttribute('aria-expanded', abrir ? 'true' : 'false'); bm.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú'); pm.hidden = !abrir; document.body.style.overflow = abrir ? 'hidden' : ''; }
  if (bm) { bm.addEventListener('click', function () { menu(bm.getAttribute('aria-expanded') !== 'true'); }); pm.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); }); }

  // ---------- formulario → WhatsApp ----------
  document.querySelectorAll('form[data-whatsapp]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(f), l = ['Hola, quiero pedir presupuesto para una reforma.'];
      if (d.get('nombre')) l.push('Nombre: ' + d.get('nombre')); if (d.get('telefono')) l.push('Teléfono: ' + d.get('telefono'));
      l.push('Tipo: ' + d.get('tipo')); if (d.get('mensaje')) l.push(d.get('mensaje'));
      open('https://wa.me/' + f.dataset.whatsapp + '?text=' + encodeURIComponent(l.join('\n')), '_blank', 'noopener');
    });
  });

  // ---------- comparadores antes / después ----------
  document.querySelectorAll('[data-comp]').forEach(function (c) {
    var marco = c.querySelector('.comp__marco'), rango = c.querySelector('.comp__rango');
    var pon = function (v) { v = Math.max(0, Math.min(100, v)); marco.style.setProperty('--pos', v + '%'); rango.value = v; };
    rango.addEventListener('input', function () { pon(+rango.value); });
    // arrastre con el dedo o el ratón en cualquier punto de la foto (el scroll vertical sigue funcionando)
    var activo = false;
    var mueve = function (e) { var r = marco.getBoundingClientRect(); pon((e.clientX - r.left) / r.width * 100); };
    marco.addEventListener('pointerdown', function (e) { activo = true; mueve(e); });
    addEventListener('pointermove', function (e) { if (activo) mueve(e); }, { passive: true });
    addEventListener('pointerup', function () { activo = false; });
    addEventListener('pointercancel', function () { activo = false; });
    c._pon = pon;
  });

  // ---------- carruseles: flechas redondas que avanzan una tarjeta (se ocultan si todo cabe) ----------
  document.querySelectorAll('[data-carrusel]').forEach(function (c) {
    var p = c.querySelector('[data-carrusel-pista]'), ant = c.querySelector('[data-prev]'), sig = c.querySelector('[data-next]');
    var paso = function (d) { var t = p.firstElementChild; p.scrollBy({ left: d * (t ? t.getBoundingClientRect().width + 14 : p.clientWidth * .8), behavior: reducido ? 'auto' : 'smooth' }); };
    var estado = function () {
      var max = p.scrollWidth - p.clientWidth;
      c.classList.toggle('sin-desborde', max <= 2); ant.disabled = p.scrollLeft <= 4; sig.disabled = p.scrollLeft >= max - 4;
    };
    ant.addEventListener('click', function () { paso(-1); }); sig.addEventListener('click', function () { paso(1); });
    p.addEventListener('scroll', estado, { passive: true }); addEventListener('resize', estado); estado();
  });

  // ---------- obra paso a paso: la fase que cruza el centro de la pantalla cambia la foto fija, el rótulo y la barra ----------
  document.querySelectorAll('[data-fases]').forEach(function (sec) {
    var fases = sec.querySelectorAll('[data-fase]'), fotos = sec.querySelectorAll('[data-foto]'), segs = sec.querySelectorAll('.fases__barra i');
    var n = sec.querySelector('[data-fase-n]'), t = sec.querySelector('[data-fase-t]');
    var activa = function (i) {
      fases.forEach(function (f, j) { f.classList.toggle('es-activa', j === i); });
      fotos.forEach(function (f, j) { f.classList.toggle('es-activa', j === i); });
      segs.forEach(function (s, j) { s.classList.toggle('hecho', j <= i); });
      if (n) n.textContent = 'Fase ' + (i + 1) + ' de ' + fases.length;
      if (t) t.textContent = fases[i].querySelector('h3').textContent;
    };
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) activa(+e.target.dataset.fase); });
    }, { rootMargin: '-48% 0px -48% 0px' });
    fases.forEach(function (f) { io.observe(f); });
  });

  // ---------- cabecera: sólida al bajar, se oculta al bajar rápido y vuelve al subir ----------
  var cab = document.querySelector('[data-cab]'), ultimo = 0;
  function cabecera(y) {
    if (!cab) return;
    cab.classList.toggle('es-solida', y > 40 || !document.querySelector('[data-hero-img]'));
    cab.classList.toggle('se-oculta', y > ultimo && y > innerHeight * .9 && !(pm && !pm.hidden));
    ultimo = y;
  }
  cabecera(scrollY);

  if (!g || !ST || reducido) {
    addEventListener('scroll', function () { cabecera(scrollY); }, { passive: true });
    document.querySelectorAll('[data-revela]').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }
  g.registerPlugin(ST); if (window.SplitText) g.registerPlugin(window.SplitText);

  // ---------- scroll suave (solo con ratón/trackpad) ----------
  var lenis = null;
  if (window.Lenis && !tactil) {
    lenis = new Lenis({ lerp: .11, wheelMultiplier: 1 });
    lenis.on('scroll', function (e) { ST.update(); cabecera(e.scroll); });
    g.ticker.add(function (t) { lenis.raf(t * 1000); }); g.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash || u.hash.length < 2) return;
        var t = document.querySelector(u.hash); if (!t) return; ev.preventDefault(); lenis.scrollTo(t, { offset: -10, duration: 1.4 });
      });
    });
  } else addEventListener('scroll', function () { cabecera(scrollY); }, { passive: true });

  // ---------- hero: entrada del titular y parallax de la foto ----------
  var heroImg = document.querySelector('[data-hero-img]');
  if (heroImg) {
    g.fromTo(heroImg, { scale: 1.08 }, { scale: 1, duration: 2.2, ease: 'expo.out' });
    g.to(heroImg, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: heroImg.parentNode, start: 'top top', end: 'bottom top', scrub: true } });
    g.from('.hero__entrada, .hero__cta, .hero .etq, .srv-hero .migas', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, delay: .35 });
    var fi = document.querySelector('.ficha');
    if (fi && getComputedStyle(fi).display !== 'none') g.from(fi, { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out', delay: .7 });
  }

  // ---------- titulares por líneas ----------
  var splits = function () {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      if (!window.SplitText) return;
      var s = new SplitText(el, { type: 'lines', linesClass: 'ln' });
      s.lines.forEach(function (l) { l.innerHTML = '<span class="ln__in">' + l.innerHTML + '</span>'; });
      var enHero = el.closest('.hero, .srv-hero');
      g.from(el.querySelectorAll('.ln__in'), enHero ? { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: .08, delay: .1 }
        : { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    ST.refresh();
  };
  if (document.fonts) document.fonts.ready.then(splits); else splits();

  // ---------- tarjetas y pasos que entran al verse ----------
  g.utils.toArray('[data-revela]').forEach(function (el, i) {
    g.to(el, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', delay: (i % 3) * .08, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  // ---------- parallax interior de las fotos ----------
  g.utils.toArray('[data-parallax-caja]').forEach(function (caja) {
    var im = caja.querySelector('.parallax'); if (!im) return;
    g.fromTo(im, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: caja, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------- comparadores: la línea hace un pequeño barrido la primera vez que se ven ----------
  document.querySelectorAll('[data-comp]').forEach(function (c) {
    var o = { v: 50 };
    ST.create({ trigger: c, start: 'top 70%', once: true, onEnter: function () {
      g.timeline().to(o, { v: 22, duration: .9, ease: 'power2.inOut', onUpdate: function () { c._pon(o.v); } })
        .to(o, { v: 50, duration: 1.1, ease: 'power3.inOut', onUpdate: function () { c._pon(o.v); } });
    } });
  });

  addEventListener('load', function () { ST.refresh(); });
})();
