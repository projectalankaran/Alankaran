// scripts/serve-dist.mjs
//
// Serves dist/static the way Vercel actually serves it, so local Lighthouse runs are comparable to
// PageSpeed Insights rather than misleading.
//
// Mirrors vercel.json: Brotli/gzip negotiation for text assets, cleanUrls, the SPA rewrite, and the
// exact Cache-Control headers. Without compression a local run invents an "enable text compression"
// failure and inflates every transfer-size audit; without the cache headers it invents an
// "efficient cache policy" failure. Both would send an investigation chasing ghosts.
//
// Usage: node scripts/serve-dist.mjs [port]

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '..', 'dist', 'static')
const PORT = Number(process.argv[2] || 4178)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain',
}

// Text types Vercel compresses. Images are already compressed and must not be re-encoded.
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt'])

function cacheControl(urlPath) {
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (urlPath.startsWith('/images/')) return 'public, max-age=2592000, stale-while-revalidate=86400'
  if (/^\/(favicon\.svg|opengraph\.jpg|robots\.txt|sitemap\.xml)$/.test(urlPath)) return 'public, max-age=86400'
  return 'public, max-age=0, must-revalidate'
}

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

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]
  const file = resolveFile(req.url)
  if (!file || !fs.existsSync(file)) { res.writeHead(404).end('not found'); return }

  const ext = path.extname(file)
  const headers = {
    'Content-Type': MIME[ext] ?? 'application/octet-stream',
    'Cache-Control': cacheControl(urlPath),
    'X-Content-Type-Options': 'nosniff',
  }

  const body = fs.readFileSync(file)
  const accept = req.headers['accept-encoding'] || ''

  if (COMPRESSIBLE.has(ext)) {
    if (/\bbr\b/.test(accept)) {
      const out = zlib.brotliCompressSync(body, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
      })
      res.writeHead(200, { ...headers, 'Content-Encoding': 'br', 'Content-Length': out.length }).end(out)
      return
    }
    if (/\bgzip\b/.test(accept)) {
      const out = zlib.gzipSync(body, { level: 9 })
      res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': out.length }).end(out)
      return
    }
  }

  res.writeHead(200, { ...headers, 'Content-Length': body.length }).end(body)
}).listen(PORT, '127.0.0.1', () => {
  console.log(`serving dist/static on http://127.0.0.1:${PORT} (brotli/gzip, vercel.json cache headers)`)
})
