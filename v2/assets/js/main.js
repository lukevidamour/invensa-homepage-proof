/* V2 copy of site/assets/js/main.js (Charlotte's amends, 25 Nov); changes marked "V2". V1 is untouched. */
/* Invensa homepage behaviour. Vanilla, no build step: each block maps to one Astro component. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var PROOF = true; // proof build: links to pages not yet designed show a note instead of a 404
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!RM && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.2, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(0);
  }
  var nav = $('[data-nav]');
  function navH() { return nav ? nav.offsetHeight : 0; }
  // V2: the nav stays in view, so a jump lands 32px clear of it (V1 landed right under it, then tucked the nav away)
  function scrollToEl(el) {
    var stack = el.closest && el.closest('[data-reveal-stack].is-pinned');
    if (stack) {                                   // V2: the pinned film band sits under the hero; arriving there means scrolling the hero away
      var y = stack.querySelector('.hero').offsetHeight;
      if (lenis) lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
      return;
    }
    if (lenis) lenis.scrollTo(el, { offset: -(navH() + 32) });
    else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var el = $(id); if (!el) return;
      e.preventDefault(); scrollToEl(el);
      if (el.id !== 'main') history.replaceState(null, '', id);
    });
  });

  /* ---------- Nav: transparent on the hero, solid after. V2: it stays in view all the way down (Charlotte: "Top nav
     bar stays visible as you scroll down page"); V1 tucked it away on the way down ---------- */
  var hero = $('.hero'), lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY, past = hero ? y > hero.offsetHeight - navH() - 1 : y > 10;
    if (!nav.classList.contains('is-open')) {
      nav.classList.toggle('is-solid', past);
      nav.classList.remove('is-hidden');
    }
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // About dropdown: click, hover on fine pointers, Escape and outside click close it
  var drop = $('.nav__drop'), dropBtn = drop && $('button', drop), dropT, hoverOpened = 0;
  function setDrop(open) { if (dropBtn) dropBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  if (dropBtn) {
    // a click that lands just after hover opened the menu keeps it open, rather than toggling it shut
    dropBtn.addEventListener('click', function () {
      if (Date.now() - hoverOpened < 700) { setDrop(true); return; }
      setDrop(dropBtn.getAttribute('aria-expanded') !== 'true');
    });
    if (FINE) {
      drop.addEventListener('mouseenter', function () { clearTimeout(dropT); if (dropBtn.getAttribute('aria-expanded') !== 'true') hoverOpened = Date.now(); setDrop(true); });
      drop.addEventListener('mouseleave', function () { dropT = setTimeout(function () { setDrop(false); }, 220); });
    }
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) setDrop(false); });
    drop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setDrop(false); dropBtn.focus(); } });
    drop.addEventListener('focusout', function (e) { if (!drop.contains(e.relatedTarget)) setDrop(false); });
  }

  // Mobile menu
  var toggle = $('.nav__toggle'), menu = $('#mobile-menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.nav__toggle-label', toggle).textContent = open ? 'Close' : 'Menu';
    if (open) {
      menu.hidden = false;
      $$('.mmenu__list a', menu).forEach(function (a, i) { a.style.transitionDelay = (0.12 + i * 0.045) + 's'; });
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
      nav.classList.add('is-open'); nav.classList.remove('is-solid', 'is-hidden');
      doc.style.overflow = 'hidden'; if (lenis) lenis.stop();
    } else {
      menu.classList.remove('is-open'); nav.classList.remove('is-open');
      $$('.mmenu__list a', menu).forEach(function (a) { a.style.transitionDelay = '0s'; });
      setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 600);
      doc.style.overflow = ''; if (lenis) lenis.start();
      onScroll();
    }
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
      // keep Tab inside the open menu: logo, toggle and menu links only
      if (e.key === 'Tab') {
        var f = [$('.nav__logo'), toggle].concat($$('a, button', menu));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------- Hero intro: waits for the type so nothing jumps ---------- */
  var started = false;
  function go() {
    if (started) return; started = true;
    if (hero) hero.classList.add('is-ready');
    if (window.PrecisionPoints) window.PrecisionPoints.init();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
  setTimeout(go, 1400);

  /* ---------- Reveal on scroll: once, with a gentle stagger for siblings arriving together ---------- */
  var reveals = $$('[data-reveal]');
  if (RM || !('IntersectionObserver' in window)) {
    reveals.forEach(function (n) { n.classList.add('is-in'); });
  } else {
    var rio = new IntersectionObserver(function (es) {
      var batch = es.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      batch.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
      batch.forEach(function (n, i) { n.style.setProperty('--d', Math.min(i * 0.09, 0.45) + 's'); n.classList.add('is-in'); rio.unobserve(n); });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach(function (n) { rio.observe(n); });
  }

  /* ---------- Timeline ---------- */
  var tl = $('[data-timeline]');
  if (tl) {
    if (RM || !('IntersectionObserver' in window)) tl.classList.add('is-in');
    else new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { tl.classList.add('is-in'); o.disconnect(); } }, { threshold: .35 }).observe(tl);
  }

  /* ---------- Challenge: the three illustrated pressures, drawn by assets/js/pressure-anims.js. Each plays only
     while on screen and shows a finished still with reduced motion; the returned handles have play() and pause()
     for the page-level pause control due before launch (WCAG 2.2.2). ---------- */
  var pressures = window.PressureAnims ? window.PressureAnims.mountAll() : [];

  /* ---------- Background film (the contact banner): loads only when near and plays only
     while seen; with reduced motion they stay on their poster. An inner [data-parallax] drifts slower than the page. ---------- */
  $$('[data-video]').forEach(function (box) {
    var video = $('video', box), media = $('[data-parallax]', box), loaded = false;
    if (!video) return;
    if (window.matchMedia('(max-width: 699px)').matches && video.getAttribute('data-poster-portrait')) video.poster = video.getAttribute('data-poster-portrait');
    function load() { if (loaded) return; loaded = true; $$('source', video).forEach(function (s) { s.src = s.getAttribute('data-src'); }); video.load(); }
    if (RM) return;   // poster only: no download, no motion
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) load(); }, { rootMargin: '800px 0px' }).observe(box);
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { load(); var p = video.play(); if (p && p.catch) p.catch(function () {}); }
        else video.pause();
      }, { threshold: .15 }).observe(box);
    } else { load(); video.play(); }
    if (media) {
      var par = function () {
        var r = box.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
        media.style.transform = 'translate3d(0,' + (p * 6).toFixed(2) + '%,0)';
      };
      if (lenis) lenis.on('scroll', par); else window.addEventListener('scroll', par, { passive: true });
      par();
    }
  });

  /* ---------- Who it's for: tabs at 900px and up, accordion below ---------- */
  var aud = $('[data-tabs]');
  if (aud) {
    var tabs = $$('.aud__tab', aud), panels = $$('.aud__panel', aud), list = $('[data-tablist]', aud);
    var mq = window.matchMedia('(min-width: 900px)'), active = 0;

    function moveMarker() {
      var t = tabs[active]; if (!t || !mq.matches) return;
      list.style.setProperty('--my', t.offsetTop + 'px');
      list.style.setProperty('--mh', t.offsetHeight + 'px');
    }
    function select(i, focus) {
      if (i === active && aud.classList.contains('is-tabs') && !focus) return;
      var prev = active; active = i;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) {
        var on = k === i;
        p.hidden = !on;
        if (on && prev !== i) { p.classList.remove('is-entering'); void p.offsetWidth; p.classList.add('is-entering'); }
      });
      if (focus) tabs[i].focus();
      moveMarker();
    }
    function asTabs() {
      aud.classList.add('is-tabs');
      list.setAttribute('role', 'tablist');
      list.setAttribute('aria-label', 'Teams');
      list.setAttribute('aria-owns', tabs.map(function (t) { return t.id; }).join(' '));
      tabs.forEach(function (t) { t.setAttribute('role', 'tab'); t.removeAttribute('aria-expanded'); });
      panels.forEach(function (p) { p.setAttribute('role', 'tabpanel'); p.tabIndex = 0; });
      active = Math.max(0, active); select(active, false); active = active; // ensure state
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === active ? 'true' : 'false'); t.tabIndex = k === active ? 0 : -1; });
      panels.forEach(function (p, k) { p.hidden = k !== active; });
      moveMarker();
    }
    function asAccordion() {
      aud.classList.remove('is-tabs');
      list.removeAttribute('role'); list.removeAttribute('aria-owns'); list.removeAttribute('aria-label');
      tabs.forEach(function (t, k) {
        t.removeAttribute('role'); t.removeAttribute('aria-selected'); t.tabIndex = 0;
        t.setAttribute('aria-expanded', k === active ? 'true' : 'false');
      });
      panels.forEach(function (p, k) { p.removeAttribute('role'); p.removeAttribute('tabindex'); p.hidden = k !== active; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        if (mq.matches) { select(i, false); return; }
        var open = t.getAttribute('aria-expanded') === 'true';
        t.setAttribute('aria-expanded', open ? 'false' : 'true');
        panels[i].hidden = open;
        if (!open) active = i;
      });
      t.addEventListener('keydown', function (e) {
        if (!mq.matches) return;
        var k = e.key, n = tabs.length, to = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') to = (i + 1) % n;
        if (k === 'ArrowUp' || k === 'ArrowLeft') to = (i - 1 + n) % n;
        if (k === 'Home') to = 0;
        if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
    function mode() { mq.matches ? asTabs() : asAccordion(); }
    mq.addEventListener('change', mode);
    mode();
    window.addEventListener('resize', moveMarker);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveMarker);
  }

  /* ---------- Proof: pages not designed yet ---------- */
  var toast = $('.toast'), toastT;
  if (PROOF) {
    $$('[data-unbuilt]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        toast.textContent = 'This page is designed in the next round';
        toast.hidden = false;
        requestAnimationFrame(function () { toast.classList.add('is-on'); });
        clearTimeout(toastT);
        toastT = setTimeout(function () { toast.classList.remove('is-on'); setTimeout(function () { toast.hidden = true; }, 600); }, 2400);
      });
    });
  }

  /* ---------- Cursor: Smart Purple point, opens and inverts over anything clickable ---------- */
  if (FINE && !RM) {
    var cur = $('.cursor'), dot = $('.cursor__dot', cur), cx = -100, cy = -100;
    doc.classList.add('has-cursor');
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX; cy = e.clientY;
      cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      var t = e.target;
      var link = t.closest && t.closest('a, button, [role="tab"], label, input, select, textarea');
      // V2: over the nav bar (not the open phone menu) the point closes to a fine ring instead of opening up
      var inNav = !!(t.closest && t.closest('.nav__bar')) && !nav.classList.contains('is-open');
      cur.classList.toggle('is-nav', inNav && !!link);
      cur.classList.toggle('is-link', !!link && !inNav);
      var dark = t.closest && (t.closest('[data-theme="dark"], .mmenu') || (nav.contains(t) && !nav.classList.contains('is-solid')));
      cur.classList.toggle('is-dark', !!dark);
      cur.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.add('is-hidden'); });
    window.addEventListener('blur', function () { cur.classList.add('is-hidden'); });
  }
})();
