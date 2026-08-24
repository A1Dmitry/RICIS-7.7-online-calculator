export function getColorRGBSimpleServer(t: number, maxI: number, smooth: boolean, scheme: string, theta: number): [number, number, number] {
  if (t >= maxI) return [4, 4, 10];
  let norm = t / maxI;
  if (smooth) norm = Math.sqrt(norm);
  const phase = theta * 12.5663706;
  const cyclic = (norm * 10.0 + phase) % 1.0;
  let r = 0, g = 0, b = 0;
  switch (scheme) {
    case 'fire':
      r = Math.min(255, Math.floor(Math.pow(cyclic, 0.7) * 280));
      g = Math.min(255, Math.floor(Math.pow(cyclic, 1.8) * 255));
      b = Math.min(255, Math.floor(Math.pow(cyclic, 3.5) * 200));
      break;
    case 'rainbow': {
      const h = cyclic * 6.0;
      const x = 1.0 - Math.abs((h % 2.0) - 1.0);
      let cR = 0, cG = 0, cB = 0;
      if (h < 1) { cR = 1; cG = x; }
      else if (h < 2) { cR = x; cG = 1; }
      else if (h < 3) { cG = 1; cB = x; }
      else if (h < 4) { cG = x; cB = 1; }
      else if (h < 5) { cR = x; cB = 1; }
      else { cR = 1; cB = x; }
      r = Math.floor(cR * 255); g = Math.floor(cG * 255); b = Math.floor(cB * 255);
      break;
    }
    case 'psychedelic':
      r = Math.floor((Math.sin(cyclic * 6.283) * 0.5 + 0.5) * 255);
      g = Math.floor((Math.sin(cyclic * 6.283 + 2.094) * 0.5 + 0.5) * 255);
      b = Math.floor((Math.sin(cyclic * 6.283 + 4.188) * 0.5 + 0.5) * 255);
      break;
    case 'monochrome': {
      const v = Math.floor(cyclic * 255);
      r = v; g = v; b = v;
      break;
    }
    case 'classic':
      r = Math.floor(Math.sin(cyclic * 3.14159) * 255);
      g = Math.floor(Math.sin(cyclic * 3.14159 * 2.0) * 200);
      b = Math.floor(Math.cos(cyclic * 3.14159) * 255);
      break;
    case 'cosmic':
    default:
      r = Math.floor((0.5 + 0.5 * Math.sin(cyclic * 6.283 + 0.0)) * 180 + 20);
      g = Math.floor((0.5 + 0.5 * Math.sin(cyclic * 6.283 + 2.0)) * 220 + 35);
      b = Math.floor((0.5 + 0.5 * Math.sin(cyclic * 6.283 + 4.0)) * 255);
      break;
  }
  return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
}

export function rgbaToBmpDataUrl(width: number, height: number, rgba: Uint8Array): string {
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileHeaderSize = 14;
  const ihSize = 40;
  const fileSize = fileHeaderSize + ihSize + pixelArraySize;

  const buf = Buffer.alloc(fileSize);
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(fileHeaderSize + ihSize, 10);

  buf.writeUInt32LE(ihSize, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(-height, 22); // top-down
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);

  let offset = fileHeaderSize + ihSize;
  for (let y = 0; y < height; y++) {
    const rowOffset = offset + y * rowSize;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const b = rgba[i + 2];
      const g = rgba[i + 1];
      const r = rgba[i];
      const pxOffset = rowOffset + x * 3;
      buf[pxOffset] = b;
      buf[pxOffset + 1] = g;
      buf[pxOffset + 2] = r;
    }
  }

  return `data:image/bmp;base64,${buf.toString('base64')}`;
}

export interface MandelbrotRenderParams {
  cx?: number | string;
  cy?: number | string;
  zoom?: number | string;
  width?: number | string;
  height?: number | string;
  maxIterations?: number | string;
  colorScheme?: string;
  smoothColoring?: boolean;
  juliaMode?: boolean;
  juliaX?: number | string;
  juliaY?: number | string;
  ricisTheta?: number | string;
  formulaType?: string;
  ricisCriterion?: boolean;
}

export function renderMandelbrotServer(params: MandelbrotRenderParams) {
  const {
    cx = -0.7,
    cy = 0.0,
    zoom = 4.0,
    width = 800,
    height = 500,
    maxIterations = 300,
    colorScheme = 'cosmic',
    smoothColoring = true,
    juliaMode = false,
    juliaX = -0.7,
    juliaY = 0.27015,
    ricisTheta = 0.0,
    formulaType = 'standard',
    ricisCriterion = true
  } = params || {};

  const tStart = Date.now();
  const cxVal = typeof cx === 'string' ? parseFloat(cx) : Number(cx);
  const cyVal = typeof cy === 'string' ? parseFloat(cy) : Number(cy);
  const zoomVal = Number(zoom);
  const w = Math.min(1000, Math.max(100, Number(width) || 800));
  const h = Math.min(700, Math.max(100, Number(height) || 500));
  const maxI = Math.min(1200, Math.max(20, Number(maxIterations) || 300));
  const isJulia = Boolean(juliaMode);
  const jx = Number(juliaX);
  const jy = Number(juliaY);
  const theta = Number(ricisTheta);
  const formula = String(formulaType);
  const scheme = String(colorScheme);
  const smooth = Boolean(smoothColoring);
  const rCriterion = Boolean(ricisCriterion);

  const aspect = w / h;
  const rgba = new Uint8Array(w * h * 4);

  const dx = (zoomVal * aspect) / w;
  const dy = zoomVal / h;
  const startX = cxVal - 0.5 * zoomVal * aspect;
  const startY = cyVal + 0.5 * zoomVal;

  for (let py = 0; py < h; py++) {
    const im = startY - (py + 0.5) * dy;
    for (let px = 0; px < w; px++) {
      const re = startX + (px + 0.5) * dx;

      let zr = isJulia ? re : 0.0;
      let zi = isJulia ? im : 0.0;
      const cr = isJulia ? jx : re;
      const ci = isJulia ? jy : im;

      let iter = 0;
      let escaped = false;
      let finalDeltaSq = 0.0;

      while (iter < maxI) {
        const r2 = zr * zr;
        const i2 = zi * zi;

        if (!isFinite(r2 + i2) || isNaN(r2 + i2)) {
          escaped = true;
          break;
        }

        if (!rCriterion && (r2 + i2 > 4.0)) {
          escaped = true;
          break;
        }

        let nextR = 0.0;
        let nextI = 0.0;

        if (formula === 'cubic') {
          nextR = zr * zr * zr - 3.0 * zr * i2 + cr;
          nextI = 3.0 * r2 * zi - zi * i2 + ci;
        } else if (formula === 'quartic') {
          nextR = r2 * r2 - 6.0 * r2 * i2 + i2 * i2 + cr;
          nextI = 4.0 * zr * zr * zr * zi - 4.0 * zr * zi * i2 + ci;
        } else if (formula === 'burning_ship') {
          const abs_zr = Math.abs(zr);
          const abs_zi = Math.abs(zi);
          nextR = abs_zr * abs_zr - abs_zi * abs_zi + cr;
          nextI = 2.0 * abs_zr * abs_zi + ci;
        } else if (formula === 'tricorn') {
          nextR = r2 - i2 + cr;
          nextI = -2.0 * zr * zi + ci;
        } else if (formula === 'snowflake') {
          const thetaVal = Math.atan2(zi, zr);
          const cos6 = Math.cos(6.0 * thetaVal);
          const zbar2_r = r2 - i2;
          const zbar2_i = -2.0 * zr * zi;
          nextR = zbar2_r * cos6 + cr;
          nextI = zbar2_i * cos6 + ci;
        } else {
          nextR = r2 - i2 + cr;
          nextI = 2.0 * zr * zi + ci;
        }

        if (theta > 0.0) {
          nextR += theta * 0.08 * Math.sin(zr * 2.0);
          nextI += theta * 0.08 * Math.cos(zi * 2.0);
        }

        if (rCriterion) {
          const dzr = nextR - zr;
          const dzi = nextI - zi;
          finalDeltaSq = dzr * dzr + dzi * dzi;
          if (finalDeltaSq > 16.0 || r2 + i2 > 16.0 || !isFinite(finalDeltaSq) || isNaN(finalDeltaSq)) {
            escaped = true;
            break;
          }
        }

        zr = nextR;
        zi = nextI;
        iter++;
      }

      const offset = (py * w + px) * 4;
      if (!escaped) {
        rgba[offset] = 4;
        rgba[offset + 1] = 4;
        rgba[offset + 2] = 10;
        rgba[offset + 3] = 255;
      } else {
        let finalT = iter;
        if (smooth) {
          if (rCriterion) {
            const delta = Math.sqrt(finalDeltaSq);
            if (delta > 0 && isFinite(delta)) {
              const si = iter - Math.log2(Math.log2(delta));
              if (!isNaN(si) && isFinite(si)) {
                finalT = Math.max(0, si);
              }
            }
          } else {
            const log_zn = Math.log(zr * zr + zi * zi) / 2.0;
            let log_factor = Math.LN2;
            if (formula === 'cubic') log_factor = Math.log(3.0);
            else if (formula === 'quartic') log_factor = Math.log(4.0);
            const log_val = Math.log(log_zn / log_factor) / log_factor;
            if (!isNaN(log_val) && isFinite(log_val)) {
              finalT = iter + 1.0 - log_val;
            }
          }
        }
        const [r, g, b] = getColorRGBSimpleServer(finalT, maxI, smooth, scheme, theta);
        rgba[offset] = r;
        rgba[offset + 1] = g;
        rgba[offset + 2] = b;
        rgba[offset + 3] = 255;
      }
    }
  }

  const dataUrl = rgbaToBmpDataUrl(w, h, rgba);
  const renderTimeMs = Date.now() - tStart;

  return {
    success: true,
    imageDataUrl: dataUrl,
    renderTimeMs,
    engine: 'Express Cloud Server (Node.js RICIS)',
    width: w,
    height: h,
    cx: cxVal,
    cy: cyVal,
    zoom: zoomVal
  };
}
