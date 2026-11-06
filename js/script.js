/* ============================================================
   Consultório Odontológico do Dr. Marcelo Dercatshoff
   JS: efeitos 3D globais + slider 3D + interações
   ============================================================ */
(function () {
  'use strict';

  document.documentElement.classList.replace('no-js', 'js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------- Preloader ---------------- */
  var preloader = document.getElementById('preloader');
  function hidePreloader() {
    if (!preloader || preloader.classList.contains('done')) return;
    preloader.classList.add('done');
    setTimeout(function () { preloader.style.display = 'none'; }, 700);
  }
  window.addEventListener('load', function () { setTimeout(hidePreloader, 350); });
  setTimeout(hidePreloader, 3800); // fallback

  /* ---------------- WhatsApp: mensagens por tratamento ---------------- */
  document.querySelectorAll('[data-msg]').forEach(function (el) {
    var msg = el.getAttribute('data-msg');
    el.setAttribute('href', 'https://wa.me/5516992328650?text=' + encodeURIComponent(msg));
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  /* ---------------- Ano no rodapé ---------------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------------- Navegação ---------------- */
  var nav = document.getElementById('nav');
  var hamburger = document.getElementById('hamburger');
  var navMenu = document.getElementById('navMenu');

  function onScrollNav() {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      var open = navMenu.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navMenu.classList.remove('open');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ============================================================
     CAMADA 3D GLOBAL — parallax de mouse + fluxo no scroll
     ============================================================ */
  var shapes = Array.prototype.slice.call(document.querySelectorAll('.f3d'));
  var mouseX = 0, mouseY = 0, scrollY = 0, ticking = false;

  function updateBg3d() {
    ticking = false;
    var vh = window.innerHeight;
    var range = vh + 360;
    shapes.forEach(function (el) {
      var d = parseFloat(el.getAttribute('data-depth')) || 10;
      var baseTop = parseFloat(el.style.top) / 100 || 0;   // % -> fração
      var flow = (-(scrollY * d * 0.02) % range + range) % range; // sempre positivo
      var y = (baseTop * vh + flow - 180 + mouseY * d * 0.6);
      var x = mouseX * d;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    });
  }

  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateBg3d); }
  }

  if (!prefersReduced) {
    window.addEventListener('mousemove', function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;   // -1 .. 1
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      requestTick();
    }, { passive: true });
    window.addEventListener('scroll', function () {
      scrollY = window.scrollY;
      requestTick();
    }, { passive: true });
    scrollY = window.scrollY;
    updateBg3d();
  }

  /* ============================================================
     REVEAL 3D AO ROLAR (com stagger)
     ============================================================ */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  // stagger por grupo (mesmo pai)
  reveals.forEach(function (el) {
    var siblings = Array.prototype.slice.call(el.parentElement.children).filter(function (c) {
      return c.classList && c.classList.contains('reveal');
    });
    var idx = siblings.indexOf(el);
    el.style.setProperty('--d', Math.min(idx, 4) * 90 + 'ms');
  });

  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ============================================================
     TILT 3D nos cards
     ============================================================ */
  if (!isTouch && !prefersReduced) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      var MAX = 9;
      card.addEventListener('mouseenter', function () {
        card.style.transition = 'transform .12s ease-out';
      });
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          'perspective(800px) rotateY(' + (px * MAX).toFixed(2) + 'deg) rotateX(' +
          (-py * MAX).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform .5s ease';
        card.style.transform = '';
      });
    });
  }

  /* ============================================================
     SLIDER 3D (coverflow)
     ============================================================ */
  var stage = document.getElementById('s3dStage');
  if (stage) {
    var slider = document.getElementById('slider3d');
    var slides = Array.prototype.slice.call(stage.querySelectorAll('.s3d-slide'));
    var dotsWrap = document.getElementById('s3dDots');
    var prevBtn = document.getElementById('s3dPrev');
    var nextBtn = document.getElementById('s3dNext');
    var index = 0;
    var timer = null;
    var AUTOPLAY = 4800;

    // dots
    slides.forEach(function (s, i) {
      var dot = document.createElement('button');
      dot.className = 's3d-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Ir para o tratamento ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function place(slide, i) {
      var off = i - index;
      var abs = Math.abs(off);
      // em telas pequenas, esconde vizinhos distantes para não poluir
      var small = window.innerWidth < 640;
      if (small && abs >= 2) {
        slide.style.transform = 'translate(-50%,0) translateX(' + (off * 150) + '%) translateZ(-640px)';
        slide.style.opacity = 0;
        slide.style.zIndex = 0;
        slide.style.filter = 'blur(2px)';
        slide.style.pointerEvents = 'none';
        slide.setAttribute('aria-hidden', 'true');
        slide.classList.remove('is-center');
        slide.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
        return;
      }
      var t, opacity, z, blur, pe;
      if (abs === 0) {
        t = 'translate(-50%,0) translateX(0) translateZ(90px) rotateY(0deg) scale(1)';
        opacity = 1; z = 40; blur = 'blur(0px)'; pe = 'auto';
      } else if (abs === 1) {
        t = 'translate(-50%,0) translateX(' + (off * 62) + '%) translateZ(-170px) rotateY(' +
            (-off * 38) + 'deg) scale(.92)';
        opacity = .8; z = 30; blur = 'blur(.4px)'; pe = 'auto';
      } else if (abs === 2) {
        t = 'translate(-50%,0) translateX(' + (off * 106) + '%) translateZ(-380px) rotateY(' +
            (-off * 52) + 'deg) scale(.82)';
        opacity = .45; z = 20; blur = 'blur(1px)'; pe = 'auto';
      } else {
        t = 'translate(-50%,0) translateX(' + (off * 145) + '%) translateZ(-640px) rotateY(' +
            (-off * 58) + 'deg) scale(.75)';
        opacity = 0; z = 0; blur = 'blur(2px)'; pe = 'none';
      }
      slide.style.transform = t;
      slide.style.opacity = opacity;
      slide.style.zIndex = z;
      slide.style.filter = blur;
      slide.style.pointerEvents = pe;
      slide.setAttribute('aria-hidden', abs === 0 ? 'false' : 'true');
      slide.classList.toggle('is-center', abs === 0);
      slide.querySelectorAll('a').forEach(function (a) {
        a.tabIndex = abs === 0 ? 0 : -1;
      });
    }

    function update() {
      slides.forEach(place);
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      update();
    }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function start() {
      if (prefersReduced) return;
      stop();
      timer = setInterval(function () {
        if (document.hidden) return;
        next();
      }, AUTOPLAY);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    prevBtn.addEventListener('click', function () { prev(); restart(); });
    nextBtn.addEventListener('click', function () { next(); restart(); });

    // clique em slide lateral -> navega
    slides.forEach(function (s, i) {
      s.addEventListener('click', function (e) {
        if (i !== index && !dragged) { e.preventDefault(); goTo(i); restart(); }
      });
    });

    // teclado
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { next(); restart(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { prev(); restart(); e.preventDefault(); }
    });

    // arrastar (mouse e toque)
    var startX = 0, dragging = false, dragged = false;
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; dragged = false; startX = e.clientX;
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 60 && !dragged) {
        dragged = true;
        if (dx < 0) next(); else prev();
        restart();
      }
    });
    window.addEventListener('pointerup', function () {
      if (dragging) setTimeout(function () { dragged = false; }, 120);
      dragging = false;
    });

    // pausa autoplay em interação
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('touchstart', stop, { passive: true });
    slider.addEventListener('touchend', start);

    update();
    start();
    window.addEventListener('resize', function () {
      clearTimeout(window.__s3dRz);
      window.__s3dRz = setTimeout(update, 150);
    });
  }

  /* ---------------- Escuta de âncoras com offset do menu ---------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

})();
