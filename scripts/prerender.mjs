import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, '..', p)

const template = fs.readFileSync(toAbsolute('dist/static/index.html'), 'utf-8')
const serverAssetsDir = toAbsolute('dist/server/assets')
const entryFile = fs.readdirSync(serverAssetsDir).find(f => f.startsWith('entry-server') && f.endsWith('.js'))
const { render } = await import(`file://${path.join(serverAssetsDir, entryFile)}`)

// ─────────────────────────────────────────────────────────────────────────────
// Document-head assembly
//
// `react-helmet-async@3` no longer collects tags into `helmetContext` — it detects React 19 and
// defers to React's own metadata handling (see its `React19Dispatcher`). On the client React hoists
// <title>/<meta>/<link> into <head> itself, but `renderToPipeableStream` is rendering an app
// *subtree* here (there is no <head> element in the tree), so React has nowhere to hoist to and
// emits those tags inline, wherever the component sits.
//
// The consequences in the shipped HTML were:
//   - `<!--app-head-->` was replaced with an empty string, so every route served the generic
//     template <title> and description instead of its own.
//   - The page-specific <title> and <meta> ended up inside <body>, which is invalid and means
//     `document.title` never reflected the route.
//   - The hero image preload landed in <body>, after ~145 KB of module preloads — the single worst
//     possible position for the tag that is supposed to start the LCP fetch.
//
// So we do the hoist ourselves, deterministically, at build time.
// ─────────────────────────────────────────────────────────────────────────────

const TITLE_RE = /<title[^>]*>[\s\S]*?<\/title>/gi
const META_RE = /<meta\b[^>]*\/?>/gi
const LINK_RE = /<link\b[^>]*\/?>/gi

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))
  return m ? m[1] : null
}

/** Pulls every hoistable metadata tag out of the rendered body and returns them separately. */
function extractHead(appHtml) {
  const titles = appHtml.match(TITLE_RE) ?? []
  const metas = appHtml.match(META_RE) ?? []
  const links = appHtml.match(LINK_RE) ?? []

  let body = appHtml
  for (const tag of [...titles, ...metas, ...links]) body = body.replace(tag, '')

  return { titles, metas, links, body }
}

/**
 * Merges hoisted tags into the template head.
 *
 * The template already carries a generic <title>/<meta> set (used for any route that renders no SEO
 * component, and as the OG defaults). Route-specific tags must *replace* those rather than stack on
 * top of them, or crawlers see two titles and two descriptions.
 */
function mergeIntoHead(head, { titles, metas, links }) {
  let out = head

  // Title — the route's own wins over the template default.
  const routeTitle = titles.at(-1)
  if (routeTitle) {
    out = out.match(TITLE_RE) ? out.replace(TITLE_RE, routeTitle) : out.replace('</head>', `  ${routeTitle}\n</head>`)
  }

  // Meta — keyed by name= or property=, last occurrence wins, replacing any template default.
  const seenMeta = new Map()
  for (const tag of metas) {
    const key = attr(tag, 'name') ?? attr(tag, 'property')
    if (key) seenMeta.set(key, tag)
  }
  const appended = []
  for (const [key, tag] of seenMeta) {
    const existing = new RegExp(`<meta\\b[^>]*\\b(?:name|property)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i')
    if (existing.test(out)) out = out.replace(existing, tag)
    else appended.push(tag)
  }

  // Links — canonical, alternates. Deduped by rel+href.
  const seenLink = new Set()
  for (const tag of links) {
    const key = `${attr(tag, 'rel')}|${attr(tag, 'href')}`
    if (seenLink.has(key)) continue
    seenLink.add(key)
    if (!out.includes(tag)) appended.push(tag)
  }

  if (appended.length) out = out.replace('</head>', `    ${appended.join('\n    ')}\n  </head>`)
  return out
}

/**
 * Builds the LCP image preload from what the page actually rendered.
 *
 * Deriving the hint from the output — rather than hand-declaring it in a component — is what
 * guarantees the preload and the real request are the same bytes. The previous `preloadImage` prop
 * on <SEO> declared the raw full-resolution URL while the hero rendered a responsive `srcset`, so
 * the preload fetched a second, larger copy of the hero that was then thrown away.
 *
 * For a <picture>, emit a preload for the FIRST <source> only — never one per source.
 *
 * `type` on a preload means "fetch this if you can DECODE this type", not "fetch this if you would
 * CHOOSE it". Chrome decodes both AVIF and WebP, so emitting one hint per source made it download
 * the hero twice (measured: 99.7 KB AVIF + 136.7 KB WebP for the same image) — reintroducing the
 * exact double-download this refactor set out to remove.
 *
 * Preloading only the most-preferred format is correct for every client:
 *   - AVIF-capable browsers preload AVIF, which is also what <picture> selects. Hint matches render.
 *   - Safari < 16.4 cannot decode AVIF, so it ignores the hint entirely and discovers the WebP
 *     <source> through normal parsing — no wasted bytes, just no head start on a shrinking minority.
 */
function buildImagePreloads(appHtml) {
  const hints = []

  const pictures = appHtml.match(/<picture\b[\s\S]*?<\/picture>/gi) ?? []
  const lcpPicture = pictures.find(p => /fetchPriority=["']high["']/i.test(p))

  if (lcpPicture) {
    const firstSource = (lcpPicture.match(/<source\b[^>]*\/?>/gi) ?? [])[0]
    const srcset = firstSource && (attr(firstSource, 'srcSet') ?? attr(firstSource, 'srcset'))
    if (srcset) {
      const type = attr(firstSource, 'type')
      const sizes = attr(firstSource, 'sizes')
      hints.push(
        `<link rel="preload" as="image" type="${type}" imagesrcset="${srcset}"` +
          (sizes ? ` imagesizes="${sizes}"` : '') +
          ` fetchpriority="high">`
      )
      return hints
    }
  }

  // No <picture> (a Cloudinary-backed hero, or an image with no generated variants) — fall back to
  // the plain <img>, preserving its srcset/sizes when present.
  const imgs = appHtml.match(/<img\b[^>]*\/?>/gi) ?? []
  const lcpImg = imgs.find(i => /fetchPriority=["']high["']/i.test(i))

  if (!lcpImg) {
    // Last resort: a hero painted as a CSS background-image, opted in with `data-lcp-bg`. The
    // preload scanner cannot see background-images at all — they are discovered only after the
    // stylesheet parses and the element is laid out — so emitting the hint here is the difference
    // between parse-time and layout-time discovery for that route's LCP.
    const bgEl = appHtml.match(/<[a-z]+\b[^>]*\bdata-lcp-bg\b[^>]*>/i)?.[0]
    const bgUrl = bgEl?.match(/background-image\s*:\s*url\(\s*["']?([^"')]+)["']?\s*\)/i)?.[1]
    if (bgUrl) hints.push(`<link rel="preload" as="image" href="${bgUrl}" fetchpriority="high">`)
    return hints
  }

  const srcset = attr(lcpImg, 'srcSet') ?? attr(lcpImg, 'srcset')
  const sizes = attr(lcpImg, 'sizes')
  const src = attr(lcpImg, 'src')

  if (srcset) {
    hints.push(
      `<link rel="preload" as="image" imagesrcset="${srcset}"` +
        (sizes ? ` imagesizes="${sizes}"` : '') +
        ` fetchpriority="high">`
    )
  } else if (src) {
    hints.push(`<link rel="preload" as="image" href="${src}" fetchpriority="high">`)
  }
  return hints
}

const absoluteRoutes = Array.from(new Set([
  '/',
  '/about',
  '/services',
  '/destinations',
  '/wedding-stories',
  '/gallery',
  '/testimonials',
  '/contact'
]))

const BASE_URL = 'https://alankaran.com';

(async () => {
  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const url of absoluteRoutes) {
    const { html: rawHtml } = await render(url)

    const { titles, metas, links, body } = extractHead(rawHtml)
    const preloads = buildImagePreloads(rawHtml)

    if (!preloads.length) {
      // Loud, not silent: a route with no high-priority image has no LCP hint, and that is a
      // regression worth failing the build over rather than discovering in a field report.
      throw new Error(
        `prerender: no fetchpriority="high" image found for route "${url}". ` +
          `Every public route must mark its above-the-fold image with <OptimizedImage priority />.`
      )
    }

    const headExtras = [...preloads].join('\n    ')

    let html = template
      .replace('<!--app-head-->', '')
      .replace('<!--app-html-->', body)

    // Split at </head> so metadata merging only ever touches the head.
    const headEnd = html.indexOf('</head>')
    let head = html.slice(0, headEnd + '</head>'.length)
    const rest = html.slice(headEnd + '</head>'.length)

    head = mergeIntoHead(head, { titles, metas, links })

    // The image preload goes immediately before the entry module script — i.e. straight after the
    // stylesheet, which `orderCriticalPath()` in vite.config.ts has already hoisted to that spot.
    // That places the LCP hint ahead of every module preload in document order.
    head = head.replace(
      /(<script[^>]*type="module"[^>]*><\/script>)/,
      `${headExtras}\n    $1`
    )

    html = head + rest

    const filePath = `dist/static${url === '/' ? '/index' : url}.html`
    const absoluteFilePath = toAbsolute(filePath)

    const dir = path.dirname(absoluteFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(absoluteFilePath, html)
    console.log(`pre-rendered: ${filePath}  (${preloads.length} LCP preload${preloads.length > 1 ? 's' : ''})`)

    const priority = url === '/' ? '1.0' : '0.8';
    sitemapContent += `  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
  }

  sitemapContent += `</urlset>`;
  fs.writeFileSync(toAbsolute('dist/static/sitemap.xml'), sitemapContent);
  console.log('generated: dist/static/sitemap.xml');

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
  fs.writeFileSync(toAbsolute('dist/static/robots.txt'), robotsTxt);
  console.log('generated: dist/static/robots.txt');

  // Clean up the server build directory to ensure exactly one output directory for Vercel
  fs.rmSync(toAbsolute('dist/server'), { recursive: true, force: true });
  console.log('cleaned up: dist/server');
})();
