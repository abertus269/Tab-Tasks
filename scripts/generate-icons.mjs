// One-off generator for the app icon, Android adaptive/monochrome icons, and
// splash glyph — all built from lucide-static's list-todo.svg geometry.
// Re-run with `node scripts/generate-icons.mjs` if the design changes.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_SVG = path.join(ROOT, 'node_modules/lucide-static/icons/list-todo.svg');
const OUT_DIR = path.join(ROOT, 'assets/images');

const CANVAS = 1024;
const LIME = '#D6FF5C';
const NEAR_BLACK = '#0D0D0D';
const BLACK = '#000000';

function extractGlyphPaths(svg) {
  const match = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!match) throw new Error('Could not parse source SVG');
  return match[1].trim();
}

// Wraps the glyph in a <g transform="translate(...) scale(...)"> so stroke
// width scales proportionally with the glyph — a 620px glyph yields a ~50px
// stroke, deliberately bold for an icon viewed at launcher size.
function buildSvg({ background, glyphColor, glyphSize, glyphPaths }) {
  const scale = glyphSize / 24;
  const offset = (CANVAS - glyphSize) / 2;
  const bg = background ? `<rect width="${CANVAS}" height="${CANVAS}" fill="${background}" />` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}">
${bg}
<g transform="translate(${offset}, ${offset}) scale(${scale})" fill="none" stroke="${glyphColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${glyphPaths}
</g>
</svg>`;
}

async function render(filename, svg) {
  const outPath = path.join(OUT_DIR, filename);
  await sharp(Buffer.from(svg)).resize(CANVAS, CANVAS).png().toFile(outPath);
  console.log('wrote', path.relative(ROOT, outPath));
}

async function main() {
  const glyphPaths = extractGlyphPaths(readFileSync(SOURCE_SVG, 'utf8'));

  // App icon: black glyph on a solid lime tile — fully opaque, fills the
  // square (no rounded corners or transparent pixels; iOS masks it itself,
  // though this build targets Android).
  await render('icon.png', buildSvg({ background: LIME, glyphColor: NEAR_BLACK, glyphSize: 620, glyphPaths }));

  // Android adaptive icon foreground: glyph only, transparent, sized to
  // ~55-60% of the canvas to clear Android's adaptive safe zone.
  await render(
    'android-icon-foreground.png',
    buildSvg({ background: null, glyphColor: NEAR_BLACK, glyphSize: 580, glyphPaths }),
  );

  // Android 13+ themed icon: solid-color glyph, transparent bg — the system
  // extracts the shape and applies its own tint, so the exact color doesn't
  // matter beyond being opaque.
  await render(
    'android-icon-monochrome.png',
    buildSvg({ background: null, glyphColor: BLACK, glyphSize: 580, glyphPaths }),
  );

  // Splash: lime glyph on transparent, shown over the dark splash background
  // (app.json) — inverted from the icon so it doesn't flash a full-lime
  // screen before transitioning into the dark app.
  await render('splash-icon.png', buildSvg({ background: null, glyphColor: LIME, glyphSize: 620, glyphPaths }));
}

main();
