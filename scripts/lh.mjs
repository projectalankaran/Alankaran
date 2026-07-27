// scripts/lh.mjs — one-command Lighthouse run against the production build.
//
// Boots scripts/serve-dist.mjs (Brotli + vercel.json cache headers, so the numbers are comparable
// to PageSpeed Insights rather than inventing compression/caching failures), runs Lighthouse, prints
// the only metrics that matter for this workstream, and tears the server down.
//
// Usage: node scripts/lh.mjs [mobile|desktop] [label]

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FORM = process.argv[2] || 'mobile'
const LABEL = process.argv[3] || FORM
const PORT = 4191
const OUT = `/tmp/lh-${LABEL}.json`

const server = spawn('node', [path.join(__dirname, 'serve-dist.mjs'), String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 1200))

const args = [
  '--yes', 'lighthouse@12', `http://127.0.0.1:${PORT}/`,
  '--only-categories=performance', '--output=json', `--output-path=${OUT}`,
  '--chrome-flags=--headless=new --no-sandbox --disable-gpu', '--quiet',
]
if (FORM === 'desktop') args.push('--preset=desktop')

await new Promise((resolve) => {
  const lh = spawn('npx', args, { stdio: 'ignore' })
  lh.on('close', resolve)
})
server.kill()

const r = JSON.parse(fs.readFileSync(OUT, 'utf-8'))
const a = r.audits
const nr = a['network-requests'].details.items
const bytes = nr.reduce((s, x) => s + (x.transferSize || 0), 0)
const imgBytes = nr.filter((x) => x.resourceType === 'Image').reduce((s, x) => s + (x.transferSize || 0), 0)

const W = { 'first-contentful-paint': 0.1, 'speed-index': 0.1, 'largest-contentful-paint': 0.25, 'total-blocking-time': 0.3, 'cumulative-layout-shift': 0.25 }

console.log(`\n──── ${LABEL.toUpperCase()} ────  SCORE ${Math.round(r.categories.performance.score * 100)}`)
for (const k of Object.keys(W)) {
  console.log(`  ${k.padEnd(26)} ${(a[k].displayValue || '').padEnd(9)} score=${a[k].score.toFixed(2)}  lost=${((1 - a[k].score) * W[k] * 100).toFixed(1)}pt`)
}
console.log(`  ${'total transfer'.padEnd(26)} ${(bytes / 1024).toFixed(0)} KB   (images ${(imgBytes / 1024).toFixed(0)} KB, ${nr.length} requests)`)
