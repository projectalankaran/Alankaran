// scripts/measure-cwv.mjs
//
// Loads a prerendered route in headless Chrome at a mobile viewport and reports what the browser
// ACTUALLY did: which LCP element it chose, which srcset candidate it downloaded, and the ordered
// resource waterfall with transfer sizes.
//
// This exists because srcset selection and LCP attribution are decided by the browser, not by the
// markup — reasoning about them from source is how you end up shipping a preload that doesn't match
// the render. Everything reported here is observed, not inferred.
//
// NOTE ON TIMINGS: there is no network throttling here (that needs CDP), so the millisecond values
// are localhost numbers and are NOT comparable to a Lighthouse mobile run. What IS meaningful and
// portable: the chosen `currentSrc`, the byte counts, the resource ordering, and the LCP element's
// identity. Those are the things this refactor set out to change.
//
// Usage: node scripts/measure-cwv.mjs [route]     (default "/")

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist', 'static')
const PORT = 41732
const ROUTE = process.argv[2] || '/'

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain',
}

const PROBE = `
<script>
(function () {
  var lcp = null;
  new PerformanceObserver(function (l) {
    var es = l.getEntries(); var e = es[es.length - 1];
    lcp = { url: e.url || null, tag: e.element ? e.element.tagName : null,
            cls: e.element ? (e.element.className || '').toString().slice(0, 60) : null,
            time: Math.round(e.startTime), size: e.size };
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  var shifts = 0;
  new PerformanceObserver(function (l) {
    l.getEntries().forEach(function (e) { if (!e.hadRecentInput) shifts += e.value; });
  }).observe({ type: 'layout-shift', buffered: true });

  window.addEventListener('load', function () {
    setTimeout(function () {
      var fcp = performance.getEntriesByName('first-contentful-paint')[0];
      var img = document.querySelector('img[fetchpriority="high"], img[fetchPriority="high"]');
      var res = performance.getEntriesByType('resource').map(function (r) {
        return { n: r.name.replace(location.origin, ''), t: Math.round(r.startTime),
                 b: r.transferSize, k: r.initiatorType };
      }).sort(function (a, b) { return a.t - b.t; });
      var out = { fcp: fcp ? Math.round(fcp.startTime) : null, lcp: lcp, cls: +shifts.toFixed(4),
                  dpr: window.devicePixelRatio, vw: innerWidth,
                  heroCurrentSrc: img ? img.currentSrc.replace(location.origin, '') : null,
                  rootChildren: document.getElementById('root').childElementCount,
                  resources: res };
      var d = document.createElement('div');
      d.id = '__cwv__'; d.textContent = JSON.stringify(out);
      document.body.appendChild(d);
    }, 600);
  });
})();
</script>`

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0])
  const candidates = clean === '/' ? ['index.html']
    : [clean.slice(1), `${clean.slice(1)}.html`, path.join(clean.slice(1), 'index.html')]
  for (const c of candidates) {
    const f = path.join(distDir, c)
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f
  }
  return path.extname(clean) ? null : path.join(distDir, 'index.html')
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url)
  if (!file || !fs.existsSync(file)) { res.writeHead(404).end('not found'); return }
  const ext = path.extname(file)
  if (ext === '.html') {
    const html = fs.readFileSync(file, 'utf-8').replace('</head>', `${PROBE}\n</head>`)
    res.writeHead(200, { 'Content-Type': 'text/html' }).end(html)
    return
  }
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})

await new Promise((r) => server.listen(PORT, '127.0.0.1', r))

const dom = await new Promise((resolve) => {
  const child = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-dev-shm-usage',
    '--window-size=412,823', '--force-device-scale-factor=1.75',
    '--virtual-time-budget=15000', '--dump-dom', `http://127.0.0.1:${PORT}${ROUTE}`,
  ])
  let out = ''
  child.stdout.on('data', (d) => (out += d))
  child.on('close', () => resolve(out))
})
server.close()

const raw = dom.match(/<div id="__cwv__">([\s\S]*?)<\/div>/)?.[1]
if (!raw) { console.error('probe did not report — page may not have loaded'); process.exit(1) }

const r = JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, '&'))

console.log(`\nROUTE ${ROUTE}   viewport ${r.vw}px @ DPR ${r.dpr}   (#root children after hydration: ${r.rootChildren})\n`)
console.log(`  LCP element   ${r.lcp?.tag ?? '?'}  ${r.lcp?.cls ? '.' + r.lcp.cls.split(' ').slice(0, 3).join('.') : ''}`)
console.log(`  LCP resource  ${r.lcp?.url?.replace(`http://127.0.0.1:${PORT}`, '') ?? '(text)'}`)
console.log(`  hero currentSrc  ${r.heroCurrentSrc ?? '(none)'}`)
console.log(`  CLS           ${r.cls}`)

const kb = (b) => (b / 1024).toFixed(1).padStart(7)
console.log(`\n  ${'#'.padEnd(3)}${'start'.padStart(6)}  ${'KB'.padStart(7)}  kind        resource`)
let total = 0
r.resources.forEach((x, i) => {
  total += x.b || 0
  console.log(`  ${String(i + 1).padEnd(3)}${String(x.t).padStart(6)}  ${kb(x.b || 0)}  ${(x.k || '').padEnd(11)} ${x.n.slice(0, 62)}`)
})
console.log(`\n  TOTAL TRANSFERRED (excl. HTML doc): ${(total / 1024).toFixed(1)} KB\n`)
