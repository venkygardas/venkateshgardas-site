/* Tell the stylesheet the motion layer actually loaded. Everything hidden for
   an entrance is hidden by CSS the instant the page parses, and only script
   un-hides it, so if this file 404s or throws before it runs, every screenshot
   and every card stays invisible forever. The head sets .rv-fail if this flag
   has not appeared within 2.5s, which forces it all open. */
window.__rvReady = true;

/* Pause the hero loop when it is not on screen. It is an infinite animation, so
   it went on costing the main thread every frame from thousands of pixels away. */
(function () {
  var wrap = document.querySelector('.loopwrap');
  if (!wrap || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { wrap.classList.toggle('paused', !e.isIntersecting); });
  }, { rootMargin: '120px' }).observe(wrap);
})();

/* The product thread: one continuous line down every page.
   Waypoints land on section heads, so the line literally passes through
   the numbers. Drawn progressively as you scroll. */
(function () {
  var frame = document.querySelector('.frame');
  var wrap = document.querySelector('.threadwrap');
  if (!frame || !wrap) return;

  var svg = wrap.querySelector('svg');
  var bed = wrap.querySelector('.thread-bed');
  var ink = wrap.querySelector('.thread-ink');
  var nodes = wrap.querySelector('.thread-nodes');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var len = 0, H = 0;
  var travel = null, halo = null, milestones = [], top = 0;

  /* How far along the path a given height sits.

     This used to bisect, which cost 18 getPointAtLength calls plus one every
     time it was asked, and it is asked on every scroll frame: measured at 19
     calls a frame, and 74 to 87% of all scripting done during a scroll. The
     path is fixed between rebuilds and only ever descends, so it is sampled
     once into a table at build time and every later question is a binary
     search over an array plus one interpolation. Zero path calls per frame. */
  var TABLE = [];   /* [y, length] pairs, ascending in both */

  function sample(total) {
    TABLE = [];
    var STEPS = 256;
    for (var i = 0; i <= STEPS; i++) {
      var at = total * (i / STEPS);
      TABLE.push([ink.getPointAtLength(at).y, at]);
    }
  }

  function lengthAtY(y, total) {
    if (!TABLE.length) return 0;
    if (y <= TABLE[0][0]) return 0;
    if (y >= TABLE[TABLE.length - 1][0]) return total;
    var lo = 0, hi = TABLE.length - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (TABLE[mid][0] < y) lo = mid; else hi = mid;
    }
    var y0 = TABLE[lo][0], y1 = TABLE[hi][0];
    var t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
    return TABLE[lo][1] + t * (TABLE[hi][1] - TABLE[lo][1]);
  }

  function build() {
    H = frame.scrollHeight;
    var W = frame.clientWidth;
    if (!H || !W || W < 1100) { wrap.style.display = W < 1100 ? 'none' : ''; if (W < 1100) return; }
    wrap.style.display = '';

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');

    var frameTop = frame.getBoundingClientRect().top + window.scrollY;
    top = frameTop;
    var marks = Array.prototype.slice.call(frame.querySelectorAll('.shead, .cell.contact'));
    if (marks.length < 3) {
      var rows = Array.prototype.slice.call(frame.querySelectorAll('.row')).filter(function (r) {
        return r.offsetHeight > 80;
      });
      if (rows.length > marks.length) marks = rows;
    }
    if (!marks.length) { wrap.style.display = 'none'; return; }

    /* a rail in the left margin: never crosses the content column */
    var colLeft = (W - Math.min(W, parseFloat(getComputedStyle(frame).getPropertyValue('--pw')) || 1240)) / 2;
    if (colLeft < 70) { wrap.style.display = 'none'; return; }
    var mid = Math.max(24, colLeft * 0.42);
    var amp = Math.min(22, Math.max(8, colLeft * 0.22));

    var pts = [];
    marks.forEach(function (h, i) {
      var r = h.getBoundingClientRect();
      var y = r.top + window.scrollY - frameTop + r.height / 2;
      pts.push([mid + (i % 2 === 0 ? -amp : amp), y]);
    });

    var first = pts[0], last = pts[pts.length - 1];
    pts.unshift([mid, Math.max(0, first[1] - 260)]);
    pts.push([mid, Math.min(H, last[1] + 200)]);

    var d = 'M ' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var x0 = pts[i - 1][0], y0 = pts[i - 1][1];
      var x1 = pts[i][0], y1 = pts[i][1];
      var my = (y0 + y1) / 2;
      d += ' C ' + x0 + ' ' + my + ', ' + x1 + ' ' + my + ', ' + x1 + ' ' + y1;
    }

    bed.setAttribute('d', d);
    ink.setAttribute('d', d);

    while (nodes.firstChild) nodes.removeChild(nodes.firstChild);
    len = ink.getTotalLength();
    sample(len);

    milestones = pts.slice(1, -1).map(function (p) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p[0]);
      c.setAttribute('cy', p[1]);
      c.setAttribute('r', 3.5);
      c.setAttribute('class', 'thread-node');
      nodes.appendChild(c);
      return { el: c, at: lengthAtY(p[1], len) };
    });

    /* the marker rides the head of the line */
    if (!travel) {
      halo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      halo.setAttribute('r', 11);
      halo.setAttribute('class', 'thread-halo');
      travel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      travel.setAttribute('r', 4);
      travel.setAttribute('class', 'thread-travel');
    }
    nodes.appendChild(halo);
    nodes.appendChild(travel);

    ink.style.strokeDasharray = len;

    /* A page shorter than the window never scrolls, so the marker would sit
       frozen mid-rail forever with half the milestones unlit, which reads as
       broken rather than as progress. Such a page is simply finished. */
    if (document.documentElement.scrollHeight <= window.innerHeight + 4) {
      ink.style.strokeDashoffset = 0;
      milestones.forEach(function (m) { m.el.classList.add('lit'); });
      if (travel) { travel.classList.remove('on'); halo.classList.remove('on'); }
      return;
    }
    draw();
  }

  function draw() {
    if (!len) return;
    if (reduce) {
      /* the line is the map, so it stays. Only the travelling does not. */
      ink.style.strokeDashoffset = 0;
      milestones.forEach(function (m) { m.el.classList.add('lit'); });
      return;
    }
    /* The head sits where the reader is looking, not at a fraction of the
       scrollbar. Length along the path and height down the page are not the
       same measure, so deriving one from the other left the marker drifting
       below the fold on long pages. Ask the path which length is at this
       height instead, and the line is then drawn to exactly that point. */
    var eye = window.scrollY + window.innerHeight * 0.55 - top;
    var maxY = document.documentElement.scrollHeight - window.innerHeight;
    /* At the very bottom the eye line still sits 45% of a screen above the end
       of the document, so the last stretch of thread and its final milestone
       could never be reached: the journey never completed on any long page.
       Over the last screenful, walk the eye the rest of the way down. */
    if (maxY > 0 && window.scrollY > maxY - window.innerHeight) {
      var t = Math.min(1, (window.scrollY - (maxY - window.innerHeight)) / window.innerHeight);
      eye += t * window.innerHeight * 0.45;
    }
    var head = Math.max(0, Math.min(len, lengthAtY(eye, len)));
    var p = head / len;
    ink.style.strokeDashoffset = len - head;

    if (travel) {
      var pt = ink.getPointAtLength(head);
      travel.setAttribute('cx', pt.x); travel.setAttribute('cy', pt.y);
      halo.setAttribute('cx', pt.x); halo.setAttribute('cy', pt.y);
      /* it only shows once the journey has actually started, and it stops
         being interesting once the line is fully drawn */
      var on = p > 0.01 && p < 0.995;
      travel.classList.toggle('on', on);
      halo.classList.toggle('on', on);
    }
    /* milestones behind the marker are done, the ones ahead are still open */
    milestones.forEach(function (m) { m.el.classList.toggle('lit', m.at <= head); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { draw(); ticking = false; });
  }

  build();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', build);
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(build, 150);
  });
  if (window.ResizeObserver) new ResizeObserver(build).observe(frame);
})();

/* Depth layer: things move at different rates against the scroll.

   This is the one idea taken from rleonardi.com. There, clouds, mountains and
   sea answer the same scroll at different speeds and the page reads as a world
   you travel through. There is no illustration here, so the layers are the
   typography: the big section ordinal drifts against its heading, the serif
   subline lags it, the pull quote floats. Small numbers on purpose. The point
   is that the page has depth, not that anything is flying around.

   Writes `--par`, which the stylesheet composes into the arrival transform, so
   parallax and the reveal never fight over `transform`. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frame = document.querySelector('.frame');
  if (!frame || reduce) return;

  var LAYERS = [
    ['.shead .n', -30],          /* the ordinal, furthest back. Kept small: it sits
                                    directly above its heading and 78 drove it into it. */
    ['.shead .pairline', -34],   /* its serif subline, just behind the heading */
    ['.pull blockquote', -26],
    ['.pull .attrib', -44],
    ['.cell.gcell .glabel', -52],
    ['.shot figcaption', -30],
    ['.cell.lbl', -24]
  ];

  var items = [];
  LAYERS.forEach(function (pair) {
    Array.prototype.forEach.call(frame.querySelectorAll(pair[0]), function (el) {
      items.push({ el: el, rate: pair[1] });
    });
  });

  var nav = document.querySelector('.pillnav nav');
  if (!items.length && !nav) return;

  var ticking = false;
  function frameStep() {
    var vh = window.innerHeight;
    items.forEach(function (it) {
      var r = it.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;   /* offscreen, skip the write */
      /* clamped: an element taller than the viewport, or one measured while the
         page is still settling, drove d past +-0.5 and overshot the designed
         amplitude by up to 89%, pushing the italic subline up into the
         heading's clip and slicing its descenders */
      var d = Math.max(-0.5, Math.min(0.5, (r.top + r.height / 2 - vh / 2) / vh));
      it.el.style.setProperty('--par', (d * it.rate).toFixed(1) + 'px');
    });
    if (nav) {
      var max = document.documentElement.scrollHeight - vh;
      var p = max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0;
      nav.style.setProperty('--p', p.toFixed(4));
      /* The line begins just after the face, not underneath it. Anchored to
         the image rather than the whole name block, and measured rather than
         hard-coded because the avatar's right edge moves with the breakpoints:
         80px at desktop, 64px on a phone. */
      var face = nav.querySelector('.who img');
      if (face) {
        var x = face.getBoundingClientRect().right - nav.getBoundingClientRect().left;
        nav.style.setProperty('--track-x', Math.round(x + 12) + 'px');
      }
    }
    ticking = false;
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frameStep);
  }

  frameStep();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', frameStep);
})();

/* Pointer layer: the page answers the cursor.

   Cards tilt a few degrees toward the pointer and carry a soft light where it
   sits; buttons lean toward it before you arrive. Everything is written as a
   CSS variable, never as a transform, because the arrival and the parallax are
   already using that property and the last writer would win.

   Hover-capable, fine pointers only. A touch screen has no cursor to answer,
   and pointermove there would just fire on every tap. */
(function () {
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frame = document.querySelector('.frame');
  if (!frame || !fine || reduce) return;

  var TILT = 4;      /* degrees at the far corner */
  var MAGNET = 0.28; /* share of the distance a button leans */
  var MAGNET_MAX = 7;

  var cards = frame.querySelectorAll(
    '.vent,.job,.note,.plate,.phero .lead,.shot .shotframe,.bignum,.contact,.set,.wall'
  );
  Array.prototype.forEach.call(cards, function (el) {
    el.classList.add('lit-surface');
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      el.style.setProperty('--rx', ((0.5 - py) * TILT).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((px - 0.5) * TILT).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  var buttons = frame.querySelectorAll('.btn,.pillnav a.cta');
  Array.prototype.forEach.call(buttons, function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      /* eased rather than clipped: a hard cap meant the button sat at its
         maximum offset across two thirds of its own area, which reads as a
         shove rather than a lean */
      var cap = function (v, half) {
        var n = Math.max(-1, Math.min(1, v / Math.max(1, half)));
        return MAGNET_MAX * n * (1 - Math.abs(n) / 3);
      };
      el.style.setProperty('--mag-x', cap(dx, r.width / 2).toFixed(1) + 'px');
      el.style.setProperty('--mag-y', cap(dy, r.height / 2).toFixed(1) + 'px');
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--mag-x', '0px');
      el.style.setProperty('--mag-y', '0px');
    });
  });
})();

/* Motion layer: cards arrive as you reach them, numbers count up.
   Everything here is opt-out under prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frame = document.querySelector('.frame');
  var stats = document.querySelectorAll('.bignum b');
  if (!frame) return;

  /* Tag every content row on every page, so the motion is a property of the
     system rather than a list of hand-marked rows that new pages fall out of. */
  var SKIP = 'pillnav threadwrap crumb foot vhero';
  var rows = [];

  /* Walk the frame AND the main landmark. Wrapping every page in <main> for
     accessibility left frame.children as [threadwrap, header, main, footer],
     so <main> became the only tagged row and the twenty-two rows inside it got
     nothing: every reveal, stagger, parallax, hover lift and pointer tilt on
     the site was dead. Nothing looked broken, because a reveal that never
     arms is just content that is already visible, which is why the checks did
     not catch it either. */
  var hosts = [frame];
  var mainEl = frame.querySelector('main');
  if (mainEl) hosts.push(mainEl);

  hosts.forEach(function (host) {
    Array.prototype.forEach.call(host.children, function (el) {
      if (el.tagName === 'MAIN') return;
      var cls = el.className || '';
      if (SKIP.split(' ').some(function (c) { return cls.indexOf(c) > -1; })) return;
      if (!el.children.length) return;
      if (el.hasAttribute('data-rv')) return;
      el.setAttribute('data-rv', '');
      rows.push(el);
    });
  });
  Array.prototype.forEach.call(frame.querySelectorAll('.cgraph, .plate'), function (el) {
    if (el.classList.contains('plate')) el.setAttribute('data-plate', '');
    if (rows.indexOf(el) === -1) rows.push(el);
  });

  /* The hero introduces itself the moment the page opens. */
  var hero = frame.querySelector('.vhead') || frame.querySelector('.phero .lead');
  if (hero) hero.setAttribute('data-hero', '');

  var figs = frame.querySelectorAll('.gallery figure');

  if (reduce || !('IntersectionObserver' in window)) {
    rows.forEach(function (r) { r.classList.add('in'); });
    if (hero) hero.classList.add('in');
    Array.prototype.forEach.call(figs, function (f) { f.classList.add('in'); });
    return;
  }

  function stagger(parent, step, sel) {
    var kids = sel ? parent.querySelectorAll(sel) : parent.children;
    Array.prototype.forEach.call(kids, function (k, i) {
      k.style.transitionDelay = (i * step) + 'ms';
    });
  }
  rows.forEach(function (row) {
    stagger(row, 70);
    if (row.hasAttribute('data-plate')) stagger(row, 55, '.prow');
  });
  if (hero) stagger(hero, 90);

  /* -28% rather than -40px. At 40px a row crossed the line while it was still
     at the very bottom edge of the screen, so the whole 700ms entrance played
     below where anyone was looking and was finished by the time the row reached
     a readable position. Firing it 28% of a screen higher means you actually
     watch it happen. This is why the motion looked like it was not there. */
  function settle(row) {
    row.classList.add('settled');
    /* the stagger delay was inline, so hover inherited it too and a card in the
       last position of a row waited half a second before answering */
    Array.prototype.forEach.call(row.children, function (k) { k.style.transitionDelay = ''; });
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var row = e.target;
      row.classList.add('in');
      io.unobserve(row);
      var kids = row.children.length;
      /* entrance is 700ms plus the last child's stagger */
      setTimeout(function () { settle(row); }, 760 + kids * 70);
    });
  }, { threshold: 0, rootMargin: '0px 0px -28% 0px' });
  rows.forEach(function (r) { io.observe(r); });

  /* The trigger line sits 28% up the screen, so anything in the last 28% of a
     page can never reach it and would sit invisible forever. At the bottom of
     the document, everything left over arrives. */
  function sweepTail() {
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
    rows.forEach(function (r) { r.classList.add('in'); });
    Array.prototype.forEach.call(figs, function (f) { f.classList.add('in'); });
  }
  window.addEventListener('scroll', sweepTail, { passive: true });
  window.addEventListener('resize', sweepTail, { passive: true });
  window.addEventListener('load', sweepTail);
  sweepTail();

  /* the hero runs on load, not on scroll */
  if (hero) requestAnimationFrame(function () { hero.classList.add('in'); });

  var gio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e, i) {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = ((i % 6) * 45) + 'ms';
      e.target.classList.add('in');
      gio.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -22% 0px' });
  Array.prototype.forEach.call(figs, function (f) { gio.observe(f); });

  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var raw = el.textContent.trim();
    var m = raw.match(/^(\d+)(\D*)$/);
    if (!m) return;
    var target = parseInt(m[1], 10), suffix = m[2], t0 = null;
    var dur = 900;
    el.style.fontVariantNumeric = 'tabular-nums';
    // reserve the final width so counting never reflows the tile
    el.style.display = 'inline-block';
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var sio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      countUp(e.target);
      sio.unobserve(e.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -28% 0px' });
  stats.forEach(function (s) { sio.observe(s); });
})();

/* Command palette. Cmd+K or Ctrl+K anywhere, or / when you are not typing.

   Built here rather than as its own file so it costs no extra request, and
   built from a plain list rather than by crawling the DOM so it can reach
   pages you are not currently on. Progressive enhancement: with no JS there is
   no palette and every destination is still a link in the nav or the footer. */
(function () {
  if (!document.body || !window.matchMedia) return;

  var ITEMS = [
    { k: 'Page',    t: 'Home',                    u: '/' },
    { k: 'Page',    t: 'Building with AI',        u: '/ai', s: 'claude agent loop extraction ocr probes verification llm model prompt injection' },
    { k: 'Page',    t: 'Photos',                  u: '/photos' },
    { k: 'Page',    t: 'Field notes',             u: '/notes/' },
    { k: 'Page',    t: 'Now',                     u: '/now' },
    { k: 'Page',    t: 'CV',                      u: '/cv' },
    { k: 'Page',    t: 'Colophon',                u: '/colophon' },
    { k: 'Product', t: 'PitStop',                 u: '/pitstop', s: 'garage management gst upi india' },
    { k: 'Product', t: 'Hey Saathi',              u: '/saathi',  s: 'voice companion elderly malayalam telugu' },
    { k: 'Product', t: 'Roko',                    u: '/roko',    s: 'home security hardware' },
    { k: 'Work',    t: 'Technet LLC',             u: '/technet', s: 'risk analytics product manager' },
    { k: 'Work',    t: 'Expenzing',               u: '/expenzing', s: 'procurement loan origination product owner' },
    { k: 'Note',    t: 'Four Design Systems in Five Days', u: '/notes/three-design-systems', s: 'churn redesign' },
    { k: 'Note',    t: 'The Feature I Measured, Walked Back and Shipped Smaller', u: '/notes/pitstop-realtime', s: 'realtime' },
    { k: 'Section', t: 'Things I am building',     u: '/#building' },
    { k: 'Section', t: 'Building with AI',        u: '/#ai' },
    { k: 'Section', t: 'Where I have worked',      u: '/#work' },
    { k: 'Contact', t: 'Email me',                 u: 'mailto:venkatesh@venkateshgardas.com' },
    { k: 'Contact', t: 'Book a call',              u: 'https://cal.com/venky1104' },
    { k: 'Contact', t: 'LinkedIn',                 u: 'https://www.linkedin.com/in/venkateshgardas' },
    { k: 'Contact', t: 'GitHub',                   u: 'https://github.com/venkygardas' },
    { k: 'Contact', t: 'Download the CV as a PDF', u: '/venkatesh-gardas-cv.pdf' }
  ];

  var mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
  var wrap = document.createElement('div');
  wrap.className = 'cmdk';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'Search this site');
  wrap.innerHTML =
    '<div class="cmdk-box">' +
      '<input class="cmdk-in" type="text" autocomplete="off" spellcheck="false" ' +
        'placeholder="Jump to a page, a product, a note" aria-label="Search this site" ' +
        'role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list">' +
      '<ul class="cmdk-list" id="cmdk-list" role="listbox"></ul>' +
      '<div class="cmdk-foot">Enter to open · arrows to move · esc to close</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var input = wrap.querySelector('.cmdk-in');
  var list = wrap.querySelector('.cmdk-list');
  var shown = [], sel = 0, lastFocus = null;

  function render(q) {
    q = (q || '').trim().toLowerCase();
    shown = ITEMS.filter(function (it) {
      if (!q) return true;
      return (it.t + ' ' + it.k + ' ' + (it.s || '')).toLowerCase().indexOf(q) > -1;
    });
    sel = 0;
    list.innerHTML = '';
    if (!shown.length) {
      list.innerHTML = '<li class="cmdk-empty" role="presentation">Nothing matches that</li>';
      input.removeAttribute('aria-activedescendant');
      return;
    }
    shown.forEach(function (it, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = 'cmdk-o' + i;
      li.innerHTML = '<span class="k"></span><span class="t"></span>';
      li.firstChild.textContent = it.k;
      li.lastChild.textContent = it.t;
      li.addEventListener('mouseenter', function () { sel = i; mark(); });
      li.addEventListener('click', function () { go(it); });
      list.appendChild(li);
    });
    mark();
  }

  function mark() {
    Array.prototype.forEach.call(list.children, function (li, i) {
      li.setAttribute('aria-selected', i === sel ? 'true' : 'false');
    });
    var cur = list.children[sel];
    if (cur) {
      input.setAttribute('aria-activedescendant', cur.id);
      if (cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    }
  }

  function go(it) {
    close();
    if (it.u.indexOf('mailto:') === 0) { window.location.href = it.u; return; }
    if (/^https?:/.test(it.u)) {
      /* noopener, or the opened page gets a live handle on this one */
      var w = window.open(it.u, '_blank', 'noopener');
      if (w) w.opener = null;
      return;
    }
    window.location.href = it.u;
  }

  function open() {
    lastFocus = document.activeElement;
    wrap.classList.add('on');
    input.value = '';
    render('');
    input.focus();
  }
  function close() {
    wrap.classList.remove('on');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function typing(el) {
    if (!el) return false;
    var t = (el.tagName || '').toLowerCase();
    return t === 'input' || t === 'textarea' || t === 'select' || el.isContentEditable;
  }

  document.addEventListener('keydown', function (e) {
    var openKey = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
    if (openKey) { e.preventDefault(); wrap.classList.contains('on') ? close() : open(); return; }
    if (e.key === '/' && !wrap.classList.contains('on') && !typing(document.activeElement)) {
      e.preventDefault(); open(); return;
    }
    if (!wrap.classList.contains('on')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); if (shown.length) { sel = (sel + 1) % shown.length; mark(); } return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); if (shown.length) { sel = (sel - 1 + shown.length) % shown.length; mark(); } return; }
    if (e.key === 'Enter') { e.preventDefault(); if (shown[sel]) go(shown[sel]); return; }
    /* a modal must not leak focus to the page behind it */
    if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
  });

  input.addEventListener('input', function () { render(input.value); });
  wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });

  /* say the shortcut exists, in the one place always on screen */
  var nav = document.querySelector('.pillnav .who');
  if (nav) {
    var hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'cmdk-hint';
    hint.textContent = mac ? '⌘K' : 'Ctrl K';
    hint.setAttribute('aria-label', 'Search this site');
    hint.addEventListener('click', open);
    nav.appendChild(hint);
  }
})();

/* Theme toggle. Three states: no stored choice follows the system, and an
   explicit choice wins in both directions, so someone on a dark system who
   wants this page light can have it. The applying happens in the inline head
   script, before first paint; this only builds the control and stores the
   choice. */
(function () {
  var nav = document.querySelector('.pillnav nav');
  if (!nav) return;
  var root = document.documentElement;

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'themetog';
  btn.innerHTML =
    '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/>' +
      '<path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>' +
    '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.3 8.3 0 1 0 10.5 10.5z"/></svg>';

  function systemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function isDark() {
    var set = root.getAttribute('data-theme');
    return set ? set === 'dark' : systemDark();
  }
  function label() {
    /* A label that already names the action must not also carry aria-pressed:
       a screen reader then says "switch to the light theme, pressed", which
       states the opposite of what the control will do. The label alone is the
       accessible name, so the state is dropped. */
    btn.setAttribute('aria-label', isDark() ? 'Switch to the light theme' : 'Switch to the dark theme');
  }

  btn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
  });

  /* if the reader has expressed no choice, follow the system live */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (!root.getAttribute('data-theme')) label(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  label();
  nav.appendChild(btn);
})();

/* Photo viewer. The grid is a contact sheet; this shows the print.

   Progressive enhancement: with no script the gallery is exactly what it was,
   a grid of images. Nothing here changes the markup the page ships with, so
   there is no state to get wrong before the script runs. */
(function () {
  var grid = document.querySelector('.gallery .cols');
  if (!grid) return;
  var figures = Array.prototype.slice.call(grid.querySelectorAll('figure'));
  if (!figures.length) return;

  /* Each frame becomes operable: clickable, tabbable, and answering Enter and
     Space the way a button does, because a div that only listens for click is
     invisible to anyone not using a mouse. */
  figures.forEach(function (fig, i) {
    fig.setAttribute('role', 'button');
    fig.setAttribute('tabindex', '0');
    var img = fig.querySelector('img');
    fig.setAttribute('aria-label', 'View photograph' + (img && img.alt ? ': ' + img.alt : ''));
    fig.addEventListener('click', function () { open(i); });
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  var box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photograph viewer');
  box.innerHTML =
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button class="lb-btn lb-close" type="button" aria-label="Close viewer">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<button class="lb-btn lb-prev" type="button" aria-label="Previous photograph">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<button class="lb-btn lb-next" type="button" aria-label="Next photograph">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
    '<div class="lb-count" aria-hidden="true"></div>';
  document.body.appendChild(box);

  var lbImg = box.querySelector('img');
  var lbCap = box.querySelector('figcaption');
  var lbCount = box.querySelector('.lb-count');
  var btnClose = box.querySelector('.lb-close');
  var btnPrev = box.querySelector('.lb-prev');
  var btnNext = box.querySelector('.lb-next');
  var at = 0, lastFocus = null, scrollY = 0;

  /* The grid deliberately serves a small file for a small slot. The viewer is
     the one place the full-resolution photograph is the right answer, so take
     the widest candidate from the srcset rather than reusing the thumbnail. */
  function fullSrc(fig) {
    var source = fig.querySelector('source[srcset]');
    var img = fig.querySelector('img');
    if (source) {
      var best = null, bestW = 0;
      source.getAttribute('srcset').split(',').forEach(function (part) {
        var bits = part.trim().split(/\s+/);
        var w = parseInt(bits[1] || '0', 10);
        if (w >= bestW) { bestW = w; best = bits[0]; }
      });
      if (best) return best;
    }
    return img ? img.currentSrc || img.src : '';
  }

  function show(i) {
    at = (i + figures.length) % figures.length;
    var fig = figures[at];
    var img = fig.querySelector('img');
    lbImg.src = fullSrc(fig);
    lbImg.alt = img ? img.alt : '';
    lbCap.textContent = img ? img.alt : '';
    lbCount.textContent = (at + 1) + ' / ' + figures.length;
  }

  function open(i) {
    lastFocus = document.activeElement;
    if (lastFocus === document.body) lastFocus = null;
    /* hold the page still behind the viewer without losing the reader's place */
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollY + 'px';
    document.body.style.width = '100%';
    show(i);
    box.classList.add('on');
    btnClose.focus();
  }

  function close() {
    box.classList.remove('on');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
    /* Focus lands on the photograph you were actually looking at, not the one
       you opened: after arrowing through nine frames, being returned to the
       first is disorienting and loses your place in the grid. */
    var back = figures[at] || lastFocus;
    if (back && back.focus) back.focus({ preventScroll: true });
  }

  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { show(at - 1); });
  btnNext.addEventListener('click', function () { show(at + 1); });
  box.addEventListener('mousedown', function (e) { if (e.target === box) close(); });

  document.addEventListener('keydown', function (e) {
    if (!box.classList.contains('on')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
    else if (e.key === 'Tab') {
      /* a modal must not hand focus back to the page behind it */
      var stops = [btnClose, btnPrev, btnNext];
      var i = stops.indexOf(document.activeElement);
      e.preventDefault();
      stops[(i + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
    }
  });

  /* swipe, because this is a photo gallery and phones are how it gets read */
  var x0 = null;
  box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 45) show(at + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });
})();
