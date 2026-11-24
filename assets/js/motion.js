/* Motion v2 (proof): splits headings into masked lines (the hero headline into words), marks keylines to draw in,
   and lets main.js's existing reveal observer (.is-in) trigger everything, so there is still one observer on the page.
   Lines are measured after the fonts load and re-measured when the width changes, so the designed <br> breaks hold.
   Screen readers get the heading's text once, from aria-label, not word by word. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  // the nav logo's Portal turns into place as the page opens (the footer's turns when main.js reveals it)
  var navLogo = document.querySelector('.nav__logo .lg');
  if (navLogo) requestAnimationFrame(function () { requestAnimationFrame(function () { navLogo.classList.add('is-on'); }); });

  // options 6 and 7: the hero slides up to reveal the film band pinned behind it (main-v2.css .reveal). Pinned only when the
  // hero and the band are both at least a screen tall, so nothing peeks below the hero and no gap opens under the band.
  // The page is the same length either way, so re-checking on resize never moves the scroll position.
  var stack = document.querySelector('[data-reveal-stack]');
  if (stack) {
    var sHero = stack.querySelector('.hero'), sFilm = stack.querySelector('.film');
    var pin = function () {
      stack.classList.remove('is-pinned');
      var vh = window.innerHeight, H = sHero.offsetHeight, F = sFilm.offsetHeight;
      if (H >= vh - 1 && F >= vh - 1) { stack.style.setProperty('--reveal-h', H + 'px'); stack.classList.add('is-pinned'); }
    };
    pin();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pin);
    var pt; addEventListener('resize', function () { clearTimeout(pt); pt = setTimeout(pin, 150); });
  }

  // wrap each word in a span; an inline element that touches the word before it (the hero's purple full stop)
  // joins that word, so it never gets a space or a line of its own
  function words(el) {
    var nodes = [].slice.call(el.childNodes), last = null, gap = true;
    el.textContent = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); gap = true; return; }   // real spaces, so the measuring pass wraps like the heading
          if (!gap && last) { last.appendChild(document.createTextNode(part)); return; }
          last = document.createElement('span'); last.className = 'mv-w'; last.textContent = part;
          el.appendChild(last); gap = false;
        });
      } else if (n.nodeName === 'BR') {
        el.appendChild(n); gap = true;                     // kept for the measuring pass only
      } else if (n.nodeType === 1 && !n.children.length && /\S\s+\S/.test(n.textContent)) {
        // a styled phrase (the purple "You pull it."): each word gets its own copy of the element, so the phrase
        // can still break across lines and every word rises with its own line
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); gap = true; return; }
          var c = n.cloneNode(false); c.textContent = part;
          if (!gap && last) { last.appendChild(c); return; }
          last = document.createElement('span'); last.className = 'mv-w'; last.appendChild(c);
          el.appendChild(last); gap = false;
        });
      } else if (!gap && last) {
        last.appendChild(n);
      } else {
        last = document.createElement('span'); last.className = 'mv-w'; last.appendChild(n);
        el.appendChild(last); gap = false;
      }
    });
  }

  function split(el) {
    if (el.__mv == null) {
      el.__mv = el.innerHTML;
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    } else el.innerHTML = el.__mv;
    words(el);
    var lines = [];
    [].slice.call(el.querySelectorAll('.mv-w')).forEach(function (w) {
      var t = w.offsetTop, L = null;
      for (var i = 0; i < lines.length; i++) if (Math.abs(lines[i].t - t) < 8) { L = lines[i]; break; }
      if (L) L.ws.push(w); else lines.push({ t: t, ws: [w] });
    });
    el.textContent = '';
    var wi = 0;
    lines.forEach(function (L, li) {
      var line = document.createElement('span'); line.className = 'mv-line'; line.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span'); inner.className = 'mv-in'; inner.style.setProperty('--li', li);
      L.ws.forEach(function (w, k) {
        if (k) inner.appendChild(document.createTextNode(' '));
        w.style.setProperty('--wi', wi++);
        inner.appendChild(w);
      });
      line.appendChild(inner); el.appendChild(line);
    });
    el.classList.add('mv-split');
  }

  // keylines: a revealed element with a top rule at this width draws it in from the left
  function keylines() {
    $$('[data-reveal]').forEach(function (el) {
      el.classList.remove('mv-kl');
      var cs = getComputedStyle(el);
      if (parseFloat(cs.borderTopWidth) >= 1 && cs.borderTopStyle !== 'none') {
        el.style.setProperty('--kl', cs.borderTopColor);
        if (cs.position === 'static') el.style.position = 'relative';
        el.classList.add('mv-kl');
      }
    });
  }

  function init() {
    var heads = $$('h2.h2[data-reveal], h2.h3[data-reveal]');
    var hero = document.querySelector('.hero__title');
    heads.forEach(split);
    heads.forEach(function (h) {                         // the copy right under a heading waits for its lines
      var n = h.nextElementSibling;
      if (n && n.hasAttribute('data-reveal')) n.classList.add('mv-after');
    });
    if (hero) {
      split(hero);
      hero.offsetWidth;                                  // commit the hidden state before the words rise
      requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('mv-on'); }); });
    }
    keylines();
    document.documentElement.classList.add('mv-ready');

    var lastW = innerWidth, rt;
    addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (innerWidth === lastW) return;
        lastW = innerWidth;
        heads.forEach(split);
        if (hero) split(hero);
        keylines();
      }, 180);
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else addEventListener('load', init);
})();
