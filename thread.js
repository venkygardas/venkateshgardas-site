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
    if (!marks.length) return;

    /* a rail in the left margin: never crosses the content column */
    var colLeft = (W - Math.min(W, parseFloat(getComputedStyle(frame).getPropertyValue('--pw')) || 1240)) / 2;
    var mid = Math.max(18, colLeft * 0.42);
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
    var seen = window.scrollY + window.innerHeight * 0.62;
    var p = Math.max(0, Math.min(1, seen / H));
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
