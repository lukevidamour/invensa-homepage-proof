/* Precision Points: Invensa's own brand device (identity guidelines p31 to 32), drawn live.
   Rules taken from the guidelines and kept here so nobody "improves" them away:
   - a fixed grid of points, each the same size, evenly spaced
   - two or three dynamic lines at a time, straight only (vertical, horizontal, 45 degrees), never bent, crossed or on a collision course
   - each line blends from clear to solid, like the Portal symbol
   - Smart Purple or Minimal White only
   Used three ways on the homepage: the hero field (ambient), the marks drawn over the challenge scenes (markup in index.html), and the buy/hold/pull diagrams. */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var TAU = Math.PI * 2;
  function easeIO(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ------------------------------------------------------------------ */
  /* Hero field                                                          */
  /* ------------------------------------------------------------------ */
  function HeroField(canvas) {
    var hero = canvas.closest('.hero');
    var ctx = canvas.getContext('2d');
    var W, H, dpr, sp, cols, rows, ox, oy, dots, grid, cache, exclude, floorY, sheen, SR;
    var lines = [], nextSpawn = 0, t0 = 0, raf = 0, running = false, introDone = false, visible = true;
    var m = { x: -9999, y: -9999, tx: -9999, ty: -9999, k: 0, on: false };
    var sh = { x: -9999, y: -9999 };                                       // the sheen follows on a longer lag than the points
    var warm = [];                                                         // points still holding the pointer's warmth
    // vertical and diagonal read best (and match the guideline artwork); horizontals are rarer
    var DIRS = [[0, 1], [0, -1], [0, 1], [1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0]];

    function build() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sp = W >= 1100 ? 30 : W >= 700 ? 28 : 24;
      cols = Math.floor((W - sp) / sp) + 1; rows = Math.floor((H - sp) / sp) + 1;
      ox = (W - (cols - 1) * sp) / 2; oy = (H - (rows - 1) * sp) / 2;

      var hr = hero.getBoundingClientRect();
      var cr = hero.querySelector('.hero__copy').getBoundingClientRect();
      var br = hero.querySelector('.hero__backers');
      floorY = br ? br.getBoundingClientRect().top - hr.top - sp * .5 : H;
      // lines never run behind the copy
      exclude = { x0: cr.left - hr.left - sp, x1: cr.right - hr.left + sp, y0: cr.top - hr.top - sp, y1: cr.bottom - hr.top + sp };

      dots = []; grid = {}; warm = [];
      var cx = W / 2, cy = (cr.top + cr.bottom) / 2 - hr.top, maxD = Math.hypot(W / 2, H / 2);
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var x = ox + i * sp, y = oy + j * sp;
          if (y > floorY) continue;
          var d = Math.hypot(x - cx, (y - cy) * 1.3);
          // quieter behind the headline, fuller towards the edges: legibility from contrast, not effects
          var a = .06 + .15 * clamp(d / (maxD * .8), 0, 1);
          // c: how much pointer warmth a point may take. Under half behind the copy, so nothing busy ever sits under the white type
          var ex = Math.max(exclude.x0 - x, 0, x - exclude.x1), ey = Math.max(exclude.y0 - y, 0, y - exclude.y1);
          var c = .45 + .55 * clamp(Math.hypot(ex, ey) / (sp * 2.5), 0, 1);
          var p = { x: x, y: y, i: i, j: j, a: a, c: c, delay: (d / maxD) * 1200 };
          dots.push(p); grid[i + ',' + j] = p;
        }
      }
      cache = document.createElement('canvas');
      cache.width = canvas.width; cache.height = canvas.height;
      var c = cache.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#fff';
      for (var n = 0; n < dots.length; n++) { c.globalAlpha = dots[n].a; c.beginPath(); c.arc(dots[n].x, dots[n].y, 1.1, 0, TAU); c.fill(); }
      lines = [];

      /* The sheen: a soft pool of light in the aubergine's own family that drifts after the pointer (Luke, 23 Nov:
         "a very subtle light gradient on the background follow the mouse"). Painted once into a sprite at half
         resolution with dithered alpha, so the long, faint falloff never bands; the hero grain sits on top as well. */
      SR = W >= 1100 ? 640 : 480;
      var S = SR, half = S / 2;
      sheen = document.createElement('canvas'); sheen.width = sheen.height = S;
      var sx = sheen.getContext('2d'), img = sx.createImageData(S, S), px = img.data;
      for (var yy = 0; yy < S; yy++) for (var xx = 0; xx < S; xx++) {
        var dx = (xx + .5 - half) / half, dy = (yy + .5 - half) / half, d2 = dx * dx + dy * dy, o = (yy * S + xx) * 4;
        var v = d2 < 1 ? Math.pow(1 - d2, 3) : 0;                           // a broad, soft peak with no visible edge
        px[o] = 168; px[o + 1] = 128; px[o + 2] = 190;                       // a lilac light from Smart Purple's family, not a coloured glow
        px[o + 3] = v > 0 ? clamp(Math.round(SHEEN * 255 * v + (Math.random() - .5) * 1.6), 0, 255) : 0;
      }
      sx.putImageData(img, 0, 0);
    }
    var SHEEN = .085;                                                        // peak opacity of the sheen; the lowest level that still reads

    // keep lines clear of the copy and of the nav bar
    function inExclude(x, y) { return (x > exclude.x0 && x < exclude.x1 && y > exclude.y0 && y < exclude.y1) || y < 76 + sp; }
    function tooClose(pts) {
      for (var a = 0; a < lines.length; a++) {
        var q = lines[a].pts;
        for (var b = 0; b < q.length; b++) for (var c = 0; c < pts.length; c++) {
          if (Math.abs(q[b].x - pts[c].x) < sp * 2.5 && Math.abs(q[b].y - pts[c].y) < sp * 2.5) return true;
        }
      }
      return false;
    }
    function spawn(now) {
      var dirs = W < 700 ? DIRS.slice(0, 7) : DIRS;
      for (var tries = 0; tries < 80; tries++) {
        var p = dots[(Math.random() * dots.length) | 0];
        var d = dirs[(Math.random() * dirs.length) | 0];
        var len = 3 + ((Math.random() * (W < 700 ? 3 : 5)) | 0);
        var pts = [], ok = true;
        for (var k = 0; k <= len; k++) {
          var q = grid[(p.i + d[0] * k) + ',' + (p.j + d[1] * k)];
          if (!q || inExclude(q.x, q.y)) { ok = false; break; }
          pts.push(q);
        }
        if (!ok || tooClose(pts)) continue;
        return { a: pts[0], b: pts[len], pts: pts, born: now, din: 1500 + len * 160, hold: 2400 + Math.random() * 2000, dout: 1600 };
      }
      return null;
    }

    /* Once, after the intro, one line travels in and lands on the tagline's full stop, which becomes a point in
       the field ("on demand"). Found, not announced. Positioned from the real glyph metrics of the full stop. */
    var stopEl = hero.querySelector('.hero__stop'), stopDone = false;
    function stopLine(now) {
      if (!stopEl) return null;
      var hr = hero.getBoundingClientRect(), r = stopEl.getBoundingClientRect(), st = getComputedStyle(stopEl);
      var c = document.createElement('canvas').getContext('2d');
      var spec = st.fontSize + ' ' + st.fontFamily;
      c.font = st.fontWeight + ' ' + spec;
      // older canvas parsers reject weights between hundreds (the display weight is 350): fall back to the nearest hundred
      if (/^10px sans-serif$/.test(c.font)) c.font = (Math.round(parseFloat(st.fontWeight) / 100) * 100 || 400) + ' ' + spec;
      var mt = c.measureText('.'), fs = parseFloat(st.fontSize);
      var asc = mt.fontBoundingBoxAscent || fs * .9;
      var cx = r.left - hr.left + (mt.actualBoundingBoxRight - mt.actualBoundingBoxLeft) / 2;
      var cy = r.top - hr.top + asc - (mt.actualBoundingBoxAscent - mt.actualBoundingBoxDescent) / 2;
      var rad = (mt.actualBoundingBoxRight + mt.actualBoundingBoxLeft) / 2;
      // in on the diagonal from the upper right: horizontal would read as "demand.—", an em dash
      var o = (rad + 4) / Math.SQRT2, x2 = cx + o, y2 = cy - o;
      var d = Math.min(sp * (W < 700 ? 2 : 3), W - 10 - x2, y2 - 90);
      if (d < sp) return null;
      var a = { x: x2 + d, y: y2 - d }, b = { x: x2, y: y2 };
      return { a: a, b: b, pts: [a, b], born: now, din: 1700, hold: 2800, dout: 1500, noHead: true };
    }

    function drawLine(l, head, tail, fade) {
      var hx = l.a.x + (l.b.x - l.a.x) * head, hy = l.a.y + (l.b.y - l.a.y) * head;
      var tx = l.a.x + (l.b.x - l.a.x) * tail, ty = l.a.y + (l.b.y - l.a.y) * tail;
      if (Math.abs(hx - tx) + Math.abs(hy - ty) < .5) return;
      var g = ctx.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, 'rgba(231,214,238,0)');
      g.addColorStop(1, 'rgba(244,236,247,' + (.92 * fade) + ')');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      if (l.noHead) return; // the full stop is the point
      ctx.globalAlpha = .95 * fade; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(hx, hy, 1.9, 0, TAU); ctx.fill();
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!t0) { t0 = now; nextSpawn = now + 900; }
      var t = now - t0;
      ctx.clearRect(0, 0, W, H);

      // the sheen sits under the points and trails a beat behind them: two layers moving at two speeds read as depth
      sh.x += (m.tx - sh.x) * .028; sh.y += (m.ty - sh.y) * .028;
      if (m.k > .005) { ctx.globalAlpha = m.k; ctx.drawImage(sheen, sh.x - SR, sh.y - SR, SR * 2, SR * 2); }
      ctx.fillStyle = '#fff';

      if (!introDone) {
        var all = true;
        for (var n = 0; n < dots.length; n++) {
          var p = dots[n], k = clamp((t - p.delay) / 800, 0, 1);
          if (k < 1) all = false;
          if (k <= 0) continue;
          ctx.globalAlpha = p.a * easeOut(k);
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, TAU); ctx.fill();
        }
        if (all) introDone = true;
      } else {
        ctx.globalAlpha = 1; ctx.drawImage(cache, 0, 0, W, H);
      }

      /* The field answers the pointer (Rogo's hero, in Invensa's points): a pool of warmth follows the cursor.
         Points inside it swell and brighten a little and lean very slightly away, and each keeps its warmth for a
         moment after the pointer has passed, cooling slowly, so the pool trails behind the cursor like a wake.
         The pointer itself is followed with a soft lag, so nothing snaps. Fine pointers only.
         Calmed on Luke's note (23 Nov, "too distracting and not subtle enough ... never really fully white"):
         points grow by half at most (was 2.5x), never pass 34% opacity (was 80%), take under half the warmth
         behind the copy, lean 1px (was 2.2) and cool a little faster. The white type is always the brightest thing. */
      m.k += ((m.on ? 1 : 0) - m.k) * .03;                              // eases in and out over about a second
      m.x += (m.tx - m.x) * .045; m.y += (m.ty - m.y) * .045;          // a slow, weighted follow: luxurious, never fidgety
      if (introDone) {
        if (m.k > .01) {
          var R = W < 1100 ? 240 : 300, i0 = Math.floor((m.x - R - ox) / sp), i1 = Math.ceil((m.x + R - ox) / sp);
          var j0 = Math.floor((m.y - R - oy) / sp), j1 = Math.ceil((m.y + R - oy) / sp);
          for (var jj = j0; jj <= j1; jj++) for (var ii = i0; ii <= i1; ii++) {
            var q = grid[ii + ',' + jj]; if (!q) continue;
            var dd = Math.hypot(q.x - m.x, q.y - m.y); if (dd > R) continue;
            var u = 1 - dd / R, f = u * u * (3 - 2 * u) * m.k;            // smoothstep: soft edge, full centre
            if (f > (q.h || 0)) { q.h = f; if (!q.hot) { q.hot = true; warm.push(q); } }
          }
        }
        ctx.fillStyle = '#fff';
        for (var w = warm.length - 1; w >= 0; w--) {
          var p = warm[w];
          var dx = p.x - m.x, dy = p.y - m.y, dl = Math.hypot(dx, dy) || 1;
          var push = p.h;                                                  // the lean: 1px at most
          ctx.globalAlpha = Math.min(.34, p.a + p.h * .2 * p.c);
          ctx.beginPath(); ctx.arc(p.x + dx / dl * push, p.y + dy / dl * push, 1.1 + p.h * .55 * p.c, 0, TAU); ctx.fill();
          p.h *= .965;                                                     // cools over about a second and a half
          if (p.h < .012) { p.h = 0; p.hot = false; warm.splice(w, 1); }
        }
      }

      if (!stopDone && t > 2300) { stopDone = true; var sl = stopLine(now); if (sl) lines.push(sl); }
      if (now > nextSpawn && lines.length < (W < 700 ? 2 : 3)) {
        var l = spawn(now);
        if (l) lines.push(l);
        nextSpawn = now + 700 + Math.random() * 1500;
      }
      for (var s = lines.length - 1; s >= 0; s--) {
        var L = lines[s], age = now - L.born, head, tail;
        if (age < L.din) { head = easeIO(age / L.din); tail = 0; }
        else if (age < L.din + L.hold) { head = 1; tail = 0; }
        else if (age < L.din + L.hold + L.dout) { head = 1; tail = easeIO((age - L.din - L.hold) / L.dout); }
        else { lines.splice(s, 1); continue; }
        drawLine(L, head, tail, 1 - tail * tail);
      }
    }

    function start() { if (running || RM) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.drawImage(cache, 0, 0, W, H);
      for (var n = 0; n < 3; n++) { var l = spawn(0); if (l) { lines.push(l); drawLine(l, 1, 0, 1); } }
    }

    build();
    if (RM) { drawStatic(); }

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = canvas.getBoundingClientRect();
      m.tx = e.clientX - r.left; m.ty = e.clientY - r.top;
      if (!m.on && m.k < .01) { m.x = sh.x = m.tx; m.y = sh.y = m.ty; }   // arrive where the pointer is, not drift in from the last exit
      m.on = true;
    });
    hero.addEventListener('pointerleave', function () { m.on = false; });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { var w = W; build(); introDone = true; if (RM || !running) drawStatic(); if (Math.abs(w - W) > 1) lines = []; }, 160);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible && !document.hidden ? start() : stop(); }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (visible && start()); });

    // fine grain so the radial lift never bands
    var grain = hero.querySelector('.hero__grain');
    if (grain) {
      var g = document.createElement('canvas'); g.width = g.height = 180;
      var gx = g.getContext('2d'), id = gx.createImageData(180, 180);
      for (var z = 0; z < id.data.length; z += 4) { var v = (Math.random() * 255) | 0; id.data[z] = id.data[z + 1] = id.data[z + 2] = v; id.data[z + 3] = 255; }
      gx.putImageData(id, 0, 0);
      grain.style.backgroundImage = 'url(' + g.toDataURL('image/png') + ')';
    }

    return { start: start, stop: stop };
  }

  /* ------------------------------------------------------------------ */
  /* SVG helpers                                                         */
  /* ------------------------------------------------------------------ */
  var uid = 0;
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function svg(vw, vh) { return el('svg', { viewBox: '0 0 ' + vw + ' ' + vh, 'aria-hidden': 'true', focusable: 'false' }); }
  function gradient(root, x1, y1, x2, y2) {
    var id = 'ppg' + (++uid);
    var defs = el('defs', {}, root);
    var g = el('linearGradient', { id: id, gradientUnits: 'userSpaceOnUse', x1: x1, y1: y1, x2: x2, y2: y2 }, defs);
    el('stop', { offset: '0', 'stop-color': '#702F8A', 'stop-opacity': '0' }, g);
    el('stop', { offset: '.85', 'stop-color': '#702F8A', 'stop-opacity': '1' }, g);
    return 'url(#' + id + ')';
  }
  function dynLine(root, x1, y1, x2, y2, delay, cls) {
    var stroke = gradient(root, x1, y1, x2, y2);
    el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, 'stroke-width': 1.6, 'stroke-linecap': 'round', pathLength: 1, class: 'pp-line ' + (cls || ''), style: '--d:' + delay + 's' }, root);
    el('circle', { cx: x2, cy: y2, r: 2.6, class: 'pp-head', style: '--d:' + (delay + .9) + 's' }, root);
  }

  /* How it works: buy, hold, pull. One field, one flow line, told in three frames.
     The stock is a 3x3 block (Luke, 23 Nov: "wouldn't these be nicer as 4x4 or 3x3 grids, not 4x3"). 3x3 rather than
     4x4 because a square of three has a middle row, so the flow line enters and leaves along the block's centre line
     and the hold frame sits dead centre in the field; four rows has no middle row, and would make each figure 20% taller.
     The field is 9 by 5 points with one full spacing of margin each side, so the block centres exactly. */
  function step(host) {
    var type = host.getAttribute('data-step');
    var s = svg(400, 200), sx = 40, x0 = 40, y0 = 20, N = 3, c0 = 3;
    var bx0 = x0 + c0 * sx, bx1 = bx0 + (N - 1) * sx, by0 = y0 + sx, cy0 = y0 + 2 * sx;   // block edges and the middle row
    var block = function (i, j) { return i >= c0 && i < c0 + N && j >= 1 && j <= N; };
    for (var j = 0; j < 5; j++) for (var i = 0; i < 9; i++) {
      var cx = x0 + i * sx, cy = y0 + j * sx;
      if (!block(i, j)) { el('circle', { cx: cx, cy: cy, r: 2, class: 'pp-dot' }, s); continue; }
      var col = i - c0, row = j - 1;
      if (type === 'buy') {
        el('circle', { cx: cx, cy: cy, r: 2, class: 'pp-dot' }, s);
        el('circle', { cx: cx, cy: cy, r: 3.6, class: 'pp-fill pp-in', style: '--d:' + (.9 + col * .18 + row * .06).toFixed(2) + 's' }, s);
      } else if (type === 'hold') {
        el('circle', { cx: cx, cy: cy, r: 3.6, class: 'pp-fill' }, s);
      } else {
        // the front column goes first, then the top of the next: drawn down in order, as stock is
        var pulled = (col === N - 1) || (col === N - 2 && row === 0);
        if (pulled) {
          el('circle', { cx: cx, cy: cy, r: 3, class: 'pp-ring' }, s);
          el('circle', { cx: cx, cy: cy, r: 3.6, class: 'pp-fill pp-out', style: '--d:' + (.5 + (N - 1 - col) * .3 + row * .1).toFixed(2) + 's' }, s);
        } else {
          el('circle', { cx: cx, cy: cy, r: 3.6, class: 'pp-fill' }, s);
        }
      }
    }
    // equal 16px clearance from the frame to the field points on every side
    var pad = 24;
    if (type === 'buy') dynLine(s, 0, cy0, bx0 - 28, cy0, .1);
    if (type === 'hold') el('rect', { x: bx0 - pad, y: by0 - pad, width: bx1 - bx0 + pad * 2, height: (N - 1) * sx + pad * 2, rx: 2, class: 'pp-frame', pathLength: 1, style: '--d:.2s' }, s);
    if (type === 'pull') dynLine(s, bx1 + 28, cy0, 400, cy0, .4);
    host.appendChild(s);
  }

  function inView(nodes, cb, margin) {
    if (!('IntersectionObserver' in window) || RM) { nodes.forEach(cb); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } });
    }, { rootMargin: margin || '0px 0px -12% 0px', threshold: .2 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  window.PrecisionPoints = {
    init: function () {
      var c = document.querySelector('[data-pp-hero]');
      var field = c ? HeroField(c) : null;
      var steps = [].slice.call(document.querySelectorAll('[data-step]'));
      steps.forEach(step);
      var wrap = document.querySelector('.steps');
      if (wrap) inView([wrap], function () { steps.forEach(function (n) { n.classList.add('is-in'); }); });
      return field;
    }
  };
})();
