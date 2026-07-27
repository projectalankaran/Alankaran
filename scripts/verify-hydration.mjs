// scripts/verify-hydration.mjs
//
// Loads every prerendered route in headless Chrome and fails if hydration was not clean.
//
// WHY THIS EXISTS
// ---------------
// `src/main.tsx` switched from `createRoot` to `hydrateRoot`. That change is only safe while the
// server-rendered markup and the first client render agree. When they diverge React does not throw —
// it silently patches the DOM, which reintroduces exactly the "prerendered content gets replaced"
// problem the migration was meant to remove, and can knock out the LCP element. A silent regression
// is the worst kind, so this makes it a build-checkable gate.
//
// Checks per route:
//   1. No React hydration warning / recoverable error on the console.
//   2. No uncaught page errors.
//   3. The LCP element survives hydration — the element matching the head preload is still in the
//      post-hydration DOM, so React adopted it rather than replacing it.
//
// Usage: node scripts/verify-hydration.mjs        (expects a prior `npm run build`)

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist', 'static')
const PORT = 41731

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const ROUTES = ['/', '/about', '/services', '/destinations', '/wedding-stories', '/gallery', '/testimonials', '/contact']

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain',
}

// Mirrors the Vercel config: `cleanUrls` + a SPA fallback for extensionless paths.
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0])
  const candidates =
    clean === '/'
      ? ['index.html']
      : [clean.slice(1), `${clean.slice(1)}.html`, path.join(clean.slice(1), 'index.html')]

  for (const c of candidates) {
    const f = path.join(distDir, c)
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f
  }
  return path.extname(clean) ? null : path.join(distDir, 'index.html')
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url)
  if (!file || !fs.existsSync(file)) {
    res.writeHead(404).end('not found')
    return
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
})

// Console lines that are noise rather than signal (third-party network failures in a sandbox etc.)
const IGNORE = [
  /Failed to load resource/i,
  /net::ERR_/i,
  /favicon/i,
  /fonts\.googleapis|fonts\.gstatic|images\.unsplash|res\.cloudinary|firestore|googleapis/i,
]

const HYDRATION_SIGNALS = [
  /hydrat/i,
  /did not match/i,
  /server (?:HTML|rendered)/i,
  /server\/client/i,
  /Minified React error #(?:418|423|425)/i, // hydration mismatch / text mismatch / recoverable
]

function loadRoute(route) {
  return new Promise((resolve) => {
    const args = [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run',
      '--disable-dev-shm-usage', '--enable-logging=stderr', '--v=0',
      '--window-size=412,823',
      '--virtual-time-budget=12000',
      '--dump-dom',
      `http://127.0.0.1:${PORT}${route}`,
    ]
    const child = spawn(CHROME, args)
    let dom = ''
    let log = ''
    child.stdout.on('data', (d) => (dom += d))
    child.stderr.on('data', (d) => (log += d))
    child.on('close', () => resolve({ dom, log }))
  })
}

const failures = []

await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
console.log(`serving ${path.relative(process.cwd(), distDir)} on :${PORT}\n`)

for (const route of ROUTES) {
  const { dom, log } = await loadRoute(route)

  const consoleLines = log
    .split('\n')
    .filter((l) => /:(?:ERROR|WARNING|INFO):CONSOLE/.test(l))
    .map((l) => l.replace(/^\[[^\]]*\]\s*/, '').trim())
    .filter((l) => !IGNORE.some((re) => re.test(l)))

  const hydrationIssues = consoleLines.filter((l) => HYDRATION_SIGNALS.some((re) => re.test(l)))
  const errors = consoleLines.filter((l) => /:ERROR:CONSOLE/.test(l) || /Uncaught/.test(l))

  // The route's own prerendered file tells us which image the head preloads; that element must
  // still be in the DOM after hydration.
  const file = resolveFile(route)
  const source = fs.readFileSync(file, 'utf-8')
  const preloaded =
    source.match(/<link rel="preload" as="image"[^>]*imagesrcset="([^" ]+)/i)?.[1] ??
    source.match(/<link rel="preload" as="image"[^>]*href="([^"]+)"/i)?.[1]

  const lcpSurvived = preloaded ? dom.includes(preloaded) : false
  const hasRoot = /<div id="root">\s*<\S/.test(dom)

  const ok = hydrationIssues.length === 0 && errors.length === 0 && lcpSurvived && hasRoot
  console.log(`${ok ? '  ✓' : '  ✗'} ${route.padEnd(18)} hydration:${hydrationIssues.length === 0 ? 'clean' : 'ISSUES'}  errors:${errors.length}  lcp-element:${lcpSurvived ? 'survived' : 'MISSING'}`)

  if (!ok) {
    failures.push({ route, hydrationIssues, errors, lcpSurvived, preloaded })
  }
}

server.close()

if (failures.length) {
  console.log('\n─── FAILURES ───')
  for (const f of failures) {
    console.log(`\n${f.route}`)
    if (!f.lcpSurvived) console.log(`  LCP element missing after hydration (preloaded: ${f.preloaded})`)
    for (const l of [...f.hydrationIssues, ...f.errors]) console.log(`  ${l}`)
  }
  process.exit(1)
}

console.log('\nAll routes hydrated cleanly.')
