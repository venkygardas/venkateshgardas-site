/* What this run has to prove, because none of it is visible in the source:
   the nav still fits on one line now that it carries a ninth item, the bar
   fills end up the widths the numbers say they should, the split bar's three
   segments actually tile the track, and the reading frame still holds its
   invariant on the new page in both themes. */
import p from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await p.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
const bad = [];

/* The nav wrapped once before, between 642 and 741px, so sample across the
   whole range rather than at the two widths that happen to be round numbers. */
const NAVW = [1440, 1240, 1100, 1024, 900, 820, 800, 790, 760, 741, 700, 660, 642, 600, 420, 375, 320];
for (const w of NAVW) {
  await page.setViewport({ width: w, height: 900 });
  await page.goto('http://localhost:8190/ai.html', { waitUntil: 'networkidle2' });
  const nav = await page.evaluate(() => {
    const n = document.querySelector('.pillnav nav');
    const links = [...n.querySelectorAll('a')];
    /* Rows, not pixel tops. The Contact button carries more vertical padding
       than the plain links, so its box starts a few pixels higher while sitting
       on the same line. Bucket anything within half a line height together, or
       every width reports a wrap that is not there. */
    const vis = links.filter(a => a.offsetParent);
    const rows = [];
    vis.map(a => a.getBoundingClientRect().top).forEach(t => {
      if (!rows.some(r => Math.abs(r - t) < 14)) rows.push(t);
    });
    return { h: Math.round(n.getBoundingClientRect().height), rows: rows.length,
             shown: vis.length, labels: vis.map(a => a.textContent.trim()).join(' '),
             overflow: n.scrollWidth - Math.ceil(n.getBoundingClientRect().width) };
  });
  if (nav.rows > 1) bad.push(`nav ${w}px: links sit on ${nav.rows} rows (height ${nav.h}) [${nav.labels}]`);
  if (nav.overflow > 1) bad.push(`nav ${w}px: overflows its pill by ${nav.overflow}px [${nav.labels}]`);
}

await page.setViewport({ width: 1440, height: 1000 });
await page.goto('http://localhost:8190/ai.html', { waitUntil: 'networkidle2' });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 1600));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 1200));

const charts = await page.evaluate(() => {
  const out = { bars: [], split: null, revealed: null };
  document.querySelectorAll('.bars').forEach(ul => {
    [...ul.children].forEach(li => {
      const track = li.querySelector('.bt').getBoundingClientRect().width;
      const fill = li.querySelector('.bt i');
      const want = parseFloat(getComputedStyle(fill).getPropertyValue('--v'));
      const got = fill.getBoundingClientRect().width;
      out.bars.push({ label: li.querySelector('.bl').textContent, want,
                      gotPct: +(got / track * 100).toFixed(1), track: Math.round(track) });
    });
  });
  const sb = document.querySelector('.splitbar');
  if (sb) {
    const w = sb.getBoundingClientRect().width;
    const segs = [...sb.querySelectorAll('i')].map(i => +(i.getBoundingClientRect().width / w * 100).toFixed(1));
    out.split = { segs, sum: +segs.reduce((a, b) => a + b, 0).toFixed(1), width: Math.round(w) };
  }
  out.revealed = document.querySelectorAll('[data-rv].in').length + '/' + document.querySelectorAll('[data-rv]').length;
  return out;
});

charts.bars.forEach(b => {
  if (Math.abs(b.gotPct - b.want) > 1.2)
    bad.push(`bar "${b.label.trim()}": painted ${b.gotPct}% of a ${b.track}px track, declared ${b.want}%`);
});
if (charts.split && Math.abs(charts.split.sum - 100) > 1.2)
  bad.push(`split bar segments total ${charts.split.sum}%, not 100`);

/* The pinned rule for reading pages: prose and card share both edges exactly. */
for (const theme of ['light', 'dark']) {
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  await new Promise(r => setTimeout(r, 120));
  const edge = await page.evaluate(() => {
    const prose = document.querySelector('.prose p');
    const card = prose.closest('.cell');
    const a = prose.getBoundingClientRect(), b = card.getBoundingClientRect();
    const cs = getComputedStyle(card);
    return { left: Math.round(a.left - b.left - parseFloat(cs.paddingLeft)),
             right: Math.round(b.right - parseFloat(cs.paddingRight) - a.right) };
  });
  if (edge.left !== 0 || edge.right !== 0)
    bad.push(`${theme}: prose is inset from its card by ${edge.left}px / ${edge.right}px`);
}

console.log('bars      ', JSON.stringify(charts.bars));
console.log('split     ', JSON.stringify(charts.split));
console.log('revealed  ', charts.revealed);
await browser.close();
if (bad.length) { console.log(`\nFAILED (${bad.length}):`); bad.forEach(b => console.log('  -', b)); process.exit(1); }
console.log(`\nOK: nav single-row at ${NAVW.length} widths, bars paint their declared widths, frame invariant holds in both themes`);
