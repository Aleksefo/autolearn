// Generates the app icon assets from a single vector source.
// Concept "Speaking bubble": a white speech bubble carrying an amber waveform
// on brand purple — spoken words. Same color family as UltimateAchiever's
// icon. Run: `node scripts/generate-icons.mjs`
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = resolve(ROOT, 'assets/images');

const PURPLE = '#6A00E0';
const AMBER = '#FFB300';
const WHITE = '#FFFFFF';

const BUBBLE =
  'M132 96 H380 Q436 96 436 152 V312 Q436 368 380 368 H232 L142 428 L166 368 H132 Q76 368 76 312 V152 Q76 96 132 96 Z';

// Five rounded bars, symmetric like a spoken syllable's envelope.
const BARS = [
  { x: 142, h: 70 },
  { x: 192, h: 112 },
  { x: 242, h: 150 },
  { x: 292, h: 112 },
  { x: 342, h: 70 },
];
const BAR_WIDTH = 28;

const barRects = fill =>
  BARS.map(
    ({ x, h }) =>
      `<rect x="${x}" y="${232 - h / 2}" width="${BAR_WIDTH}" height="${h}" rx="${BAR_WIDTH / 2}" fill="${fill}" />`,
  ).join('');

// Full-color mark: white bubble, amber waveform.
function mark(scale = 1) {
  return `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <path d="${BUBBLE}" fill="${WHITE}" />${barRects(AMBER)}
  </g>`;
}

// Single-color silhouette with the bars knocked out, for Android themed icons.
function monochrome(scale = 1) {
  return `<defs><mask id="cut">
      <path d="${BUBBLE}" fill="white" />${barRects('black')}
    </mask></defs>
    <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
      <rect width="512" height="512" fill="white" mask="url(#cut)" />
    </g>`;
}

function svg(inner, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${
    bg ? `<rect width="512" height="512" fill="${bg}" />` : ''
  }${inner}</svg>`;
}

// Adaptive foregrounds shrink into Android's ~66% safe zone so round masks
// never clip the bubble tail.
const ADAPTIVE_SCALE = 0.72;

const ASSETS = [
  // Legacy / iOS / Play Store icon — full-bleed purple.
  { file: 'icon.png', size: 1024, svg: svg(mark(), PURPLE) },
  // Android adaptive foreground — transparent; background is a flat color.
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    svg: svg(mark(ADAPTIVE_SCALE)),
  },
  // Android themed (monochrome) foreground.
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    svg: svg(monochrome(ADAPTIVE_SCALE)),
  },
  // Splash mark — transparent, sits on the purple splash background.
  { file: 'splash-icon.png', size: 1024, svg: svg(mark()) },
  // Web favicon.
  { file: 'favicon.png', size: 196, svg: svg(mark(), PURPLE) },
];

mkdirSync(IMG, { recursive: true });
for (const asset of ASSETS) {
  const png = new Resvg(asset.svg, {
    fitTo: { mode: 'width', value: asset.size },
  })
    .render()
    .asPng();
  writeFileSync(resolve(IMG, asset.file), png);
  console.log(`wrote assets/images/${asset.file}`);
}
