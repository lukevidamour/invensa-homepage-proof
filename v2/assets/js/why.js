/* Why options 6 and 7 (proof): the entrances, and the scroller's arrows and mouse drag */
(function () {
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rv = [].slice.call(document.querySelectorAll('[data-rv]'));
  if (RM || !('IntersectionObserver' in window)) rv.forEach(function (e) { e.classList.add('is-in'); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .15 });
    rv.forEach(function (e) { io.observe(e); });
  }
  var track = document.querySelector('.o6__track'); if (!track) return;
  var prev = document.querySelector('.o6__btn--prev'), next = document.querySelector('.o6__btn--next');
  var list = track.firstElementChild, first = list.querySelector('.card');
  function step() { return first.getBoundingClientRect().width + (parseFloat(getComputedStyle(list).columnGap) || 0); }
  function update() { var max = track.scrollWidth - track.clientWidth; prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft >= max - 2; }
  prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: RM ? 'auto' : 'smooth' }); });
  next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: RM ? 'auto' : 'smooth' }); });
  // a sideways swipe belongs to the track: stop it reaching the page's smooth scroll (Lenis listens on window and would
  // swallow it), but leave the default alone so the browser scrolls the cards natively. Vertical swipes pass straight through.
  track.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); }, { passive: true });
  track.addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  var down = false, moved = false, sx = 0, sl = 0, t;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; clearTimeout(t); track.classList.add('is-drag');
  });
  addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
  addEventListener('pointerup', function () {
    if (!down) return; down = false;
    var s = step(); track.scrollTo({ left: Math.round(track.scrollLeft / s) * s, behavior: RM ? 'auto' : 'smooth' });
    t = setTimeout(function () { track.classList.remove('is-drag'); }, 700);
  });
  track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
})();
