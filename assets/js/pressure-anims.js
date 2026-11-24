/* Pressure animations: three short illustrated loops for the Challenge section (02), one per pressure.

   Round 3 (Luke, 23 Nov: "minimal and clean without looking too basic and unrefined ... world class"):
   - tonal depth within the purple family instead of flat single colours: ground, a quiet area tone,
     the old value in a soft tint, the change in Smart Purple, structure in ink
   - small label chips inside the drawings (Harvey's lesson), outline icons in one family
   - texture only where it means something: the zone above the credit limit is hatched in the brand's
     45 degree lines; the map is a soft filled shape on the same faint dot grid as the other two
   - one rhythm: every loop is 8 s with a long hold; the row cascades left to right a beat apart;
     arrivals ease out long, journeys ease in and out, small secondary moments (an arrival ring,
     unfunded growth tracing on past the limit)

   Round 4, the homepage proofs only (Luke, 24 Nov: "still think we need more purple in this so it fits their brand
   guidelines more"). This copy replaces "structure in ink" with the guidelines' own rules: Precision Points "only use
   Smart Purple, or Minimal White" (p32), black "undermines the intensity of our Smart Purple" (p19), icons in Smart
   Purple (p30, positive colour), a filled purple chip with white type for the key label (p35). Lines and labels are
   Smart Purple, areas are three tints of it, and weight does the hierarchy the ink used to (the change is the 2px
   line, the bars, the moving stock; structure is 1.2px). The outline icons stay ink (Luke, 24 Nov: "the bottom one is
   better but keep the icons black"); the moving stock keeps its white-on-purple tile, and what used to be stays 55%.
   Tints, held to three (p35: "avoid having too many tints"): 20% for areas (land, the old price, the area under
   growth), 35% (the brand's --tint) for the dot grid and the hatch, 55% for what used to be (the outline the
   supplier no longer holds, the stock the limit won't fund), which has to stay visible on the 20% and 35% grounds.
   The original, round 3, is still assets/js/pressure-anims.js (index.html until the merge).

   Each tile is one SVG drawn by render(t): deterministic, loops, pauses off screen, can be scrubbed,
   and shows a finished still for reduced motion. Moving is done with transforms, opacity and short path
   updates; nothing heavier.
   Usage: <div class="pressure-anim" data-pressure="prices|risk|credit"></div>, then PressureAnims.mountAll(). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  // Smart Purple and its tints only (round 4): p20 areas, p35 (--tint) dots and hatch, p55 what used to be
  var C = { ground: '#F7F5F8', p20: '#E2D5E8', tint: '#CDB6D6', was: '#B08DBF', purple: '#702F8A', white: '#FFFFFF', ink: '#1F1823' };
  C.dot = C.tint; C.hatch = C.tint; C.land = C.p20; C.tone = C.p20;
  var FONT = "'Red Hat Text', 'Helvetica Neue', Arial, sans-serif";
  var D = 8;                                                                    // every loop, seconds
  var uid = 1000;                                                                 // ids clear of round 3's, so both can share the compare page

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(t, a, b) { return clamp((t - a) / (b - a)); }
  function quint(x) { return 1 - Math.pow(1 - x, 5); }
  function cubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function sine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }
  function setOp(n, o) { n.setAttribute('opacity', o.toFixed(3)); }
  function move(n, x, y, s) { n.setAttribute('transform', 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')' + (s ? ' scale(' + s.toFixed(3) + ')' : '')); }

  function frame(label) {
    var svg = el('svg', { viewBox: '0 0 400 400', role: 'img', 'aria-label': label, focusable: 'false' });
    el('rect', { width: 400, height: 400, fill: C.ground }, svg);
    return svg;
  }
  function defs(svg) { return svg.querySelector('defs') || el('defs', {}, svg); }
  function lineGradient(svg, x1, y1, x2, y2) {
    var id = 'pa' + (++uid), g = el('linearGradient', { id: id, gradientUnits: 'userSpaceOnUse', x1: x1, y1: y1, x2: x2, y2: y2 }, defs(svg));
    el('stop', { offset: 0, 'stop-color': C.purple, 'stop-opacity': 0 }, g);
    el('stop', { offset: 0.75, 'stop-color': C.purple, 'stop-opacity': 1 }, g);
    return 'url(#' + id + ')';
  }
  function vignette(svg, cx, cy, r, floor) {                                   // soft fall-off towards the tile edges
    var id = 'pv' + (++uid), d = defs(svg);
    var rg = el('radialGradient', { id: id + 'g', gradientUnits: 'userSpaceOnUse', cx: cx, cy: cy, r: r }, d);
    el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 1 }, rg);
    el('stop', { offset: 0.5, 'stop-color': '#fff', 'stop-opacity': 0.9 }, rg);
    el('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': floor == null ? 0.1 : floor }, rg);
    var m = el('mask', { id: id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 400, height: 400 }, d);
    el('rect', { width: 400, height: 400, fill: 'url(#' + id + 'g)' }, m);
    return 'url(#' + id + ')';
  }
  function grid(svg, mask) {                                                   // the faint dot grid every tile shares
    var d = '', r = 1.05;
    for (var y = 20; y < 400; y += 20) for (var x = 20; x < 400; x += 20) d += 'M' + (x - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0';
    return el('path', { d: d, fill: C.dot, mask: mask || vignette(svg, 200, 200, 270) }, svg);
  }
  // a label chip: a filled Smart Purple pill with white Red Hat Text 500 (the guidelines' data chip, p35). y is its centre line.
  function chip(parent, x, y, label, anchor) {
    var g = el('g', {}, parent), h = 23;
    var r = el('rect', { y: y - h / 2, height: h, rx: h / 2, fill: C.purple }, g);
    var t = el('text', { y: y + 4.4, 'font-family': FONT, 'font-size': 12.5, 'font-weight': 500, fill: C.white, 'letter-spacing': '0.01em' }, g);
    t.textContent = label;
    function fit() {
      var w = (t.getComputedTextLength && t.getComputedTextLength()) || label.length * 6.6;
      var bw = w + 20, left = anchor === 'start' ? x : anchor === 'end' ? x - bw : x - bw / 2;
      r.setAttribute('x', left.toFixed(1)); r.setAttribute('width', bw.toFixed(1)); t.setAttribute('x', (left + 10).toFixed(1));
    }
    fit();
    g.fit = fit;
    return g;
  }
  /* Outline icons, one family (Luke preferred the outline set): 24 grid, 1.5 stroke at any size, square caps. */
  var ICONS = {
    chip: function (g) {
      el('rect', { x: 6, y: 6, width: 12, height: 12 }, g); el('rect', { x: 9.5, y: 9.5, width: 5, height: 5 }, g);
      [9, 12, 15].forEach(function (p) { el('path', { d: 'M' + p + ' 2.5V6M' + p + ' 18V21.5M2.5 ' + p + 'H6M18 ' + p + 'H21.5' }, g); });
    },
    gear: function (g) {
      el('circle', { cx: 12, cy: 12, r: 6 }, g); el('circle', { cx: 12, cy: 12, r: 2.3 }, g);
      for (var k = 0; k < 8; k++) {
        var a = k * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
        el('path', { d: 'M' + (12 + c * 6).toFixed(2) + ' ' + (12 + s * 6).toFixed(2) + 'L' + (12 + c * 9.3).toFixed(2) + ' ' + (12 + s * 9.3).toFixed(2) }, g);
      }
    },
    battery: function (g) {
      el('rect', { x: 2.5, y: 7.5, width: 16.5, height: 9 }, g);
      el('path', { d: 'M19 10.5H21.5V13.5H19M6 10.5V13.5M9.5 10.5V13.5M13 10.5V13.5' }, g);
    },
    boxes: function (g) {
      el('rect', { x: 7.5, y: 3, width: 9, height: 8 }, g); el('rect', { x: 2.5, y: 13, width: 9, height: 8 }, g); el('rect', { x: 12.5, y: 13, width: 9, height: 8 }, g);
      el('path', { d: 'M12 3V6M7 13V16M17 13V16' }, g);
    },
    pin: function (g) {
      el('path', { d: 'M12 21.5s-6.5-6.4-6.5-11.6a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11.6-6.5 11.6z' }, g);
      el('circle', { cx: 12, cy: 9.9, r: 2.3 }, g);
    },
    person: function (g) {
      el('circle', { cx: 12, cy: 8, r: 3.8 }, g);
      el('path', { d: 'M4.8 20.5c.6-3.9 3.6-6.3 7.2-6.3s6.6 2.4 7.2 6.3' }, g);
    }
  };
  function icon(parent, name, cx, cy, size, color, fill) {
    var s = size / 24;
    var g = el('g', { transform: 'translate(' + (cx - size / 2) + ' ' + (cy - size / 2) + ') scale(' + s + ')', fill: fill || 'none',
      stroke: color || C.ink, 'stroke-width': (1.5 / s).toFixed(3), 'stroke-linecap': 'square', 'stroke-linejoin': 'miter' }, parent);
    ICONS[name](g);
    return g;
  }
  function topRounded(x, y, w, h, r) {                                         // a bar with rounded top corners
    if (h <= 0) return 'M0 0';
    r = Math.min(r, h, w / 2);
    return 'M' + x + ' ' + (y + h) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + w - r) +
      'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + (y + h) + 'Z';
  }

  /* ---------- 1. Component prices are rising ----------
     Three parts, each with its price as a bar: the soft tint is what it used to cost (the dashed keyline marks
     that level), the purple is the rise, growing one part after another. */
  function prices() {
    var svg = frame('Three components, each now costing more than it did: the rise sits on top of the old price.');
    grid(svg);
    var BY = 272, cols = [120, 200, 280], bw = 26, h0 = 72, rise = [38, 60, 86];
    var oldTop = BY - h0;
    // the rise: Smart Purple, a touch lighter at its foot, so it reads as made rather than flat
    var rg = 'pr' + (++uid), g0 = el('linearGradient', { id: rg, gradientUnits: 'userSpaceOnUse', x1: 0, y1: oldTop - 90, x2: 0, y2: oldTop }, defs(svg));
    el('stop', { offset: 0, 'stop-color': C.purple }, g0);
    el('stop', { offset: 1, 'stop-color': '#8B5AA1' }, g0);
    var bars = cols.map(function (x, c) {
      el('path', { d: topRounded(x - bw / 2, oldTop, bw, h0, 2), fill: C.p20 }, svg);
      return { p: el('path', { d: 'M0 0', fill: 'url(#' + rg + ')' }, svg), x: x - bw / 2, c: c, rise: rise[c] };
    });
    el('path', { d: 'M78 ' + (oldTop - 0.5) + 'H322', stroke: C.purple, 'stroke-opacity': 0.5, 'stroke-width': 1, 'stroke-dasharray': '2 3', fill: 'none' }, svg);
    el('path', { d: 'M72 ' + BY + 'H328', stroke: C.purple, 'stroke-width': 1.2, fill: 'none' }, svg);
    icon(svg, 'chip', cols[0], BY + 32, 28);
    icon(svg, 'gear', cols[1], BY + 32, 28);
    icon(svg, 'battery', cols[2], BY + 32, 28);
    function render(t) {
      bars.forEach(function (b) {
        var s = 0.8 + b.c * 0.32;
        var g = quint(seg(t, s, s + 1.3)) * (1 - cubic(seg(t, 6.3 + (2 - b.c) * 0.08, 7.2 + (2 - b.c) * 0.08)));
        var h = b.rise * g;
        b.p.setAttribute('d', h < 0.5 ? 'M0 0' : topRounded(b.x, oldTop - 2 - h, bw, h, 2.5));   // 2-unit seam at the old price
      });
    }
    return { svg: svg, duration: D, still: 5.2, render: render };
  }

  /* ---------- 2. Suppliers no longer carry the forecast risk ----------
     A soft filled map, supplier (South China, the pin) to you (UK, the person). The stock, with its forecast
     risk, rides the route from them to you; an outline of it stays where it used to be held. */
  var LAND = 'M-5 -3.8L-3.8 -5L-1.2 -5L0 -3.8L0 -1.2L-1.9 1.2L0.6 6.2L0.6 8.8L1.9 11.2L1.2 11.9L-3.8 12.5L-5 11.2L-5 1.2L-3.1 -1.2ZM199.4 -3.8L201.2 -5L203.8 -5L206.9 -3.8L206.9 1.2L208.1 6.2L211.9 11.2L211.2 11.9L206.2 12.5L195.6 3.8L195.6 1.2L198.1 -1.2ZM242.5 -3.8L243.8 -5L251.2 -5L253.1 -3.8L251.9 3.8L253.1 11.2L252.5 13.8L252.5 23.8L253.8 26L255.6 23.8L255 18.8L256.9 13.8L256.9 11.2L254.4 6.2L255 3.8L258.8 -0.6L260.6 1.2L260 3.8L260.6 6.2L263.8 7.5L265 6.2L262.5 3.8L261.9 1.2L266.2 -4.4L268.8 -2.5L271.2 -2.5L276.2 1.9L278.8 1.9L279.4 1.2L278.1 -1.2L274.4 -3.8L276.2 -5L401.2 -5L404.4 -3.8L405 -1.2L403.1 1.2L405 6.2L405 161.2L399.6 166.2L400.2 168.8L403.5 173.8L404.6 178.8L403.5 181.2L396.2 185.4L395 183.8L396.9 178.8L396 176.2L396.5 173.8L391.9 171.2L392.9 168.8L391.2 166L388.8 165.6L383.8 168.1L383.1 166.2L384.8 163.8L383.8 162.7L381.2 162.9L376.2 167.7L373.8 168.5L373.1 171.2L378.8 174.5L381.2 172.7L384.5 173.8L383.4 176.2L379.5 178.8L377.5 181.2L384.4 193.8L382.1 196.2L384.8 198.8L382.5 203.8L378.5 208.8L378.1 211.2L368.8 219L356.2 223.1L353.8 225L348.8 222.9L343.8 225.4L340.6 228.8L341 231.2L349.4 241.2L350.2 246.2L350 248.8L348.8 251.9L346.2 252.9L341.2 257.1L338.8 257.5L336.6 253.8L333.8 251.9L331 248.8L326.2 246L324.6 251.2L322.5 253.8L326.5 261.2L334.6 268.8L334.6 273.8L335.9 276.2L333 278.8L335.2 281.2L335.5 283.8L338.8 287.5L341.2 286.9L342.2 288.8L341 291.2L340.3 296.2L341.2 297.5L346.2 298.1L348.8 299.8L358.8 300.2L361.2 302.2L366.7 303.8L363.8 304.6L356.2 304.4L351.2 302.7L343.8 301.9L338.8 297.1L336.2 296.9L328.1 288.8L327.3 286.2L323.5 281.2L321.2 277L312.7 268.8L313.8 267.3L316.2 267.5L318.8 268.5L326.2 275L328.4 273.8L324.8 263.8L320.6 258.8L320.6 253.8L321.7 251.2L320.6 248.8L321 246.2L319 238.8L316.2 236L313.8 239.4L311.2 239.4L310.6 238.8L310 236.2L310.6 233.8L309.8 231.2L301.9 221.2L301.2 220.9L298.8 222.5L291.2 222.9L288.8 227.3L283.8 231.9L278.8 235.2L276.2 238.5L273.8 239.6L272.5 241.2L273.1 246.2L271.5 253.8L277.3 261.2L277.3 263.8L276.2 265L273.8 265.6L272.1 263.8L271.9 261.2L273.5 256.2L271.2 254L266.2 259.8L263.8 258.5L262.5 256.2L255 238.8L254.4 233.8L253.1 231.2L252.9 226.2L251.2 223.4L248.8 225L246.2 224.8L242.7 221.2L243.4 218.8L239.5 216.2L236.2 212.3L223.8 212.7L213.8 211.9L211.2 209.4L209.4 211.2L209.6 213.8L211.2 215.4L216.2 218.1L217.9 221.2L216.9 223.8L213.5 226.2L211.2 230.2L206.2 234L201.2 235.6L198.8 237.3L196.2 240.4L186.2 244.6L181.2 245.6L178.8 247.3L174.1 248.8L174 251.2L176.2 253.1L178.8 253.5L188.8 251.9L193.8 250.2L194.8 251.2L194.4 256.2L187.1 268.8L181.2 275L178.8 277.1L176.2 278.1L170.6 283.8L163.1 296.2L164.8 306.2L167.3 311.2L167.3 323.8L163.8 327.1L161.2 327.9L158.8 329.6L152.1 336.2L152.3 338.8L154.4 343.8L153.1 346.2L153.1 348.8L148.4 351.2L146.9 353.8L146.9 356.2L145 361.2L137.5 371.2L131.2 377.1L126.2 378.1L118.8 378.1L111.2 380.6L107.3 376.2L107.3 371.2L105.6 368.8L102.5 361.2L100.2 358.8L98.5 353.8L97.5 348.8L97.5 343.8L90.4 331.2L90.4 323.8L92.1 318.8L95.2 313.8L95.4 311.2L93.5 306.2L94 303.8L89.8 293.8L82.9 286.2L82.7 283.8L84.4 278.8L85 273.8L81.2 270L73.8 269.6L71.9 266.2L68.8 264.6L61.2 265.6L53.8 268.5L48.8 267.9L43.8 268.1L38.8 270L33.8 267.5L31.2 265.2L26.2 262.3L25 261.2L22.7 256.2L14.8 248.8L13.5 241.2L15 238.8L15.6 231.2L15.2 226.2L13.5 223.8L15.4 218.8L19 213.8L21 208.8L23.8 205.5L26.2 204.4L32.5 198.8L33.1 196.2L32.7 193.8L35 188.8L38.8 186.9L41.2 184.5L43.8 179.1L46.2 181.5L53.8 181.5L56.2 179.4L61.2 177.3L68.8 176L73.8 176.5L76.2 175.6L81.2 175.6L83.8 174.4L87.3 176.2L88.1 181.2L86.5 183.8L86.7 186.2L91.2 188.5L96.2 189.4L98.8 190.6L101.2 193.5L106.2 194.8L108.8 197.1L111.2 196L112.5 193.8L112.5 191.2L116.2 188.5L118.8 188.5L122.5 191.2L126.2 192.7L131.2 193.1L136.2 194.8L141.2 192.9L143.8 193.1L146.2 194.4L148.8 194.4L151.9 191.2L154.6 183.8L154.8 178.8L153.8 177L146.2 178.1L143.8 177.1L141.2 176.9L138.8 177.9L133.8 176.6L131.2 173L129.1 171.2L129.8 168.8L128.4 166.2L129.7 163.8L126.2 162.1L123.8 162.5L120 166.2L123.5 171.2L120.6 173.8L118.8 176.9L114.5 171.2L114 168.8L110 163.8L110.6 161.2L110.2 158.8L99.8 151.2L93.8 144.4L92.1 146.2L91.9 148.8L92.9 151.2L96.5 156.2L107.3 163.8L102.5 166.2L104 168.8L99.4 173.8L98.8 175.6L96.2 175.6L93.4 173.8L93.8 173.1L98.8 172.5L103.1 168.8L98.1 163.8L88.8 157.1L85.6 151.2L83.8 149.8L81.2 149.8L78.8 152.1L73.8 154.4L68.8 152.9L67.7 153.8L66 158.8L63.8 161L61.2 162.1L57.7 166.2L58.1 168.8L57.3 171.2L51.2 176.9L46.2 177.3L43.8 178.5L41.2 175.5L36.2 174.7L34.4 168.8L35.6 163.8L35 156.2L35.9 153.8L38.8 152.1L53.8 152.7L54.8 151.2L55.2 143.8L52.9 141.2L52.3 138.8L48.8 136.5L47.1 133.8L48.8 132.5L51.2 132.7L53.8 131.9L56.2 130L58.8 129.6L62.5 126.2L62.8 123.8L61.2 121.7L60.4 123.8L58.8 125L48.8 125.4L47.1 123.8L46 118.8L47.5 116.2L47.1 113.8L50 111.2L48.8 107.5L46.9 106.2L46.5 103.8L42.8 101.2L42.9 96.2L40.9 91.2L41.2 90.8L43.8 92L46.2 87.9L48.8 87.3L49.8 88.8L50 91.2L53.1 93.8L51 98.8L54.4 103.8L55.2 106.2L57.3 108.8L59.5 113.8L63.1 116.2L61.5 121.2L63.8 123.1L66.2 122.3L68.8 120.2L70 118.8L70.6 116.2L73.8 112.9L76.2 112.5L78.8 110.6L81.5 111.2L82 106.2L80 101.2L80.4 96.2L86.2 93.4L87.1 98.8L85.6 101.2L88.8 102.5L89.1 101.2L92.5 98.8L92.1 96.2L90.4 93.8L87.5 86.2L86.2 85.2L81.2 90.2L76.2 90.2L73.8 88.3L71.9 81.2L71.9 78.8L70.6 76.2L72.7 68.8L81.2 60.4L84.6 58.8L86.2 54.7L89.4 51.2L90.4 48.8L90.4 46.2L92.5 41.2L97.1 36.2L97.7 33.8L95.3 31.2L97.2 28.8L97.5 26.2L98.8 25L102.5 23.8L107.5 18.8L108.8 15.6L111.2 15L116.2 15.6L118.1 13.8L118.1 11.2L118.8 10.6L123.8 10L126.2 7.5L128.8 10L131.2 10L133.8 7.5L136.2 10L138.8 10.6L141.9 13.8L139.4 16.2L141.2 17.5L146.2 18.1L148.8 21.9L153.8 22.5L159.1 26.2L163.8 30.9L166.2 32.3L167.3 33.8L168.1 38.8L166.2 43.5L163.8 44.4L156.2 44.4L153.8 42.5L151.2 42.2L150 43.8L152.1 46.2L152.5 53.8L153.8 55.6L158.8 59L159.4 56.2L157.1 53.8L158.8 50.6L163.8 54.4L164.7 53.8L165.6 51.2L165.2 48.8L168.8 44.4L171.2 42.5L173.8 42.9L176.2 42.2L176.9 41.2L175.2 36.2L175.6 33.8L175.2 28.8L176.2 27L178.8 26.9L181.5 28.8L182.5 31.2L180.3 33.8L179.4 36.2L180.2 38.8L181.2 39.6L183.8 40L185.6 38.8L186 36.2L187.8 33.8L191.2 31.9L196.2 27.5L198.8 26.9L201.2 25L202.5 26.2L203.8 29.4L206.2 27.5L211.2 26.9L213.8 25.4L216.2 25.2L218.8 27.5L220 26.2L220.6 23.8L219.4 21.2L215 16.2L216.2 13.1L221.2 17.5L223.8 18.1L226.2 20L228.8 20L233.8 23.1L241.2 29.4L242.5 26.2L240.6 23.8L240 21.2L236.9 18.8L238.1 13.8L236.9 8.8L237.5 6.2L240.6 3.8L241.9 1.2ZM-5 16.2L-3.8 15L-0.6 16.2L-3.8 20L-5 18.8ZM188.1 21.2L188.8 20.6L191.2 21.9L192.5 23.8L188.8 26.9L187.5 23.8ZM254 26.2L256.2 24.4L258.5 26.2L257.7 28.8L258.1 31.2L256.2 38.3L252.5 41.2L251.2 43.5L250 41.2L254.4 31.2L254.8 28.8ZM-2.9 43.8L-1.2 42.5L3.8 48.1L8.8 44.4L11.2 45L13.8 44.4L16.2 42.5L18.8 44.4L22.1 48.8L22.5 51.2L21.2 54.1L13.8 60L11.2 60.4L8.8 61.9L6.2 61.9L3.8 60L1.2 60L-1 58.8L-0.2 56.2L-1.2 54.8L-3.3 53.8L-1.9 48.8L-3.8 47.8L-4.6 46.2ZM121.2 48.1L116.9 51.2L114.6 58.8L108.8 64L105.4 68.8L105 76.2L108.5 78.8L110.2 81.2L109.8 83.8L108.8 85.2L104.4 88.8L103.1 93.8L104 96.2L102.8 98.8L101.2 99.8L98.8 100.2L97.3 101.2L96.2 103.3L93.8 103.3L91.2 105L88.8 104.4L86.9 106.2L87.5 108.8L88.8 109.6L91.2 109L93.8 107.3L96.2 110.2L98.8 110L103.8 107.3L106.2 106.9L108.8 107.7L111.2 107.5L115 103.8L115.4 96.2L118.5 91.2L117.9 88.8L118.8 86.7L121.2 85.9L123.4 83.8L121.2 82.3L113.8 80.6L111.5 78.8L115.2 76.2L115.6 71.2L115 63.8L121.2 57.5L125.6 51.2L125 48.8L123.8 47.7ZM133.8 77.9L131.2 79.4L128.8 79.4L122.8 81.2L123.8 83.1L126.2 82.1L131.2 83.5L133.8 82.9L136.6 81.2L135.3 78.8ZM120.8 88.8L121.2 87.5L121.6 88.8L124 91.2L124.4 93.8L123.8 94.4L121.2 95L120.2 93.8L119 91.2ZM37.1 106.2L38.8 104.4L41.2 104.4L43.5 106.2L44.7 108.8L42.5 111.2L43.1 113.8L41.2 118.1L36.2 120.6L33.8 120.6L32.1 118.8L32.9 116.2L32.5 111.2L33.1 108.8L36.2 107.5ZM156.2 140.6L152.3 143.8L153.5 146.2L151.2 148.5L148.8 148.4L146 143.8L143.8 141.5L141.2 141.6L136.2 149L132.7 156.2L135 161.2L141.2 161.9L146.2 158.5L148.8 158.1L151.2 158.1L158.8 161.5L161.2 161.9L166.2 161.9L168.8 160L169.6 158.8L169 156.2L163.8 151L157.5 146.2L160 143.8L160.4 141.2L158.8 140ZM80.6 163.8L83.8 161.6L84.8 163.8L83.8 167.2L81.2 168.1ZM188.8 197.7L187.5 198.8L187.3 201.2L188.1 203.8L191.2 207L193.5 211.2L196.2 214.5L201.2 215.2L203.8 214.4L210.5 208.8L208.8 207.3L201.2 207.3L196.2 204.6L194.6 201.2L191.2 197.5ZM151.2 204L149.6 206.2L150.2 208.8L154.4 216.2L154.8 218.8L157.1 221.2L158.5 228.8L162.7 233.8L164.1 238.8L171.2 245.6L173.1 243.8L172.1 236.2L163.5 223.8L162.7 218.8L158.5 213.8L154.6 206.2ZM381.9 213.8L383.8 213.1L384.4 213.8L381.2 220.2L379.8 218.8L379.8 216.2ZM349.4 228.8L351.2 227.1L353.8 227.2L354.6 228.8L351.2 232.1L349.2 231.2ZM380 233.8L381.2 231.5L383.8 231.9L385 233.8L385.2 236.2L383.5 241.2L388.8 245.3L389.4 246.2L388.8 248.1L386.2 244.2L381.2 245.6L379 238.8L380 236.2ZM384.7 251.2L386.2 250.4L388.8 253.5L391.2 250.6L391.9 251.2L390 253.8L386.2 256.6L385.9 253.8ZM390 258.8L393.8 256.5L395.6 258.8L396.2 261.9L393.8 264.4L391.2 265.4L388.8 261.5L385.9 261.2ZM370.5 263.8L371.2 263.1L371.9 263.8L375.2 268.8L372.7 273.8L375.2 278.8L372.5 281.2L372.3 283.8L369.6 286.2L369 291.2L366.2 292.3L361.2 290.4L353.8 290L352.5 288.8L352.5 286.2L350.2 283.8L349.6 278.8L351.2 277.1L353.8 277.5L356.2 274.6L358.8 274ZM378.5 283.8L378.8 283.1L381.2 285.2L383.8 285L384.7 286.2L385.4 291.2L387.5 293.8L386.2 296.9L381.2 290.3L379.4 296.2L378.8 296.9L378.1 296.2L376.5 288.8L376.9 286.2ZM188.5 316.2L191.2 316L192.3 318.8L192.2 323.8L190.4 328.8L189.6 333.8L184.8 348.8L183.8 350.2L178.8 352.3L176.2 350.6L175 348.8L175 346.2L174 343.8L174 341.2L176.9 336.2L175.6 328.8L176.9 326.2L181.2 324.4L185.2 321.2ZM393.1 321.2L396.2 319.6L398.8 319.6L401.2 321.5L403.8 321.5L405 323.8L405 368.8L403.8 370.6L401.2 372.1L393.8 373.1L388.8 377.5L386.2 378.1L381.2 377.7L378.8 378.1L373.8 381.9L368.8 381.5L366.5 378.8L367.3 376.2L367.3 371.2L365.4 366.2L364.6 361.2L362.1 356.2L362.3 351.2L361.5 348.8L362.5 343.8L368.8 338.5L381.2 335.4L384.6 331.2L385 328.8L386.2 326.9L388.8 326Z';
  function risk() {
    var svg = frame('A map from a supplier in Asia to you in the UK: the stock, and the forecast risk with it, travels from the supplier to you.');
    grid(svg);
    el('path', { d: LAND, fill: C.land, 'fill-rule': 'evenodd', mask: vignette(svg, 200, 175, 280, 0.32) }, svg);
    // Mercator, 22W to 128E from 72N, so the UK and South China sit in the middle band of the square.
    // The route is drawn the way the brand draws lines: one 45 degree run, then straight across.
    var route = [[336, 216], [240, 120], [64, 120]];
    var S = route[0], E = route[route.length - 1], LIFT = 30;
    var lens = [], total = 0;
    for (var i = 1; i < route.length; i++) { var l = Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]); lens.push(l); total += l; }
    function at(p) {
      var dist = p * total;
      for (var k = 0; k < lens.length; k++) {
        if (dist <= lens[k] || k === lens.length - 1) {
          var f = lens[k] ? Math.min(1, dist / lens[k]) : 0;
          return [route[k][0] + (route[k + 1][0] - route[k][0]) * f, route[k][1] + (route[k + 1][1] - route[k][1]) * f];
        }
        dist -= lens[k];
      }
    }
    var dPath = 'M' + route.map(function (q) { return q.join(' '); }).join('L');
    el('path', { d: dPath, fill: 'none', stroke: C.purple, 'stroke-opacity': 0.5, 'stroke-width': 1, 'stroke-dasharray': '1.5 3.5', 'stroke-linecap': 'round' }, svg);
    var trail = el('path', { d: dPath, fill: 'none', stroke: lineGradient(svg, S[0], S[1], E[0], E[1]), 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, svg);
    // the two places: a location dot on the route, its symbol beneath
    [S, E].forEach(function (q) { el('circle', { cx: q[0], cy: q[1], r: 3.4, fill: C.white, stroke: C.purple, 'stroke-width': 1.2 }, svg); });
    icon(svg, 'pin', S[0], S[1] + 28, 24);
    icon(svg, 'person', E[0], E[1] + 28, 24);
    var ring = el('circle', { cx: E[0], cy: E[1], r: 7, fill: 'none', stroke: C.purple, 'stroke-width': 1.2 }, svg);   // arrival
    // what the supplier used to hold: the stock's outline, left behind in the 55% tint
    var ghost = el('g', {}, svg);
    el('rect', { x: S[0] - 21.5, y: S[1] - LIFT - 21.5, width: 43, height: 43, rx: 6, fill: C.ground, stroke: C.was, 'stroke-width': 1.2 }, ghost);
    icon(ghost, 'boxes', S[0], S[1] - LIFT, 28, C.was);
    // the stock, and its risk, as one: the guidelines' negative icon, white on a Smart Purple tile (p30)
    var ship = el('g', {}, svg);
    el('rect', { x: S[0] - 22, y: S[1] - LIFT - 22, width: 44, height: 44, rx: 6, fill: C.purple }, ship);
    icon(ship, 'boxes', S[0], S[1] - LIFT, 28, C.white);
    var tag = chip(ship, S[0], S[1] - LIFT - 38, 'Forecast risk', 'middle');
    var fitted = false;
    function render(t) {
      if (!fitted && svg.isConnected) { tag.fit(); fitted = true; }
      var p = cubic(seg(t, 0.8, 4.2));
      var leave = sine(seg(t, 6.3, 7.1)), back = quint(seg(t, 7.0, 7.9)), home = t >= 7.0;
      var pos = at(p);
      move(ship, home ? 0 : pos[0] - S[0], home ? 0 : pos[1] - S[1]);
      setOp(ship, home ? back : 1 - leave);
      trail.setAttribute('stroke-dashoffset', (1 - p).toFixed(4));
      setOp(trail, 1 - leave);
      setOp(ghost, clamp((p - 0.03) * 10) * (1 - (home ? back : 0)));
      var r = seg(t, 4.1, 5.2);                                                   // one soft ring as it lands
      setOp(ring, r > 0 && r < 1 ? 0.45 * (1 - r) : 0);
      ring.setAttribute('r', (7 + 16 * quint(r)).toFixed(2));
    }
    return { svg: svg, duration: D, still: 5.6, render: render };
  }

  /* ---------- 3. Growth is running into credit limits ----------
     Growth climbs until it meets the credit limit and runs flat beneath it. Above the limit is hatched: the
     growth that would go there traces on as a dashed line it cannot fund. */
  function credit() {
    var svg = frame('Growth climbs until it meets the credit limit and runs flat beneath it; the growth above the limit goes unfunded.');
    var LIM = 140;
    grid(svg);
    var hid = 'ph' + (++uid);
    var pat = el('pattern', { id: hid, patternUnits: 'userSpaceOnUse', width: 7, height: 7, patternTransform: 'rotate(45)' }, defs(svg));
    el('path', { d: 'M0 0V7', stroke: C.hatch, 'stroke-width': 1.1 }, pat);
    var zm = vignette(svg, 230, 120, 260, 0.15);
    el('rect', { x: 0, y: 0, width: 400, height: LIM, fill: C.p20, 'fill-opacity': 0.6, mask: zm }, svg);   // the zone it can't fund, washed
    el('rect', { x: 0, y: 0, width: 400, height: LIM, fill: 'url(#' + hid + ')', mask: zm }, svg);
    var pts = [[40, 320], [100, 320], [180, 240], [220, 240], [300, 160], [360, 160]];
    var dLine = 'M' + pts.map(function (q) { return q.join(' '); }).join('L');
    // the area under growth, a quiet tone that fades downward, revealed with the line
    var ag = 'pg' + (++uid), lg = el('linearGradient', { id: ag, x1: 0, y1: 0, x2: 0, y2: 1 }, defs(svg));
    el('stop', { offset: 0, 'stop-color': C.tint, 'stop-opacity': 0.95 }, lg);                         // a filled area, as the guidelines' charts
    el('stop', { offset: 1, 'stop-color': C.p20, 'stop-opacity': 0 }, lg);
    var cid = 'pc' + (++uid), clip = el('clipPath', { id: cid }, defs(svg));
    var clipRect = el('rect', { x: 0, y: 0, width: 0, height: 400 }, clip);
    var area = el('path', { d: dLine + 'V340H40Z', fill: 'url(#' + ag + ')', 'clip-path': 'url(#' + cid + ')' }, svg);
    el('path', { d: 'M0 ' + LIM + 'H400', stroke: C.purple, 'stroke-width': 1.2, fill: 'none' }, svg);
    el('path', { d: 'M40 340H360', stroke: C.purple, 'stroke-width': 1.2, fill: 'none' }, svg);              // grounded, like the prices tile
    // growing means buying more stock: a stack of boxes lands on each step as the line reaches it
    var buys = [[70, 296, 0.08], [200, 216, 0.5]].map(function (b) { return { g: icon(svg, 'boxes', b[0], b[1], 26), at: b[2] }; });
    // the stock the limit won't fund: the same outlined tile as the stock the supplier no longer holds (map), 55% tint
    var unbought = el('g', {}, svg);
    el('rect', { x: 346.5, y: 28.5, width: 43, height: 43, rx: 6, fill: C.ground, stroke: C.was, 'stroke-width': 1.2 }, unbought);
    icon(unbought, 'boxes', 368, 50, 28, C.was);
    var unfunded = el('path', { d: 'M300 160L384 76', fill: 'none', stroke: C.purple, 'stroke-opacity': 0.45, 'stroke-width': 1.4,
      'stroke-dasharray': '3 4', 'stroke-linecap': 'round' }, svg);
    var line = el('path', { d: dLine, fill: 'none', stroke: lineGradient(svg, 40, 320, 300, 160), 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, svg);
    var head = el('circle', { cx: 0, cy: 0, r: 4.6, fill: C.white, stroke: C.purple, 'stroke-width': 2 }, svg);
    var tag = chip(svg, 40, LIM, 'Credit limit', 'start');
    var L = 0; for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    var flat = 60 / L, fitted = false;
    function pointAt(p) {                                                       // along the growth line
      var dist = p * L;
      for (var k = 1; k < pts.length; k++) {
        var l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
        if (dist <= l || k === pts.length - 1) { var f = Math.min(1, dist / l); return [pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f, pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f]; }
        dist -= l;
      }
    }
    function render(t) {
      if (!fitted && svg.isConnected) { tag.fit(); fitted = true; }
      var p = cubic(seg(t, 0.6, 3.4)) * (1 - flat) + quint(seg(t, 3.4, 4.6)) * flat;
      var fade = sine(seg(t, 6.3, 7.1));
      line.setAttribute('stroke-dashoffset', (1 - p).toFixed(4));
      setOp(line, 1 - fade);
      var hp = pointAt(p);
      clipRect.setAttribute('width', hp[0].toFixed(1));
      move(head, hp[0], hp[1]);
      setOp(head, clamp(p * 20) * (1 - fade));
      var u = quint(seg(t, 4.0, 5.3));
      unfunded.setAttribute('d', 'M300 160L' + (300 + 84 * u).toFixed(1) + ' ' + (160 - 84 * u).toFixed(1));
      setOp(unfunded, (u > 0 ? 1 : 0) * (1 - fade));
      buys.forEach(function (b) { setOp(b.g, quint(clamp((p - b.at) / 0.12)) * (1 - fade)); });
      setOp(unbought, quint(seg(t, 4.9, 5.7)) * (1 - fade));
      setOp(area, (p > 0.001 ? 1 : 0) * (1 - fade));                          // the area tone comes and goes with the line
    }
    return { svg: svg, duration: D, still: 5.6, render: render };
  }

  var grainURL = null;
  function grainTexture() {                                                     // fine print grain, made once
    if (grainURL) return grainURL;
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var x = c.getContext('2d'), d = x.createImageData(160, 160);
    for (var i = 0; i < d.data.length; i += 4) { var v = 190 + Math.random() * 65 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    return (grainURL = c.toDataURL('image/png'));
  }

  var BUILD = { prices: prices, risk: risk, credit: credit };
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // offset: seconds this tile runs behind the first, so a row of tiles cascades left to right
  function mount(host, offset) {
    var a = BUILD[host.getAttribute('data-pressure')]();
    offset = offset || 0;
    host.appendChild(a.svg);
    var g = document.createElement('span'); g.className = 'pressure-anim__grain'; g.setAttribute('aria-hidden', 'true');
    g.style.backgroundImage = 'url(' + grainTexture() + ')'; host.appendChild(g);
    if (RM) { a.render(a.still); return a; }
    a.render(0);
    var t0 = null, raf = 0, running = false;
    function tick(now) {
      if (t0 === null) t0 = now;
      var e = (now - t0) / 1000 - offset;
      a.render(e < 0 ? 0 : e % a.duration);
      raf = requestAnimationFrame(tick);
    }
    function play() { if (running) return; running = true; t0 = null; raf = requestAnimationFrame(tick); }
    function pause() { if (!running) return; running = false; cancelAnimationFrame(raf); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? play() : pause(); }); },
        { threshold: 0.25 }).observe(host);
    } else play();
    document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
    a.play = play; a.pause = pause;                                            // for a page-level pause control
    a.seek = function (t) { pause(); a.render(t); };                           // for reviewing frames
    return a;
  }
  window.PressureAnims = {
    mountAll: function (root) {
      return [].slice.call((root || document).querySelectorAll('[data-pressure]')).map(function (h, i) { return mount(h, i * 0.35); });
    },
    mount: mount
  };
})();
