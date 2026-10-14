/* Measures the contrast that is actually painted, in a real browser, in both
   themes.

   Two things this does that a token-pair probe cannot. It reads the computed
   colour off the element, so two rules colliding is visible rather than
   invisible. And it composites translucent backgrounds down the ancestor
   chain: a `color-mix(... 8%, transparent)` chip reports its own colour as the
   full-strength ink with an alpha, and a probe that drops the alpha concludes
   near-black text on a near-black fill and fails something that is fine. That
   false positive is the reason this file exists rather than the inline version
   it grew out of.

       python3 -m http.server 8190 &
       node scripts/contrast-check.mjs 8190
*/
import p from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGES = ['index', 'ai', 'cv', 'expenzing', 'pitstop', 'saathi', 'roko', 'kpmg',
  'now', 'colophon', 'photos', '404', 'notes/index'];
const port = process.argv[2] || 8190;

const browser = await p.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1340, height: 1000 });
const bad = [];
let checked = 0;

for (const theme of ['light', 'dark']) {
  for (const f of PAGES) {
    await page.goto(`http://localhost:${port}/${f}.html`, { waitUntil: 'networkidle2' });
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    await new Promise(r => setTimeout(r, 180));
    const found = await page.evaluate(() => {
      const parse = s => {
        const n = (s.match(/[\d.]+/g) || []).map(Number);
        return n.length >= 4 ? n.slice(0, 4) : [...n.slice(0, 3), 1];
      };
      const over = (fg, bg) => {                       // src-over, straight alpha
        const a = fg[3];
        return [0, 1, 2].map(i => fg[i] * a + bg[i] * (1 - a)).concat(1);
      };
      /* Walk up compositing every translucent layer, so the answer is the
         colour a camera pointed at the screen would record. */
      const bgOf = el => {
        const stack = [];
        for (let n = el; n; n = n.parentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c[3] > 0) stack.push(c);
          if (c[3] === 1) break;
        }
        let out = stack.pop() || [255, 255, 255, 1];
        while (stack.length) out = over(stack.pop(), out);
        return out;
      };
      const lum = c => {
        const [r, g, b] = c.slice(0, 3).map(v => {
          v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const out = [];
      document.querySelectorAll('p,li,h1,h2,h3,span,dd,dt,a,figcaption,code,blockquote').forEach(el => {
        // only elements that paint their own text, not wrappers around children
        const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        if (!own) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none') return;
        if (!el.getClientRects().length) return;
        if (el.closest('.sr-only, .skip, .lightbox')) return;
        const fgRaw = parse(cs.color);
        const bg = bgOf(el);
        const fg = fgRaw[3] < 1 ? over(fgRaw, bg) : fgRaw;
        const L1 = lum(fg), L2 = lum(bg);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const px = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
        out.push({ sel: (el.className || el.tagName).toString().slice(0, 30),
                   ratio: +ratio.toFixed(2), need, px: +px.toFixed(1),
                   txt: el.textContent.trim().slice(0, 26) });
      });
      return out;
    });
    checked += found.length;
    found.forEach(r => {
      if (r.ratio < r.need)
        bad.push(`${theme} ${f}: <${r.sel}> ${r.ratio}:1 at ${r.px}px, needs ${r.need} "${r.txt}"`);
    });
  }
}

await browser.close();
if (bad.length) {
  console.log(`FAILED (${bad.length}):`);
  bad.forEach(b => console.log('  -', b));
  process.exit(1);
}
console.log(`OK: ${checked} text elements measured across ${PAGES.length} pages x 2 themes, `
  + 'every one clears its WCAG floor');
