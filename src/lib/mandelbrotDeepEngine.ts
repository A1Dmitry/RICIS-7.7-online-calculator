/**
 * RICIS Mandelbrot Deep Engine
 * Optimal path for speed + depth (~1e300):
 *   floatexp reference orbit → series approximation skip →
 *   double perturbation per pixel → Pauldelbrot-style glitch flag
 *
 * Raster cache / UI stay outside. This module = pure compute.
 */

export type FE = { m: number; e: number };

const FE0: FE = { m: 0, e: 0 };

export function feFromNumber(x: number): FE {
  if (x === 0 || !isFinite(x)) return { m: 0, e: 0 };
  const e = Math.floor(Math.log2(Math.abs(x)));
  return { m: x / Math.pow(2, e), e };
}

export function feToNumber(a: FE): number {
  if (a.m === 0) return 0;
  if (a.e > 1023) return a.m > 0 ? Infinity : -Infinity;
  if (a.e < -1075) return 0;
  return a.m * Math.pow(2, a.e);
}

function feNorm(m: number, e: number): FE {
  if (m === 0 || !isFinite(m)) return { m: 0, e: 0 };
  const ne = Math.floor(Math.log2(Math.abs(m)));
  return { m: m / Math.pow(2, ne), e: e + ne };
}

export function feAdd(a: FE, b: FE): FE {
  if (a.m === 0) return b;
  if (b.m === 0) return a;
  if (a.e > b.e) {
    const d = a.e - b.e;
    if (d > 54) return a;
    return feNorm(a.m + b.m / Math.pow(2, d), a.e);
  }
  const d = b.e - a.e;
  if (d > 54) return b;
  return feNorm(b.m + a.m / Math.pow(2, d), b.e);
}

export function feSub(a: FE, b: FE): FE {
  return feAdd(a, { m: -b.m, e: b.e });
}

export function feMul(a: FE, b: FE): FE {
  if (a.m === 0 || b.m === 0) return FE0;
  return feNorm(a.m * b.m, a.e + b.e);
}

export function feSqr(a: FE): FE {
  if (a.m === 0) return FE0;
  return feNorm(a.m * a.m, a.e + a.e);
}

export type CFE = { re: FE; im: FE };

function cfeSqrAddC(z: CFE, c: CFE, theta = 0): CFE {
  const re2 = feSqr(z.re);
  const im2 = feSqr(z.im);
  let re = feAdd(feSub(re2, im2), c.re);
  const cross = feMul(z.re, z.im);
  let im = feAdd(feAdd(cross, cross), c.im);
  if (theta > 0) {
    const zr = feToNumber(z.re);
    const zi = feToNumber(z.im);
    const dRe = theta * 0.08 * Math.sin(zr * 2.0);
    const dIm = theta * 0.08 * Math.cos(zi * 2.0);
    re = feAdd(re, feFromNumber(dRe));
    im = feAdd(im, feFromNumber(dIm));
  }
  return { re, im };
}

export interface RefOrbit {
  re: Float64Array;
  im: Float64Array;
  len: number;
  cRe: FE;
  cIm: FE;
  saRe: Float64Array[];
  saIm: Float64Array[];
  saTerms: number;
  saSkip: number;
  ricisTheta: number;
}

export function computeRefOrbit(
  cRe: FE,
  cIm: FE,
  maxIter: number,
  ricisTheta = 0,
  escapeR2 = 1e100
): RefOrbit {
  const re = new Float64Array(maxIter + 1);
  const im = new Float64Array(maxIter + 1);
  let z: CFE = { re: FE0, im: FE0 };
  const c: CFE = { re: cRe, im: cIm };
  re[0] = 0;
  im[0] = 0;
  let len = maxIter;
  for (let n = 0; n < maxIter; n++) {
    z = cfeSqrAddC(z, c, ricisTheta);
    const zr = feToNumber(z.re);
    const zi = feToNumber(z.im);
    re[n + 1] = zr;
    im[n + 1] = zi;
    const r2 = zr * zr + zi * zi;
    if (!isFinite(r2) || r2 > escapeR2) {
      len = n + 1;
      for (let k = n + 2; k <= maxIter; k++) {
        re[k] = zr;
        im[k] = zi;
      }
      break;
    }
  }
  return { re, im, len, cRe, cIm, saRe: [], saIm: [], saTerms: 0, saSkip: 0, ricisTheta };
}

export function buildSeriesApprox(ref: RefOrbit, terms: number, skip: number): void {
  const S = Math.max(1, Math.min(terms, 16));
  const nSkip = Math.min(skip, ref.len - 1);
  let A_re = new Float64Array(S);
  let A_im = new Float64Array(S);

  for (let n = 0; n < nSkip; n++) {
    const Zr = ref.re[n];
    const Zi = ref.im[n];
    const next_re = new Float64Array(S);
    const next_im = new Float64Array(S);
    for (let k = 0; k < S; k++) {
      let re = 2 * (Zr * A_re[k] - Zi * A_im[k]);
      let im = 2 * (Zr * A_im[k] + Zi * A_re[k]);
      for (let j = 0; j < k; j++) {
        re += A_re[j] * A_re[k - 1 - j] - A_im[j] * A_im[k - 1 - j];
        im += A_re[j] * A_im[k - 1 - j] + A_im[j] * A_re[k - 1 - j];
      }
      if (k === 0) re += 1;
      next_re[k] = re;
      next_im[k] = im;
    }
    A_re = next_re;
    A_im = next_im;
  }

  ref.saRe = [A_re];
  ref.saIm = [A_im];
  ref.saTerms = S;
  ref.saSkip = nSkip;
}

export function evalSeries(
  ref: RefOrbit,
  dcRe: number,
  dcIm: number
): { zr: number; zi: number; ok: boolean } {
  const S = ref.saTerms;
  if (S <= 0 || ref.saSkip <= 0) return { zr: 0, zi: 0, ok: false };
  const A_re = ref.saRe[0];
  const A_im = ref.saIm[0];
  let pr = dcRe,
    pi = dcIm;
  let sr = 0,
    si = 0;
  for (let k = 0; k < S; k++) {
    sr += A_re[k] * pr - A_im[k] * pi;
    si += A_re[k] * pi + A_im[k] * pr;
    const nr = pr * dcRe - pi * dcIm;
    const ni = pr * dcIm + pi * dcRe;
    pr = nr;
    pi = ni;
  }
  return {
    zr: ref.re[ref.saSkip] + sr,
    zi: ref.im[ref.saSkip] + si,
    ok: true,
  };
}

export interface PixelResult {
  iter: number;
  escaped: boolean;
  smooth: number;
  glitch: boolean;
}

export function iteratePixel(
  ref: RefOrbit,
  dcRe: number,
  dcIm: number,
  maxIter: number,
  useSA: boolean,
  ricisDeltaEscape: boolean,
  theta = 0
): PixelResult {
  let dzr = 0,
    dzi = 0;
  let iter = 0;
  let escaped = false;
  let glitch = false;
  let finalDeltaSq = 0;

  if (useSA && ref.saTerms > 0) {
    const sa = evalSeries(ref, dcRe, dcIm);
    if (sa.ok) {
      dzr = sa.zr - ref.re[ref.saSkip];
      dzi = sa.zi - ref.im[ref.saSkip];
      iter = ref.saSkip;
    }
  }

  const nMax = Math.min(maxIter, ref.len - 1);
  while (iter < nMax) {
    const Zr = ref.re[iter];
    const Zi = ref.im[iter];
    const dzr2 = dzr * dzr - dzi * dzi;
    const dzi2 = 2 * dzr * dzi;
    let tr = 2 * (Zr * dzr - Zi * dzi);
    let ti = 2 * (Zr * dzi + Zi * dzr);

    if (theta > 0) {
      const zrCurr = Zr + dzr;
      const ziCurr = Zi + dzi;
      tr += theta * 0.08 * Math.sin(zrCurr * 2.0);
      ti += theta * 0.08 * Math.cos(ziCurr * 2.0);
    }

    dzr = tr + dzr2 + dcRe;
    dzi = ti + dzi2 + dcIm;

    const zr = ref.re[iter + 1] + dzr;
    const zi = ref.im[iter + 1] + dzi;
    const r2 = zr * zr + zi * zi;
    const dr2 = dzr * dzr + dzi * dzi;
    finalDeltaSq = dr2;

    if (iter > 10 && dr2 > 1e-2 && r2 < 1e-6) glitch = true;

    if (ricisDeltaEscape) {
      if (dr2 > 16.0 || r2 > 16.0) {
        escaped = true;
        break;
      }
    } else if (r2 > 4.0) {
      escaped = true;
      break;
    }
    iter++;
  }

  if (iter >= maxIter || (!escaped && iter >= nMax)) {
    return { iter: maxIter, escaped: false, smooth: maxIter, glitch };
  }

  let smooth = iter;
  if (escaped) {
    if (ricisDeltaEscape) {
      const delta = Math.sqrt(finalDeltaSq);
      if (delta > 0 && isFinite(delta)) {
        const si = iter - Math.log2(Math.log2(delta));
        if (!isNaN(si) && isFinite(si)) {
          smooth = Math.max(0, si);
        }
      }
    } else {
      const zr = ref.re[Math.min(iter + 1, ref.len - 1)] + dzr;
      const zi = ref.im[Math.min(iter + 1, ref.len - 1)] + dzi;
      const r2 = zr * zr + zi * zi;
      if (r2 > 1.0) {
        const log_zn = Math.log(r2) / 2.0;
        const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
        if (!isNaN(nu) && isFinite(nu)) smooth = iter + 1.0 - nu;
      }
    }
  }
  return { iter, escaped, smooth, glitch };
}

export interface DeepRenderParams {
  width: number;
  height: number;
  centerRe: number;
  centerIm: number;
  viewWidth: number;
  maxIter: number;
  useSA?: boolean;
  saTerms?: number;
  saSkip?: number;
  ricisDeltaEscape?: boolean;
  ricisTheta?: number;
  centerReFE?: FE;
  centerImFE?: FE;
}

export interface DeepRenderResult {
  buffer: Float64Array;
  glitchMap: Uint8Array;
  refLen: number;
  refMs: number;
  pixelMs: number;
}

export function renderDeepFrame(p: DeepRenderParams): DeepRenderResult {
  const t0 = performance.now();
  const cRe = p.centerReFE ?? feFromNumber(p.centerRe);
  const cIm = p.centerImFE ?? feFromNumber(p.centerIm);
  const theta = p.ricisTheta ?? 0;
  const ref = computeRefOrbit(cRe, cIm, p.maxIter, theta);
  if (p.useSA !== false) {
    const skip = p.saSkip ?? Math.min(200, Math.floor(p.maxIter * 0.25));
    const terms = p.saTerms ?? 8;
    if (skip > 4 && ref.len > skip) buildSeriesApprox(ref, terms, skip);
  }
  const t1 = performance.now();

  const { width, height, viewWidth } = p;
  const aspect = width / height;
  const buffer = new Float64Array(width * height);
  const glitchMap = new Uint8Array(width * height);
  const ricis = p.ricisDeltaEscape !== false;
  const useSA = p.useSA !== false && ref.saTerms > 0;

  let i = 0;
  for (let py = 0; py < height; py++) {
    const stY = (py + 0.5) / height;
    const dcIm = (0.5 - stY) * viewWidth;
    for (let px = 0; px < width; px++) {
      const stX = (px + 0.5) / width;
      const dcRe = (stX - 0.5) * viewWidth * aspect;
      const r = iteratePixel(ref, dcRe, dcIm, p.maxIter, useSA, ricis, theta);
      buffer[i] = r.escaped ? r.smooth : p.maxIter;
      glitchMap[i] = r.glitch ? 1 : 0;
      i++;
    }
  }
  const t2 = performance.now();

  return {
    buffer,
    glitchMap,
    refLen: ref.len,
    refMs: t1 - t0,
    pixelMs: t2 - t1,
  };
}

export function fixGlitches(
  p: DeepRenderParams,
  buffer: Float64Array,
  glitchMap: Uint8Array
): number {
  const { width, height, viewWidth, maxIter } = p;
  const aspect = width / height;
  let fixed = 0;
  const ricis = p.ricisDeltaEscape !== false;
  const theta = p.ricisTheta ?? 0;
  for (let py = 0; py < height; py++) {
    const stY = (py + 0.5) / height;
    const dcIm0 = (0.5 - stY) * viewWidth;
    for (let px = 0; px < width; px++) {
      const idx = py * width + px;
      if (!glitchMap[idx]) continue;
      const stX = (px + 0.5) / width;
      const dcRe0 = (stX - 0.5) * viewWidth * aspect;
      const localRe = feAdd(
        p.centerReFE ?? feFromNumber(p.centerRe),
        feFromNumber(dcRe0)
      );
      const localIm = feAdd(
        p.centerImFE ?? feFromNumber(p.centerIm),
        feFromNumber(dcIm0)
      );
      const ref = computeRefOrbit(localRe, localIm, maxIter, theta);
      const r = iteratePixel(ref, 0, 0, maxIter, false, ricis, theta);
      buffer[idx] = r.escaped ? r.smooth : maxIter;
      glitchMap[idx] = 0;
      fixed++;
    }
  }
  return fixed;
}
