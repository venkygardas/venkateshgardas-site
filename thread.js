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

  /* How far along the path a given height sits. Bisection rather than a scan:
     the path runs several thousand units and getPointAtLength is the expensive
     call. The path only ever descends, so y is monotonic in length. */
  function lengthAtY(y, total) {
    var lo = 0, hi = total;
    for (var i = 0; i < 18; i++) {
      var mid = (lo + hi) / 2;
      if (ink.getPointAtLength(mid).y < y) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
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
  Array.prototype.forEach.call(frame.children, function (el) {
    var cls = el.className || '';
    if (SKIP.split(' ').some(function (c) { return cls.indexOf(c) > -1; })) return;
    if (!el.children.length) return;
    el.setAttribute('data-rv', '');
    rows.push(el);
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

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  rows.forEach(function (r) { io.observe(r); });

  /* the hero runs on load, not on scroll */
  if (hero) requestAnimationFrame(function () { hero.classList.add('in'); });

  var gio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e, i) {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = ((i % 6) * 45) + 'ms';
      e.target.classList.add('in');
      gio.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
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
  }, { threshold: 0.25 });
  stats.forEach(function (s) { sio.observe(s); });
})();
