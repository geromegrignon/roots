/**
 * Small hex-color helper used to derive a lighter accent shade from a base
 * avatar color (e.g. the second hoody/polo shirt tone, or a hair highlight).
 *
 * The original `react-nice-avatar` library used `chroma-js` for this
 * (`chroma(color).brighten(n)`, which lightens in Lab space). To avoid
 * pulling in an extra dependency for one call site, this ports the same
 * idea using plain HSL math — visually equivalent, not byte-identical.
 */
export function brighten(hex: string, amount = 1): string {
  const [h, s, l] = hexToHsl(hex);
  const lightened = clamp(l + amount * 0.18, 0, 0.97);
  return hslToHex(h, s, lightened);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): [number, number, number] {
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(normalized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function hexToHsl(hex: string): [number, number, number] {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
      break;
  }
  h /= 6;

  return [h, s, l];
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToHex(h: number, s: number, l: number): string {
  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  const toHex = (v: number) =>
    Math.round(clamp(v, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
