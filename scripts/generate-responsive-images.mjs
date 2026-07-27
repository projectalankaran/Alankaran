// scripts/generate-responsive-images.mjs
//
// Builds the responsive variant set for every local image in `public/images`.
//
// WHY THIS EXISTS
// ---------------
// Cloudinary already handles responsive delivery for CMS-managed images (`f_auto,q_auto` +
// width transforms — see `src/utils/cloudinaryImage.ts`). But the *bundled fallback* images in
// `public/images` are what the site paints on a cold load, before the Firestore CMS payload has
// resolved. The hero fallback is therefore the LCP element on a first visit, and it was being
// shipped as a single full-resolution WebP (hero-mandap.webp: 1408x768, 337 KB) to every device
// including a 390px-wide phone.
//
// This script gives the local fallbacks the same treatment Cloudinary gives CMS images: AVIF +
// WebP, at a ladder of widths, plus a manifest so the runtime helper only ever emits `srcset`
// candidates that actually exist on disk (no 404 probing, no guessing).
//
// OUTPUT
//   public/images/responsive/<name>-<width>.avif
//   public/images/responsive/<name>-<width>.webp
//   src/generated/imageManifest.json   (consumed by src/utils/localImage.ts)
//
// Idempotent: existing variants are skipped unless --force is passed.

import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const imagesDir = join(root, 'public', 'images');
const outDir = join(imagesDir, 'responsive');
const manifestPath = join(root, 'src', 'generated', 'imageManifest.json');

const FORCE = process.argv.includes('--force');

// The width ladder. A variant is only emitted when it is *smaller* than the source — upscaling
// would add bytes without adding detail.
const WIDTHS = [400, 640, 768, 960, 1280, 1600, 1920];

// AVIF at q50 is visually equivalent to WebP q82 for photographic content at roughly half the
// bytes. `effort: 6` is the practical ceiling before encode time stops paying for itself.
const AVIF_OPTS = { quality: 50, effort: 6, chromaSubsampling: '4:2:0' };
const WEBP_OPTS = { quality: 78, effort: 5 };

const sourceFiles = readdirSync(imagesDir)
  .filter((f) => ['.webp', '.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase()))
  .filter((f) => statSync(join(imagesDir, f)).isFile());

mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(manifestPath), { recursive: true });

const manifest = {};
let generated = 0;
let skipped = 0;

console.log(`Generating responsive variants for ${sourceFiles.length} images…\n`);

for (const file of sourceFiles) {
  const inputPath = join(imagesDir, file);
  const name = basename(file, extname(file));
  const meta = await sharp(inputPath).metadata();

  // Never upscale: cap the ladder at the source width, and always include the source width itself
  // so the largest candidate is a true 1:1 render.
  const widths = [...new Set([...WIDTHS.filter((w) => w < meta.width), meta.width])].sort(
    (a, b) => a - b
  );

  // Compact on purpose. This manifest is imported by `src/utils/localImage.ts`, which runs on the
  // public critical path — so it stores only the width ladder and lets the helper rebuild variant
  // URLs by convention (`/images/responsive/<name>-<w>.<fmt>`). Storing full path strings per
  // variant would put ~20 KB of redundant text in the entry chunk for zero added information.
  const entry = {
    n: name,        // basename, used to rebuild variant URLs
    w: meta.width,  // intrinsic width  (drives `sizes` + CLS-safe width/height)
    h: meta.height, // intrinsic height
    s: [],          // the width ladder actually present on disk
  };
  const variantBytes = { avif: [], webp: [] };

  for (const w of widths) {
    for (const format of ['avif', 'webp']) {
      const outName = `${name}-${w}.${format}`;
      const outPath = join(outDir, outName);

      if (existsSync(outPath) && !FORCE) {
        variantBytes[format].push(statSync(outPath).size);
        skipped++;
        continue;
      }

      const pipeline = sharp(inputPath).resize({ width: w, withoutEnlargement: true });
      const info =
        format === 'avif'
          ? await pipeline.avif(AVIF_OPTS).toFile(outPath)
          : await pipeline.webp(WEBP_OPTS).toFile(outPath);

      variantBytes[format].push(info.size);
      generated++;
    }
    entry.s.push(w);
  }

  manifest[`/images/${file}`] = entry;

  const originalKb = statSync(inputPath).size / 1024;
  console.log(
    `  ${file.padEnd(34)} ${meta.width}x${meta.height}  ${originalKb.toFixed(0)}KB` +
      `  →  ${entry.s.length} widths x2 formats` +
      `  (mobile avif ${(variantBytes.avif[0] / 1024).toFixed(0)}KB)`
  );
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(
  `\nDone. ${generated} variants generated, ${skipped} reused.\n` +
    `Manifest: src/generated/imageManifest.json (${Object.keys(manifest).length} sources)`
);
