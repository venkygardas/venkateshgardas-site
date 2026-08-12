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

  function build() {
    H = frame.scrollHeight;
    var W = frame.clientWidth;
    if (!H || !W || W < 1100) { wrap.style.display = W < 1100 ? 'none' : ''; if (W < 1100) return; }
    wrap.style.display = '';

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');

    var frameTop = frame.getBoundingClientRect().top + window.scrollY;
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
    pts.slice(1, -1).forEach(function (p) {
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', p[0]);
      c.setAttribute('cy', p[1]);
      c.setAttribute('r', 3.5);
      c.setAttribute('class', 'thread-node');
      nodes.appendChild(c);
    });

    len = ink.getTotalLength();
    ink.style.strokeDasharray = len;
    draw();
  }

  function draw() {
    if (!len) return;
    if (reduce) { ink.style.strokeDashoffset = 0; return; }
    var span = Math.max(1, H - window.innerHeight * 0.38);
    var p = Math.max(0, Math.min(1, (window.scrollY + window.innerHeight * 0.62) / span));
    ink.style.strokeDashoffset = len * (1 - p);
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
  var rows = document.querySelectorAll('.rv, .cgraph');
  var stats = document.querySelectorAll('.bignum b');

  if (reduce || !('IntersectionObserver' in window)) {
    rows.forEach(function (r) { r.classList.add('in'); });
    return;
  }

  rows.forEach(function (row) {
    Array.prototype.forEach.call(row.children, function (cell, i) {
      cell.style.transitionDelay = (i * 70) + 'ms';
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  rows.forEach(function (r) { io.observe(r); });

  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    var raw = el.textContent.trim();
    var m = raw.match(/^(\d+)(\D*)$/);
    if (!m) return;
    var target = parseInt(m[1], 10), suffix = m[2], t0 = null;
    var dur = 900;
    el.style.fontVariantNumeric = 'tabular-nums';
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
