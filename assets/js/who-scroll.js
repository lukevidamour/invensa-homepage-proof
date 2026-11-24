/* Who it's for, pinned (option 6, Tom via Luke, 24 Nov: "rather than clicking through each tab ... a scroll action so it
   locks full screen and you scroll through each section before moving on").
   The section is made taller by one scroll step per team (CSS .who.is-pinned) and its stage sticks to the screen while
   you scroll through them. The scroll position picks the team by driving main.js's own tabs, so the marker, the panel
   transition and the ARIA state are unchanged. Clicking a team, or the arrow keys, glides the page to that team's step,
   so the scroll and the selection never disagree. Pinned only from 900px up and when the whole stage fits the screen;
   otherwise main.js's tabs (short screens) or accordion (under 900px) as before. No wheel hijacking: it is plain sticky
   positioning, so trackpads, keyboards and scrollbars behave normally. */
(function () {
  'use strict';
  var sec = document.querySelector('[data-pin-steps]');
  if (!sec) return;
  var stage = sec.querySelector('.who__stage'), wrap = stage && stage.firstElementChild;
  var tabs = [].slice.call(sec.querySelectorAll('.aud__tab')), n = tabs.length;
  if (!stage || !wrap || n < 2) return;
  var mq = window.matchMedia('(min-width: 900px)');
  var on = false, current = 0, driving = false, gliding = false, ticking = false;

  function range() { return sec.offsetHeight - window.innerHeight; }
  function stepTop(i) {                           // where team i's step begins, a little in so it settles
    var top = sec.getBoundingClientRect().top + window.scrollY;
    return top + range() * (i + 0.12) / n;
  }
  function choose(i) {
    if (i === current && tabs[i].getAttribute('aria-selected') === 'true') return;
    current = i; driving = true; tabs[i].click(); driving = false;
  }
  function update() {
    ticking = false;
    if (!on || gliding) return;
    var p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / range()));
    choose(Math.min(n - 1, Math.floor(p * n)));
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  // glide to a team's step (the page's own curve, about a second), without re-picking the teams passed on the way
  function glide(i) {
    var from = window.scrollY, to = stepTop(i), t0 = null, dur = 900;
    if (Math.abs(to - from) < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { window.scrollTo(0, to); return; }
    gliding = true;
    (function frame(t) {
      if (t0 === null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);   // ease-out, like --ease
      window.scrollTo(0, from + (to - from) * e);
      if (k < 1) requestAnimationFrame(frame); else { gliding = false; current = i; }
    })(performance.now());
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { if (on && !driving) { current = i; glide(i); } });
    t.addEventListener('keydown', function () {   // main.js moves the selection on arrows, Home and End; follow it
      if (!on) return;
      setTimeout(function () {
        var k = tabs.findIndex(function (x) { return x.getAttribute('aria-selected') === 'true'; });
        if (k > -1 && k !== current) { current = k; glide(k); }
      }, 0);
    });
  });

  function fit() {
    sec.classList.remove('is-pinned');
    on = false;
    if (!mq.matches) return;
    sec.style.setProperty('--steps', n);
    sec.classList.add('is-pinned');
    var cs = getComputedStyle(stage);
    var need = wrap.offsetHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    if (need > window.innerHeight) { sec.classList.remove('is-pinned'); return; }   // too short to pin: plain tabs
    on = true;
    update();
  }

  var rt;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 150); });
  if (mq.addEventListener) mq.addEventListener('change', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();
})();
