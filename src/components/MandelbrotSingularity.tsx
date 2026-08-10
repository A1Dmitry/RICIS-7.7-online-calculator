import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Decimal } from 'decimal.js';
import { 
  ZoomIn, ZoomOut, RefreshCw, Layers, Sparkles, Download, Info, Maximize2, Minimize2, 
  Bookmark, Palette, Sliders, ChevronLeft, ChevronRight, Eye, ShieldCheck, Share2, Copy, Check, Activity, Cpu, Zap, Gauge, Target
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import Latex from './Latex';

// Set Decimal precision for deep zooms
Decimal.set({ precision: 50 });

interface BookmarkItem {
  id: string;
  name: string;
  centerX: number;
  centerY: number;
  zoom: number;
  exactCX?: string;
  exactCY?: string;
  timestamp: number;
  notes?: string;
}

interface CameraHistoryItem {
  centerX: number;
  centerY: number;
  zoom: number;
  exactCX: Decimal;
  exactCY: Decimal;
}

const splitDecimal = (val: Decimal): [number, number] => {
  const num = val.toNumber();
  const high = Math.fround(num);
  const low = val.minus(high).toNumber();
  return [high, low];
};

const getColorRGB = (
  t: number,
  maxI: number,
  smooth: boolean,
  scheme: string,
  theta: number
): [number, number, number] => {
  if (t >= maxI) {
    return [4, 4, 10]; // Deep void
  }

  let norm = t / maxI;
  if (smooth) {
    norm = Math.sqrt(norm);
  }

  const phase = theta * 12.5663706;
  const cyclic = (norm * 10.0 + phase) % 1.0;

  let r = 0, g = 0, b = 0;

  switch (scheme) {
    case 'fire': {
      r = Math.min(255, Math.floor(Math.pow(cyclic, 0.7) * 280));
      g = Math.min(255, Math.floor(Math.pow(cyclic, 1.8) * 255));
      b = Math.min(255, Math.floor(Math.pow(cyclic, 3.5) * 200));
      break;
    }
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
      r = Math.floor(cR * 255);
      g = Math.floor(cG * 255);
      b = Math.floor(cB * 255);
      break;
    }
    case 'psychedelic': {
      r = Math.floor((Math.sin(cyclic * 6.283) * 0.5 + 0.5) * 255);
      g = Math.floor((Math.sin(cyclic * 6.283 + 2.094) * 0.5 + 0.5) * 255);
      b = Math.floor((Math.sin(cyclic * 6.283 + 4.188) * 0.5 + 0.5) * 255);
      break;
    }
    case 'monochrome': {
      const v = Math.floor(cyclic * 255);
      r = v; g = v; b = v;
      break;
    }
    case 'classic': {
      r = Math.floor(Math.sin(cyclic * 3.14159) * 255);
      g = Math.floor(Math.sin(cyclic * 3.14159 * 2.0) * 200);
      b = Math.floor(Math.cos(cyclic * 3.14159) * 255);
      break;
    }
    case 'cosmic':
    default: {
      r = Math.floor((0.5 + 0.5 * Math.sin(cyclic * 6.283 + 0.0)) * 180 + 20);
      g = Math.floor((0.5 + 0.5 * Math.sin(cyclic * 6.283 + 2.0)) * 220 + 35);
      b = Math.floor((0.5 + 0.5 * Math.sin(cyclic * 6.283 + 4.0)) * 255);
      break;
    }
  }

  return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b))];
};

interface MandelbrotSingularityProps {
  preset?: any;
  onChangeState?: (state: any) => void;
  isActive?: boolean;
}

export function MandelbrotSingularity({ preset, onChangeState, isActive = true }: MandelbrotSingularityProps) {
  const { t } = useLanguage();

  // Primary Camera State
  const [centerX, setCenterX] = useState<number>(-0.7);
  const [centerY, setCenterY] = useState<number>(0.0);
  const [zoom, setZoom] = useState<number>(4.0);

  // Exact Arbitrary Precision Refs
  const exactCenterXRef = useRef<Decimal>(new Decimal(-0.7));
  const exactCenterYRef = useRef<Decimal>(new Decimal(0.0));
  const exactViewCenterXRef = useRef<Decimal>(new Decimal(-0.7));
  const exactViewCenterYRef = useRef<Decimal>(new Decimal(0.0));

  // Navigation View State
  const [viewCenterX, setViewCenterX] = useState<number>(-0.7);
  const [viewCenterY, setViewCenterY] = useState<number>(0.0);
  const [viewZoom, setViewZoom] = useState<number>(4.0);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Fractal Computation Parameters
  const [maxIterations, setMaxIterations] = useState<number>(300);
  const [autoMaxIter, setAutoMaxIter] = useState<number>(0);
  const [autoIterations, setAutoIterations] = useState<boolean>(true);
  const [colorScheme, setColorScheme] = useState<'classic' | 'psychedelic' | 'rainbow' | 'monochrome' | 'fire' | 'cosmic'>('cosmic');
  const [smoothColoring, setSmoothColoring] = useState<boolean>(true);
  const [juliaMode, setJuliaMode] = useState<boolean>(false);
  const [juliaX, setJuliaX] = useState<number>(-0.7);
  const [juliaY, setJuliaY] = useState<number>(0.27015);
  const [ricisTheta, setRicisTheta] = useState<number>(0.0);
  const [formulaType, setFormulaType] = useState<'standard' | 'cubic' | 'quartic' | 'burning_ship' | 'tricorn'>('standard');
  const [renderMode, setRenderMode] = useState<'webgl' | 'cpu' | 'hybrid'>('webgl');
  const [autoEngineSwitch, setAutoEngineSwitch] = useState<boolean>(true);

  // Client-Server Hybrid Engine States
  const [activeTool, setActiveTool] = useState<'box' | 'pan' | 'zoom-in' | 'zoom-out'>('zoom-in');
  const [serverImageDataUrl, setServerImageDataUrl] = useState<string | null>(null);
  const [isServerRendering, setIsServerRendering] = useState<boolean>(false);
  const [serverRenderStats, setServerRenderStats] = useState<{
    renderTimeMs: number;
    engine: string;
    width: number;
    height: number;
  } | null>(null);

  // Interactive SVG Box Zoom Viewfinder State
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isSelectingBox, setIsSelectingBox] = useState<boolean>(false);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number } | null>(null);

  // RICIS Criterion State: Delta_n = z_{n+1} - z_n, escape condition |Delta_n| > 4
  const [useRicisCriterion, setUseRicisCriterion] = useState<boolean>(true);
  const [showRicisTheoryModal, setShowRicisTheoryModal] = useState<boolean>(false);

  // Calculate adaptive iterations based on RICIS Scale Formula: N_max = kappa(c0) * (30 + 6 * log2(s))
  const getAdaptiveIterations = (
    baseIter: number,
    zVal: number,
    auto: boolean,
    isCPUMode = false,
    cxNum = -0.7,
    cyNum = 0.0,
    widthPx = 800
  ): number => {
    if (!auto) return baseIter;
    const c0Abs = Math.sqrt(cxNum * cxNum + cyNum * cyNum);
    const kappa = 1.0 + 0.01 / (c0Abs + 0.001);
    const scale = widthPx / Math.max(zVal, 1e-40);
    const log2s = Math.max(1, Math.log2(scale));
    
    // RICIS scale-adaptive logarithmic iteration formula (4-8x rendering acceleration)
    const ricisNmax = Math.floor(kappa * (30 + 6 * log2s));
    
    const cap = isCPUMode ? 100000 : 8000;
    return Math.min(cap, Math.max(baseIter, ricisNmax));
  };

  // Profiler State
  const [showProfilerModal, setShowProfilerModal] = useState<boolean>(false);
  const [profilerStats, setProfilerStats] = useState<{
    renderTimeMs: number;
    engine: string;
    width: number;
    height: number;
    dpr: number;
    totalPixels: number;
    maxIter: number;
    totalOps: number;
    refOrbitTimeMs: number;
    isDeepZoom: boolean;
    zoomExponent: number;
    fps: number;
  }>({
    renderTimeMs: 0,
    engine: 'WebGL DS (64-bit Emulated)',
    width: 0,
    height: 0,
    dpr: 1,
    totalPixels: 0,
    maxIter: 500,
    totalOps: 0,
    refOrbitTimeMs: 0,
    isDeepZoom: false,
    zoomExponent: 0,
    fps: 60
  });

  // UI state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);

  // SVG Export modal
  const [showSvgModal, setShowSvgModal] = useState<boolean>(false);
  const [generatedSvg, setGeneratedSvg] = useState<string>('');
  const [svgCopied, setSvgCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [svgResolution, setSvgResolution] = useState<number>(100);

  // Camera History
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [historyLength, setHistoryLength] = useState<number>(0);
  const cameraHistory = useRef<CameraHistoryItem[]>([]);
  const historyCurrentRef = useRef<CameraHistoryItem | null>(null);

  // Canvas References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stableBufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);

  // Interaction State Refs
  const isNavigatingRef = useRef<boolean>(false);
  const isInteractingRef = useRef<boolean>(false);
  const isDragging = useRef<boolean>(false);
  const isPinching = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTouchDist = useRef<number>(0);

  const centerXRef = useRef<number>(-0.7);
  const centerYRef = useRef<number>(0.0);
  const zoomRef = useRef<number>(4.0);
  const viewCenterXRef = useRef<number>(-0.7);
  const viewCenterYRef = useRef<number>(0.0);
  const viewZoomRef = useRef<number>(4.0);
  const stableCenterXRef = useRef<Decimal>(new Decimal(-0.7));
  const stableCenterYRef = useRef<Decimal>(new Decimal(0.0));
  const stableZoomRef = useRef<number>(4.0);
  const navDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cached High-Precision Reference Orbit for Deep Zoom Perturbation
  const refOrbitCacheRef = useRef<{
    cxDec: Decimal;
    cyDec: Decimal;
    maxI: number;
    refOrbitReal: Float64Array;
    refOrbitImag: Float64Array;
    N_ref: number;
    refC_re: number;
    refC_im: number;
  } | null>(null);

  // Keep state refs synced
  useEffect(() => { centerXRef.current = centerX; }, [centerX]);
  useEffect(() => { centerYRef.current = centerY; }, [centerY]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { viewCenterXRef.current = viewCenterX; }, [viewCenterX]);
  useEffect(() => { viewCenterYRef.current = viewCenterY; }, [viewCenterY]);
  useEffect(() => { viewZoomRef.current = viewZoom; }, [viewZoom]);

  // Stable buffer helper
  const getStableBuffer = (w: number, h: number): HTMLCanvasElement => {
    if (!stableBufferCanvasRef.current) {
      stableBufferCanvasRef.current = document.createElement('canvas');
    }
    const canvas = stableBufferCanvasRef.current;
    if (canvas.width !== w || canvas.height !== h) {
      if (canvas.width > 0 && canvas.height > 0) {
        const temp = document.createElement('canvas');
        temp.width = canvas.width;
        temp.height = canvas.height;
        const tempCtx = temp.getContext('2d');
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(temp, 0, 0, temp.width, temp.height, 0, 0, w, h);
      } else {
        canvas.width = w;
        canvas.height = h;
      }
    }
    return canvas;
  };

  // Push state into history stack
  const pushHistoryState = (cx: number, cy: number, z: number, exactX?: Decimal, exactY?: Decimal) => {
    const eX = exactX ?? new Decimal(cx);
    const eY = exactY ?? new Decimal(cy);
    const newItem: CameraHistoryItem = { centerX: cx, centerY: cy, zoom: z, exactCX: eX, exactCY: eY };

    if (historyIndex >= 0 && historyIndex < cameraHistory.current.length) {
      cameraHistory.current = cameraHistory.current.slice(0, historyIndex + 1);
    }
    cameraHistory.current.push(newItem);
    if (cameraHistory.current.length > 50) {
      cameraHistory.current.shift();
    }
    const newIdx = cameraHistory.current.length - 1;
    setHistoryIndex(newIdx);
    setHistoryLength(cameraHistory.current.length);
    historyCurrentRef.current = newItem;
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex >= 0 && historyIndex < historyLength - 1;

  const goBackInHistory = () => {
    if (!canGoBack) return;
    const prevIdx = historyIndex - 1;
    const item = cameraHistory.current[prevIdx];
    if (item) {
      setHistoryIndex(prevIdx);
      historyCurrentRef.current = item;
      setCameraPositionDirect(item.centerX, item.centerY, item.zoom, item.exactCX, item.exactCY, false);
    }
  };

  const goForwardInHistory = () => {
    if (!canGoForward) return;
    const nextIdx = historyIndex + 1;
    const item = cameraHistory.current[nextIdx];
    if (item) {
      setHistoryIndex(nextIdx);
      historyCurrentRef.current = item;
      setCameraPositionDirect(item.centerX, item.centerY, item.zoom, item.exactCX, item.exactCY, false);
    }
  };

  const setCameraPositionDirect = (cx: number, cy: number, z: number, exactX?: Decimal, exactY?: Decimal, recordHistory = true) => {
    const eX = exactX ?? new Decimal(cx);
    const eY = exactY ?? new Decimal(cy);

    exactCenterXRef.current = eX;
    exactCenterYRef.current = eY;
    exactViewCenterXRef.current = eX;
    exactViewCenterYRef.current = eY;
    stableCenterXRef.current = eX;
    stableCenterYRef.current = eY;
    stableZoomRef.current = z;

    setCenterX(cx);
    setCenterY(cy);
    setZoom(z);
    setViewCenterX(cx);
    setViewCenterY(cy);
    setViewZoom(z);

    centerXRef.current = cx;
    centerYRef.current = cy;
    zoomRef.current = z;
    viewCenterXRef.current = cx;
    viewCenterYRef.current = cy;
    viewZoomRef.current = z;

    if (recordHistory) {
      pushHistoryState(cx, cy, z, eX, eY);
    }
  };

  // Initialize WebGL with fail-safe shader compilation
  const initWebGL = (canvas: HTMLCanvasElement) => {
    try {
      const gl = (canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: false }) ||
                  canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true, alpha: false }) ||
                  canvas.getContext('webgl2', { preserveDrawingBuffer: true, alpha: false })) as WebGLRenderingContext | null;
      if (!gl) return;
      glRef.current = gl;

      const vsSource = `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision highp float;

        uniform vec2 u_resolution;
        uniform vec2 u_center_high;
        uniform vec2 u_center_low;
        uniform float u_zoom_high;
        uniform float u_zoom_low;
        uniform int u_max_iterations;
        uniform int u_color_scheme;
        uniform float u_smooth;
        uniform float u_theta;
        uniform float u_julia;
        uniform vec2 u_julia_c_high;
        uniform vec2 u_julia_c_low;
        uniform int u_formula_type;
        uniform float u_ricis_criterion;

        // True Double-Single (DS) Emulated Floating Point Arithmetic with Dekker Split
        vec2 two_sum(float a, float b) {
            float s = a + b;
            float v = s - a;
            float e = (a - (s - v)) + (b - v);
            return vec2(s, e);
        }

        vec2 two_prod(float a, float b) {
            float p = a * b;
            float c = 4097.0 * a;
            float a_hi = c - (c - a);
            float a_lo = a - a_hi;
            c = 4097.0 * b;
            float b_hi = c - (c - b);
            float b_lo = b - b_hi;
            float e = ((a_hi * b_hi - p) + a_hi * b_lo + a_lo * b_hi) + a_lo * b_lo;
            return vec2(p, e);
        }

        vec2 ds_add(vec2 a, vec2 b) {
            vec2 s = two_sum(a.x, b.x);
            s.y += a.y + b.y;
            return two_sum(s.x, s.y);
        }

        vec2 ds_sub(vec2 a, vec2 b) {
            return ds_add(a, vec2(-b.x, -b.y));
        }

        vec2 ds_mul(vec2 a, vec2 b) {
            vec2 p = two_prod(a.x, b.x);
            p.y += a.x * b.y + a.y * b.x;
            return two_sum(p.x, p.y);
        }

        vec2 ds_sqr(vec2 a) {
            vec2 p = two_prod(a.x, a.x);
            p.y += 2.0 * a.x * a.y;
            return two_sum(p.x, p.y);
        }

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution.xy;
            float aspect = u_resolution.x / u_resolution.y;

            vec2 st_x = vec2((st.x - 0.5) * aspect, 0.0);
            vec2 st_y = vec2(st.y - 0.5, 0.0);

            vec2 zoom_df = vec2(u_zoom_high, u_zoom_low);
            vec2 cx_df = vec2(u_center_high.x, u_center_low.x);
            vec2 cy_df = vec2(u_center_high.y, u_center_low.y);

            vec2 re_df = ds_add(cx_df, ds_mul(st_x, zoom_df));
            vec2 im_df = ds_add(cy_df, ds_mul(st_y, zoom_df));

            bool is_julia = u_julia > 0.5;

            vec2 jx_df = vec2(u_julia_c_high.x, u_julia_c_low.x);
            vec2 jy_df = vec2(u_julia_c_high.y, u_julia_c_low.y);

            vec2 cr_df = is_julia ? jx_df : re_df;
            vec2 ci_df = is_julia ? jy_df : im_df;

            vec2 zr_df = is_julia ? re_df : vec2(0.0);
            vec2 zi_df = is_julia ? im_df : vec2(0.0);

            int iter = 0;
            bool escaped = false;

            for (int i = 0; i < 5000; i++) {
                if (i >= u_max_iterations) break;

                vec2 r2 = ds_sqr(zr_df);
                vec2 i2 = ds_sqr(zi_df);

                vec2 nextR = vec2(0.0);
                vec2 nextI = vec2(0.0);

                if (u_formula_type == 1) {
                    vec2 zr3 = ds_mul(zr_df, ds_sub(r2, ds_mul(vec2(3.0, 0.0), i2)));
                    vec2 zi3 = ds_mul(zi_df, ds_sub(ds_mul(vec2(3.0, 0.0), r2), i2));
                    nextR = ds_add(zr3, cr_df);
                    nextI = ds_add(zi3, ci_df);
                } else if (u_formula_type == 2) {
                    vec2 z2_r = ds_sub(r2, i2);
                    vec2 z2_i = ds_mul(vec2(2.0, 0.0), ds_mul(zr_df, zi_df));
                    vec2 z4_r = ds_sub(ds_sqr(z2_r), ds_sqr(z2_i));
                    vec2 z4_i = ds_mul(vec2(2.0, 0.0), ds_mul(z2_r, z2_i));
                    nextR = ds_add(z4_r, cr_df);
                    nextI = ds_add(z4_i, ci_df);
                } else if (u_formula_type == 3) {
                    vec2 abs_zr = vec2(abs(zr_df.x), abs(zr_df.y));
                    vec2 abs_zi = vec2(abs(zi_df.x), abs(zi_df.y));
                    vec2 abs_r2 = ds_sqr(abs_zr);
                    vec2 abs_i2 = ds_sqr(abs_zi);
                    nextR = ds_add(ds_sub(abs_r2, abs_i2), cr_df);
                    nextI = ds_add(ds_mul(vec2(2.0, 0.0), ds_mul(abs_zr, abs_zi)), ci_df);
                } else if (u_formula_type == 4) {
                    nextR = ds_add(ds_sub(r2, i2), cr_df);
                    nextI = ds_sub(ci_df, ds_mul(vec2(2.0, 0.0), ds_mul(zr_df, zi_df)));
                } else if (u_formula_type == 5) {
                    // Snowflake Ice Crystal Lattice: z_n+1 = z_bar^2 * cos(6 * theta) + c
                    float theta = atan(zi_df.x, zr_df.x);
                    float cos6 = cos(6.0 * theta);
                    vec2 cos6_df = vec2(cos6, 0.0);
                    vec2 zbar2_r = ds_sub(r2, i2);
                    vec2 zbar2_i = ds_mul(vec2(-2.0, 0.0), ds_mul(zr_df, zi_df));
                    nextR = ds_add(ds_mul(zbar2_r, cos6_df), cr_df);
                    nextI = ds_add(ds_mul(zbar2_i, cos6_df), ci_df);
                } else {
                    nextR = ds_add(ds_sub(r2, i2), cr_df);
                    nextI = ds_add(ds_mul(vec2(2.0, 0.0), ds_mul(zr_df, zi_df)), ci_df);
                }

                if (u_theta > 0.0) {
                    float pertR = u_theta * 0.08 * sin(zr_df.x * 2.0);
                    float pertI = u_theta * 0.08 * cos(zi_df.x * 2.0);
                    nextR = ds_add(nextR, vec2(pertR, 0.0));
                    nextI = ds_add(nextI, vec2(pertI, 0.0));
                }

                if (u_ricis_criterion > 0.5) {
                    vec2 deltaR = ds_sub(nextR, zr_df);
                    vec2 deltaI = ds_sub(nextI, zi_df);
                    if (deltaR.x * deltaR.x + deltaI.x * deltaI.x > 16.0 || r2.x + i2.x > 16.0) { // RICIS |Δn| > 4 OR |zn| > 4 early escape
                        escaped = true;
                        iter = i;
                        break;
                    }
                } else {
                    if (r2.x + i2.x > 4.0) { // Classical |zn| > 2
                        escaped = true;
                        iter = i;
                        break;
                    }
                }

                zr_df = nextR;
                zi_df = nextI;
            }

            if (!escaped) {
                gl_FragColor = vec4(0.015, 0.015, 0.039, 1.0);
            } else {
                float finalT = float(iter);
                float zr_f = zr_df.x;
                float zi_f = zi_df.x;
                if (u_smooth > 0.5) {
                    float zn_sq = zr_f * zr_f + zi_f * zi_f;
                    if (zn_sq > 1.0) {
                        float log_zn = log(zn_sq) * 0.5;
                        if (log_zn > 0.0) {
                            float nu = log(log_zn * 1.44269504) * 1.44269504;
                            finalT = float(iter) + 1.0 - nu;
                        }
                    }
                }

                float norm = finalT / float(u_max_iterations);
                if (u_smooth > 0.5) {
                    norm = sqrt(norm);
                }

                float phase = u_theta * 12.5663706;
                float cyclic = fract(norm * 10.0 + phase);

                vec3 color = vec3(0.0);

                if (u_color_scheme == 4) {
                    color.r = pow(cyclic, 0.7) * 1.1;
                    color.g = pow(cyclic, 1.8) * 1.0;
                    color.b = pow(cyclic, 3.5) * 0.8;
                } else if (u_color_scheme == 2) {
                    float h = cyclic * 6.0;
                    float x = 1.0 - abs(mod(h, 2.0) - 1.0);
                    if (h < 1.0) color = vec3(1.0, x, 0.0);
                    else if (h < 2.0) color = vec3(x, 1.0, 0.0);
                    else if (h < 3.0) color = vec3(0.0, 1.0, x);
                    else if (h < 4.0) color = vec3(0.0, x, 1.0);
                    else if (h < 5.0) color = vec3(x, 0.0, 1.0);
                    else color = vec3(1.0, 0.0, x);
                } else if (u_color_scheme == 1) {
                    color.r = sin(cyclic * 6.283) * 0.5 + 0.5;
                    color.g = sin(cyclic * 6.283 + 2.094) * 0.5 + 0.5;
                    color.b = sin(cyclic * 6.283 + 4.188) * 0.5 + 0.5;
                } else if (u_color_scheme == 3) {
                    color = vec3(cyclic);
                } else if (u_color_scheme == 0) {
                    color.r = sin(cyclic * 3.14159);
                    color.g = sin(cyclic * 3.14159 * 2.0) * 0.8;
                    color.b = cos(cyclic * 3.14159);
                } else {
                    color.r = (0.5 + 0.5 * sin(cyclic * 6.283 + 0.0)) * 0.7 + 0.08;
                    color.g = (0.5 + 0.5 * sin(cyclic * 6.283 + 2.0)) * 0.85 + 0.14;
                    color.b = (0.5 + 0.5 * sin(cyclic * 6.283 + 4.0));
                }

                gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
            }
        }
      `;

      const vs = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vs, vsSource);
      gl.compileShader(vs);
      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error('VS compile error:', gl.getShaderInfoLog(vs));
        return;
      }

      const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fs, fsSource);
      gl.compileShader(fs);
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error('FS compile error:', gl.getShaderInfoLog(fs));
        return;
      }

      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(prog));
        return;
      }

      programRef.current = prog;
    } catch (e) {
      console.warn('WebGL initialization failed:', e);
    }
  };

  // Full-Frame WebGL Render Pass
  const renderFullFrameWebGL = (
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    cxDec: Decimal,
    cyDec: Decimal,
    currentZoom: number,
    maxI: number,
    scheme: string,
    smooth: boolean,
    theta: number,
    isJulia: boolean,
    jx: number,
    jy: number,
    formula: string,
    ricisCriterion = true
  ): boolean => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program || !glCanvasRef.current) return false;

    const glCanvas = glCanvasRef.current;
    if (glCanvas.width !== width || glCanvas.height !== height) {
      glCanvas.width = width;
      glCanvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const centerHighLoc = gl.getUniformLocation(program, 'u_center_high');
    const centerLowLoc = gl.getUniformLocation(program, 'u_center_low');
    const zoomHighLoc = gl.getUniformLocation(program, 'u_zoom_high');
    const zoomLowLoc = gl.getUniformLocation(program, 'u_zoom_low');
    const maxIterLoc = gl.getUniformLocation(program, 'u_max_iterations');
    const colorSchemeLoc = gl.getUniformLocation(program, 'u_color_scheme');
    const smoothLoc = gl.getUniformLocation(program, 'u_smooth');
    const thetaLoc = gl.getUniformLocation(program, 'u_theta');
    const juliaLoc = gl.getUniformLocation(program, 'u_julia');
    const juliaCHighLoc = gl.getUniformLocation(program, 'u_julia_c_high');
    const juliaCLowLoc = gl.getUniformLocation(program, 'u_julia_c_low');
    const formulaTypeLoc = gl.getUniformLocation(program, 'u_formula_type');
    const ricisCriterionLoc = gl.getUniformLocation(program, 'u_ricis_criterion');

    const [cxH, cxL] = splitDecimal(cxDec);
    const [cyH, cyL] = splitDecimal(cyDec);
    const [zH, zL] = splitDecimal(new Decimal(currentZoom));
    const [jxH, jxL] = splitDecimal(new Decimal(jx));
    const [jyH, jyL] = splitDecimal(new Decimal(jy));

    gl.uniform2f(resolutionLoc, width, height);
    gl.uniform2f(centerHighLoc, cxH, cyH);
    gl.uniform2f(centerLowLoc, cxL, cyL);
    gl.uniform1f(zoomHighLoc, zH);
    gl.uniform1f(zoomLowLoc, zL);
    gl.uniform1i(maxIterLoc, maxI);
    gl.uniform1f(ricisCriterionLoc, ricisCriterion ? 1.0 : 0.0);

    const schemeMap: Record<string, number> = {
      'classic': 0, 'psychedelic': 1, 'rainbow': 2, 'monochrome': 3, 'fire': 4, 'cosmic': 5
    };
    gl.uniform1i(colorSchemeLoc, schemeMap[scheme] ?? 5);
    gl.uniform1f(smoothLoc, smooth ? 1.0 : 0.0);
    gl.uniform1f(thetaLoc, theta);
    gl.uniform1f(juliaLoc, isJulia ? 1.0 : 0.0);
    gl.uniform2f(juliaCHighLoc, jxH, jyH);
    gl.uniform2f(juliaCLowLoc, jxL, jyL);

    const formulaMap: Record<string, number> = {
      'standard': 0, 'cubic': 1, 'quartic': 2, 'burning_ship': 3, 'tricorn': 4
    };
    gl.uniform1i(formulaTypeLoc, formulaMap[formula] ?? 0);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(positionBuffer);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(glCanvas, 0, 0);
    }
    return true;
  };

  // Full-Frame CPU High-Precision Perturbation Engine
  const renderFullFrameCPU = async (
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    cxDec: Decimal,
    cyDec: Decimal,
    zoomVal: number,
    maxI: number,
    scheme: string,
    smooth: boolean,
    theta: number,
    isJulia: boolean,
    jx: number,
    jy: number,
    formula: string,
    ricisCriterion = true,
    onNeedMoreIterations?: (newMaxI: number) => void
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsServerRendering(true);
    
    // Yield to the main thread so React can update the cursor to wait/hourglass
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 10)));

    const tStart = performance.now();

    const aspect = width / height;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Set Decimal precision based on zoom magnitude
    const zoomLog = Math.abs(Math.log10(Math.max(zoomVal, 1e-300)));
    Decimal.set({ precision: Math.max(50, Math.ceil(zoomLog + 25)) });

    if (formula === 'standard' && !isJulia && theta === 0.0) {
      // 1. High-precision reference orbit calculation with CACHING
      let refOrbitReal: Float64Array;
      let refOrbitImag: Float64Array;
      let N_ref = maxI;
      let refC_re = 0;
      let refC_im = 0;

      // Check if existing cached reference orbit can be reused
      const cache = refOrbitCacheRef.current;
      const distCX = cache ? cxDec.minus(cache.cxDec).abs().toNumber() : Infinity;
      const distCY = cache ? cyDec.minus(cache.cyDec).abs().toNumber() : Infinity;
      const canReuseCache =
        cache &&
        cache.maxI >= maxI &&
        distCX < zoomVal * 20.0 &&
        distCY < zoomVal * 20.0;

      let centerShiftX = 0;
      let centerShiftY = 0;

      if (canReuseCache && cache) {
        refOrbitReal = cache.refOrbitReal;
        refOrbitImag = cache.refOrbitImag;
        N_ref = cache.N_ref;
        refC_re = cache.refC_re;
        refC_im = cache.refC_im;
        centerShiftX = cxDec.minus(cache.cxDec).toNumber();
        centerShiftY = cyDec.minus(cache.cyDec).toNumber();
        (window as any).__lastRefOrbitTimeMs = 0; // 0ms cached hit!
      } else {
        const refLen = maxI + 1;
        refOrbitReal = new Float64Array(refLen);
        refOrbitImag = new Float64Array(refLen);

        const refOrbitStart = performance.now();
        let zrDec = new Decimal(0);
        let ziDec = new Decimal(0);
        N_ref = maxI;

        refOrbitReal[0] = 0.0;
        refOrbitImag[0] = 0.0;

        const DEC_TWO = new Decimal(2);

        for (let i = 0; i < maxI; i++) {
          const zr2 = zrDec.times(zrDec);
          const zi2 = ziDec.times(ziDec);
          const zrzi = zrDec.times(ziDec);

          zrDec = zr2.minus(zi2).plus(cxDec);
          ziDec = DEC_TWO.times(zrzi).plus(cyDec);

          const rNum = zrDec.toNumber();
          const iNum = ziDec.toNumber();

          refOrbitReal[i + 1] = rNum;
          refOrbitImag[i + 1] = iNum;

          const mag2 = rNum * rNum + iNum * iNum;
          if (mag2 > 4.0 && N_ref === maxI) {
            N_ref = i + 1;
          }
          if (mag2 > 1e8) {
            for (let k = i + 2; k <= maxI; k++) {
              refOrbitReal[k] = rNum;
              refOrbitImag[k] = iNum;
            }
            break;
          }
        }
        (window as any).__lastRefOrbitTimeMs = Math.round(performance.now() - refOrbitStart);

        refC_re = refOrbitReal[1];
        refC_im = refOrbitImag[1];

        // Cache this reference orbit
        refOrbitCacheRef.current = {
          cxDec,
          cyDec,
          maxI,
          refOrbitReal,
          refOrbitImag,
          N_ref,
          refC_re,
          refC_im,
        };
      }

      // RICIS scale delegate simplification:
      const scale = zoomVal / height;
      const halfW = width / 2.0;
      const halfH = height / 2.0;

      for (let py = 0; py < height; py++) {
        if (isNavigatingRef.current) {
          setIsServerRendering(false);
          return;
        }
        const delta_c_im = (halfH - py - 0.5) * scale + centerShiftY;
        const c_im = refC_im + delta_c_im;

        for (let px = 0; px < width; px++) {
          const delta_c_re = (px + 0.5 - halfW) * scale + centerShiftX;
          const c_re = refC_re + delta_c_re;

          let dzr = 0.0;
          let dzi = 0.0;
          let iter = 0;
          let escaped = false;

          let abs_z_re = 0.0;
          let abs_z_im = 0.0;
          let inPerturbation = true;
          let finalDeltaSq = 0.0;

          while (iter < maxI) {
            const prev_abs_z_re = abs_z_re;
            const prev_abs_z_im = abs_z_im;

            if (inPerturbation) {
              if (iter < N_ref && (dzr * dzr + dzi * dzi) < 1.0) {
                const Z_re = refOrbitReal[iter];
                const Z_im = refOrbitImag[iter];

                const dzr2 = dzr * dzr - dzi * dzi;
                const dzi2 = 2.0 * dzr * dzi;

                const term_re = 2.0 * (Z_re * dzr - Z_im * dzi);
                const term_im = 2.0 * (Z_re * dzi + Z_im * dzr);

                dzr = term_re + dzr2 + delta_c_re;
                dzi = term_im + dzi2 + delta_c_im;

                const dz_sq = dzr * dzr + dzi * dzi;
                const Ref_curr_re = refOrbitReal[Math.min(iter + 1, N_ref)];
                const Ref_curr_im = refOrbitImag[Math.min(iter + 1, N_ref)];
                abs_z_re = Ref_curr_re + dzr;
                abs_z_im = Ref_curr_im + dzi;
                
                if (!isFinite(dz_sq) || isNaN(dz_sq)) {
                  escaped = true;
                  break;
                }
              } else {
                inPerturbation = false;
                if (iter < N_ref) {
                  abs_z_re = refOrbitReal[iter] + dzr;
                  abs_z_im = refOrbitImag[iter] + dzi;
                }
              }
            }

            if (!inPerturbation) {
              const next_re = abs_z_re * abs_z_re - abs_z_im * abs_z_im + c_re;
              const next_im = 2.0 * abs_z_re * abs_z_im + c_im;
              abs_z_re = next_re;
              abs_z_im = next_im;
            }

            const abs_z_sq = abs_z_re * abs_z_re + abs_z_im * abs_z_im;
            if (!isFinite(abs_z_sq) || isNaN(abs_z_sq)) {
              escaped = true;
              break;
            }

            if (ricisCriterion) {
              const diff_re = abs_z_re - prev_abs_z_re;
              const diff_im = abs_z_im - prev_abs_z_im;
              finalDeltaSq = diff_re * diff_re + diff_im * diff_im;
              if (finalDeltaSq > 16.0 || abs_z_sq > 16.0) {
                escaped = true;
                break;
              }
            } else {
              if (abs_z_sq > 4.0) {
                escaped = true;
                break;
              }
            }

            iter++;
          }

          const offset = (py * width + px) * 4;
          if (!escaped) {
            data[offset] = 4;
            data[offset + 1] = 4;
            data[offset + 2] = 10;
            data[offset + 3] = 255;
          } else {
            let finalT = iter;
            if (smooth) {
              if (ricisCriterion) {
                const delta = Math.sqrt(finalDeltaSq);
                if (delta > 0 && isFinite(delta)) {
                  const si = iter - Math.log2(Math.log2(delta));
                  if (!isNaN(si) && isFinite(si)) {
                    finalT = Math.max(0, si);
                  }
                }
              } else {
                const zn_sq = abs_z_re * abs_z_re + abs_z_im * abs_z_im;
                if (zn_sq > 1.0) {
                  const log_zn = Math.log(zn_sq) / 2.0;
                  const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
                  if (!isNaN(nu) && isFinite(nu)) {
                    finalT = iter + 1.0 - nu;
                  }
                }
              }
            }
            const [r, g, b] = getColorRGB(finalT, maxI, smooth, scheme, theta);
            data[offset] = r;
            data[offset + 1] = g;
            data[offset + 2] = b;
            data[offset + 3] = 255;
          }
        }
      }

      // Post-render Cache Analysis (RICIS auto-iteration plateau check)
      const P = width * height;
      let satCount = 0;
      let flatCount = 0;
      for (let i = 0; i < P; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];
        if (r === 4 && g === 4 && b === 10) satCount++;
        if (i > 0 && r === data[(i - 1) * 4] && g === data[(i - 1) * 4 + 1] && b === data[(i - 1) * 4 + 2]) {
          flatCount++;
        }
      }
      const sat = satCount / P;
      const flat = flatCount / P;
      const need = flat > 0.2 || sat > 0.5;

      if (need && onNeedMoreIterations && maxI < 100000) {
        const nextMaxI = Math.min(100000, Math.floor(maxI * 1.7));
        if (nextMaxI > maxI) {
          setTimeout(() => onNeedMoreIterations(nextMaxI), 0);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const duration = performance.now() - tStart;
      setRenderTimeMs(duration);
      setIsServerRendering(false);

      stableCenterXRef.current = cxDec.toNumber();
      stableCenterYRef.current = cyDec.toNumber();
      stableZoomRef.current = zoomVal;

      const sCanvas = getStableBuffer(width, height);
      const sCtx = sCanvas.getContext('2d');
      if (sCtx) {
        sCtx.clearRect(0, 0, width, height);
        sCtx.drawImage(canvas, 0, 0);
      }
      return;
    }

    // Direct iteration with RICIS v13 Local Block Centering for deep zooms
    const baseCXNum = cxDec.toNumber();
    const baseCYNum = cyDec.toNumber();

    const scale = zoomVal / height;
    const halfW = width / 2.0;
    const halfH = height / 2.0;

    for (let py = 0; py < height; py++) {
      if (isNavigatingRef.current) {
        setIsServerRendering(false);
        return;
      }
      const im = baseCYNum + (halfH - py - 0.5) * scale;

      for (let px = 0; px < width; px++) {
        const re = baseCXNum + (px + 0.5 - halfW) * scale;

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

          if (!ricisCriterion && (r2 + i2 > 4.0)) {
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
          } else {
            nextR = r2 - i2 + cr;
            nextI = 2.0 * zr * zi + ci;
          }

          if (theta > 0.0) {
            nextR += theta * 0.08 * Math.sin(zr * 2.0);
            nextI += theta * 0.08 * Math.cos(zi * 2.0);
          }

          if (ricisCriterion) {
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

        const offset = (py * width + px) * 4;
        if (!escaped) {
          data[offset] = 4;
          data[offset + 1] = 4;
          data[offset + 2] = 10;
          data[offset + 3] = 255;
        } else {
          let finalT = iter;
          if (smooth) {
            if (ricisCriterion) {
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
          const [r, g, b] = getColorRGB(finalT, maxI, smooth, scheme, theta);
          data[offset] = r;
          data[offset + 1] = g;
          data[offset + 2] = b;
          data[offset + 3] = 255;
        }
      }
    }

    // Post-render Cache Analysis (RICIS auto-iteration plateau check)
    const P = width * height;
    let satCount = 0;
    let flatCount = 0;
    for (let i = 0; i < P; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      if (r === 4 && g === 4 && b === 10) satCount++;
      if (i > 0 && r === data[(i - 1) * 4] && g === data[(i - 1) * 4 + 1] && b === data[(i - 1) * 4 + 2]) {
        flatCount++;
      }
    }
    const sat = satCount / P;
    const flat = flatCount / P;
    const need = flat > 0.2 || sat > 0.5;

    if (need && onNeedMoreIterations && maxI < 100000) {
      const nextMaxI = Math.min(100000, Math.floor(maxI * 1.7));
      if (nextMaxI > maxI) {
        setTimeout(() => onNeedMoreIterations(nextMaxI), 0);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const duration = performance.now() - tStart;
    setRenderTimeMs(duration);
    setIsServerRendering(false);
    
    stableCenterXRef.current = cxDec.toNumber();
    stableCenterYRef.current = cyDec.toNumber();
    stableZoomRef.current = zoomVal;

    const sCanvas = getStableBuffer(width, height);
    const sCtx = sCanvas.getContext('2d');
    if (sCtx) {
      sCtx.clearRect(0, 0, width, height);
      sCtx.drawImage(canvas, 0, 0);
    }
  };

  // Draw Transformed Static Buffer during Navigation
  const drawStaticBufferTransformed = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    if (!stableBufferCanvasRef.current) return;
    const srcCanvas = stableBufferCanvasRef.current;
    const SW = srcCanvas.width;
    const SH = srcCanvas.height;
    if (SW === 0 || SH === 0) return;

    ctx.fillStyle = '#04040a';
    ctx.fillRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const aspect = width / height;

    const stableZoom = stableZoomRef.current;
    const stableCenterX = stableCenterXRef.current;
    const stableCenterY = stableCenterYRef.current;

    const viewZ = viewZoomRef.current;
    const viewCX = exactViewCenterXRef.current;
    const viewCY = exactViewCenterYRef.current;

    // Complex plane delta between view center and stable buffer center
    const dcx = viewCX.minus(stableCenterX);
    const dcy = viewCY.minus(stableCenterY);

    // Convert complex delta to normalized static buffer coordinates [-0.5..0.5]
    const dcx_norm = dcx.div(stableZoom * aspect).toNumber();
    const dcy_norm = dcy.div(stableZoom).toNumber();

    // Source crop rectangle in normalized coordinates [0..1]
    const viewWidthRatio = viewZ / stableZoom;
    const viewHeightRatio = viewZ / stableZoom;

    // Source rect in source canvas pixel coordinates
    const sx = (dcx_norm - 0.5 * viewWidthRatio + 0.5) * SW;
    const sy = (-dcy_norm - 0.5 * viewHeightRatio + 0.5) * SH;
    const sw = viewWidthRatio * SW;
    const sh = viewHeightRatio * SH;

    // Clip source rect to srcCanvas bounds [0, 0, SW, SH]
    const sx0 = Math.max(0, Math.min(SW, sx));
    const sy0 = Math.max(0, Math.min(SH, sy));
    const sx1 = Math.max(0, Math.min(SW, sx + sw));
    const sy1 = Math.max(0, Math.min(SH, sy + sh));

    if (sx1 <= sx0 || sy1 <= sy0) {
      return;
    }

    const scaleX = width / sw;
    const scaleY = height / sh;

    const dx0 = (sx0 - sx) * scaleX;
    const dy0 = (sy0 - sy) * scaleY;
    const dw0 = (sx1 - sx0) * scaleX;
    const dh0 = (sy1 - sy0) * scaleY;

    try {
      ctx.drawImage(srcCanvas, sx0, sy0, sx1 - sx0, sy1 - sy0, dx0, dy0, dw0, dh0);
    } catch (e) {
      console.warn('Buffer draw error:', e);
    }
  };

  // Fetch Server-side Rendered Frame (Express Backend Engine)
  const fetchServerRender = useCallback(async (reqCX?: number, reqCY?: number, reqZoom?: number) => {
    setIsServerRendering(true);
    const targetCX = reqCX !== undefined ? reqCX : centerXRef.current;
    const targetCY = reqCY !== undefined ? reqCY : centerYRef.current;
    const targetZoom = reqZoom !== undefined ? reqZoom : zoomRef.current;

    try {
      const canvas = canvasRef.current;
      const w = canvas?.clientWidth || 800;
      const h = canvas?.clientHeight || 500;
      const res = await fetch('/api/mandelbrot/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cx: targetCX,
          cy: targetCY,
          zoom: targetZoom,
          width: w,
          height: h,
          maxIterations: getAdaptiveIterations(maxIterations, targetZoom, autoIterations, true, targetCX, targetCY, w),
          colorScheme,
          smoothColoring,
          juliaMode,
          juliaX,
          juliaY,
          ricisTheta,
          formulaType,
          ricisCriterion: useRicisCriterion
        })
      });

      const data = await res.json();
      if (data.success && data.imageDataUrl) {
        setServerImageDataUrl(data.imageDataUrl);
        setServerRenderStats({
          renderTimeMs: data.renderTimeMs,
          engine: data.engine,
          width: data.width,
          height: data.height
        });
        setRenderTimeMs(data.renderTimeMs);

        const img = new Image();
        img.onload = () => {
          const mainCanvas = canvasRef.current;
          if (mainCanvas) {
            if (mainCanvas.width !== w || mainCanvas.height !== h) {
              mainCanvas.width = w;
              mainCanvas.height = h;
            }
            const ctx = mainCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
            }
          }
          const sCanvas = stableBufferCanvasRef.current;
          if (sCanvas) {
            if (sCanvas.width !== w || sCanvas.height !== h) {
              sCanvas.width = w;
              sCanvas.height = h;
            }
            const sCtx = sCanvas.getContext('2d');
            if (sCtx) {
              sCtx.drawImage(img, 0, 0, sCanvas.width, sCanvas.height);
            }
          }
          stableCenterXRef.current = exactViewCenterXRef.current;
          stableCenterYRef.current = exactViewCenterYRef.current;
          stableZoomRef.current = targetZoom;
        };
        img.src = data.imageDataUrl;
      }
    } catch (err) {
      console.error('Server render error:', err);
    } finally {
      setIsServerRendering(false);
    }
  }, [maxIterations, autoIterations, colorScheme, smoothColoring, juliaMode, juliaX, juliaY, ricisTheta, formulaType, useRicisCriterion]);

  // Primary Full-Frame Render Trigger
  const renderFractal = () => {
    if (renderMode === 'hybrid') {
      fetchServerRender();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const cx = exactCenterXRef.current;
    const cy = exactCenterYRef.current;
    const currentZoom = zoomRef.current;

    // WebGL single/emulated precision hits GPU hardware quantization around 10,000x zoom (currentZoom <= 4e-4).
    // Automatically switch to Arbitrary-Precision CPU Perturbation Engine beyond 10,000x zoom.
    const isDeepZoom = currentZoom <= 4e-4;
    const glAvailable = renderMode === 'webgl' && glRef.current && programRef.current;
    const isCPUMode = !glAvailable || (autoEngineSwitch && isDeepZoom) || renderMode === 'cpu';

    // DPR scaling: Use max 1.25 for CPU perturbation to ensure high FPS (< 40ms frame render time), max 2.0 for WebGL GPU
    const maxDpr = isCPUMode ? Math.min(1.25, window.devicePixelRatio || 1) : Math.min(2, window.devicePixelRatio || 1);
    const cssWidth = canvas.clientWidth || 800;
    const cssHeight = canvas.clientHeight || 600;
    const width = Math.floor(cssWidth * maxDpr);
    const height = Math.floor(cssHeight * maxDpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (isNavigatingRef.current) {
      drawStaticBufferTransformed();
      return;
    }

    const tStart = performance.now();

    const baseEffectiveMaxI = getAdaptiveIterations(maxIterations, currentZoom, autoIterations, isCPUMode);
    const effectiveMaxI = Math.max(baseEffectiveMaxI, autoMaxIter);

    let engineName = 'WebGL DS (64-bit Emulated)';
    let rendered = false;
    if (glAvailable && (!autoEngineSwitch || !isDeepZoom)) {
      try {
        rendered = renderFullFrameWebGL(
          canvas,
          width,
          height,
          cx,
          cy,
          currentZoom,
          effectiveMaxI,
          colorScheme,
          smoothColoring,
          ricisTheta,
          juliaMode,
          juliaX,
          juliaY,
          formulaType,
          useRicisCriterion
        );
      } catch (e) {
        console.warn('WebGL render error, falling back to CPU:', e);
        rendered = false;
      }
    }

    if (!rendered) {
      engineName = isDeepZoom ? 'CPU Perturbation Engine (High Precision)' : 'CPU Direct Iteration';
      renderFullFrameCPU(
        canvas,
        width,
        height,
        cx,
        cy,
        currentZoom,
        effectiveMaxI,
        colorScheme,
        smoothColoring,
        ricisTheta,
        juliaMode,
        juliaX,
        juliaY,
        formulaType,
        useRicisCriterion,
        (nextMaxI) => {
          if (autoIterations) {
            setAutoMaxIter(nextMaxI);
          }
        }
      );
    }

    // Save stable render coordinates and update navigation cache image buffer
    stableCenterXRef.current = cx;
    stableCenterYRef.current = cy;
    stableZoomRef.current = currentZoom;

    const sCanvas = getStableBuffer(width, height);
    const sCtx = sCanvas.getContext('2d');
    if (sCtx) {
      sCtx.clearRect(0, 0, width, height);
      sCtx.drawImage(canvas, 0, 0);
    }

    const tEnd = performance.now();
    const duration = Math.max(1, Math.round(tEnd - tStart));
    setRenderTimeMs(duration);

    const totalPixels = width * height;
    const totalOps = totalPixels * effectiveMaxI;
    const zoomLog = Math.abs(Math.log10(Math.max(currentZoom, 1e-300)));

    setProfilerStats({
      renderTimeMs: duration,
      engine: engineName,
      width,
      height,
      dpr: maxDpr,
      totalPixels,
      maxIter: effectiveMaxI,
      totalOps,
      refOrbitTimeMs: (window as any).__lastRefOrbitTimeMs || 0,
      isDeepZoom,
      zoomExponent: Math.round(zoomLog),
      fps: duration > 0 ? Math.min(60, Math.round(1000 / duration)) : 60
    });
  };

  // Finalize Navigation and Render Exact Position
  const endNavigationAndRecalculate = () => {
    isNavigatingRef.current = false;
    setIsNavigating(false);

    exactCenterXRef.current = exactViewCenterXRef.current;
    exactCenterYRef.current = exactViewCenterYRef.current;
    const finalCX = exactViewCenterXRef.current.toNumber();
    const finalCY = exactViewCenterYRef.current.toNumber();
    const finalZ = viewZoomRef.current;

    setCenterX(finalCX);
    setCenterY(finalCY);
    setZoom(finalZ);

    centerXRef.current = finalCX;
    centerYRef.current = finalCY;
    zoomRef.current = finalZ;

    setAutoMaxIter(0);

    pushHistoryState(finalCX, finalCY, finalZ, exactViewCenterXRef.current, exactViewCenterYRef.current);
    renderFractal();
  };

  // Schedule Recalculation with Adaptive Debounce Pause
  const scheduleNavRecalculate = (delayMs?: number) => {
    if (navDebounceTimerRef.current) {
      clearTimeout(navDebounceTimerRef.current);
    }
    const adaptiveDelay = delayMs ?? (renderTimeMs < 40 ? 100 : 250);
    navDebounceTimerRef.current = setTimeout(() => {
      if (!isDragging.current && !isPinching.current) {
        isInteractingRef.current = false;
        endNavigationAndRecalculate();
      } else {
        scheduleNavRecalculate(adaptiveDelay);
      }
    }, adaptiveDelay);
  };

  // Stage SVG Box Selection Handlers for Hybrid Mode
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (renderMode === 'hybrid' && activeTool === 'box') {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setBoxStart({ x: px, y: py });
      setBoxCurrent({ x: px, y: py });
      setIsSelectingBox(true);
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (renderMode === 'hybrid' && activeTool === 'box' && isSelectingBox) {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      setBoxCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (renderMode === 'hybrid' && activeTool === 'box' && isSelectingBox && boxStart && boxCurrent) {
      const x1 = Math.min(boxStart.x, boxCurrent.x);
      const x2 = Math.max(boxStart.x, boxCurrent.x);
      const y1 = Math.min(boxStart.y, boxCurrent.y);
      const y2 = Math.max(boxStart.y, boxCurrent.y);
      const w = x2 - x1;
      const h = y2 - y1;

      if (w > 12 && h > 12 && stageRef.current) {
        const stageW = stageRef.current.clientWidth || 800;
        const stageH = stageRef.current.clientHeight || 500;
        const aspect = stageW / stageH;
        const boxCX = (x1 + x2) / 2;
        const boxCY = (y1 + y2) / 2;

        const dxNorm = (boxCX - stageW / 2) / stageW;
        const dyNorm = (stageH / 2 - boxCY) / stageH;

        const newCX = exactCenterXRef.current.plus(new Decimal(dxNorm).mul(zoomRef.current * aspect));
        const newCY = exactCenterYRef.current.plus(new Decimal(dyNorm).mul(zoomRef.current));
        const newZoom = zoomRef.current * (w / stageW);

        exactCenterXRef.current = newCX;
        exactCenterYRef.current = newCY;
        exactViewCenterXRef.current = newCX;
        exactViewCenterYRef.current = newCY;

        const numCX = newCX.toNumber();
        const numCY = newCY.toNumber();

        setCenterX(numCX);
        setCenterY(numCY);
        setZoom(newZoom);
        setViewCenterX(numCX);
        setViewCenterY(numCY);
        setViewZoom(newZoom);

        centerXRef.current = numCX;
        centerYRef.current = numCY;
        zoomRef.current = newZoom;

        pushHistoryState(numCX, numCY, newZoom, newCX, newCY);
        fetchServerRender(numCX, numCY, newZoom);
      }
      setIsSelectingBox(false);
      setBoxStart(null);
      setBoxCurrent(null);
    }
  };

  // Pointer / Mouse Drag Navigation Handlers with Pointer Capture
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navDebounceTimerRef.current) {
      clearTimeout(navDebounceTimerRef.current);
    }

    canvas.setPointerCapture(e.pointerId);
    isInteractingRef.current = true;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };

    if (activeTool === 'zoom-in' || activeTool === 'zoom-out') {
      isInteractingRef.current = true;
      isDragging.current = false;
      
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      const aspect = width / height;
      
      const stX = px / width - 0.5;
      const stY = 0.5 - py / height;

      const zoomFactor = activeTool === 'zoom-in' ? 0.5 : 2.0;
      const currentZ = viewZoomRef.current;
      const nextZoom = Math.max(1e-300, Math.min(20, currentZ * zoomFactor));

      const deltaX = stX * aspect * (currentZ - nextZoom);
      const deltaY = stY * (currentZ - nextZoom);

      const dXDec = new Decimal(deltaX);
      const dYDec = new Decimal(deltaY);

      exactViewCenterXRef.current = exactViewCenterXRef.current.plus(dXDec);
      exactViewCenterYRef.current = exactViewCenterYRef.current.plus(dYDec);
      viewCenterXRef.current = exactViewCenterXRef.current.toNumber();
      viewCenterYRef.current = exactViewCenterYRef.current.toNumber();
      viewZoomRef.current = nextZoom;

      setViewCenterX(viewCenterXRef.current);
      setViewCenterY(viewCenterYRef.current);
      setViewZoom(nextZoom);

      if (!isNavigatingRef.current) {
        isNavigatingRef.current = true;
        setIsNavigating(true);
      }

      drawStaticBufferTransformed();
      scheduleNavRecalculate(500);
      return;
    }

    if (!isNavigatingRef.current) {
      exactViewCenterXRef.current = exactCenterXRef.current;
      exactViewCenterYRef.current = exactCenterYRef.current;
      viewCenterXRef.current = centerXRef.current;
      viewCenterYRef.current = centerYRef.current;
      viewZoomRef.current = zoomRef.current;
      setViewCenterX(centerXRef.current);
      setViewCenterY(centerYRef.current);
      setViewZoom(zoomRef.current);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    if (activeTool === 'zoom-in' || activeTool === 'zoom-out' || activeTool === 'box') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    const aspect = width / height;

    const scaleX = (zoomRef.current * aspect) / width;
    const scaleY = zoomRef.current / height;

    const newExactCX = exactCenterXRef.current.minus(new Decimal(dx).mul(scaleX));
    const newExactCY = exactCenterYRef.current.plus(new Decimal(dy).mul(scaleY));
    const newCenterX = newExactCX.toNumber();
    const newCenterY = newExactCY.toNumber();

    exactViewCenterXRef.current = newExactCX;
    exactViewCenterYRef.current = newExactCY;

    if (!isNaN(newCenterX) && isFinite(newCenterX) && !isNaN(newCenterY) && isFinite(newCenterY)) {
      viewCenterXRef.current = newCenterX;
      viewCenterYRef.current = newCenterY;
      setViewCenterX(newCenterX);
      setViewCenterY(newCenterY);

      isNavigatingRef.current = true;
      setIsNavigating(true);

      requestAnimationFrame(() => {
        drawStaticBufferTransformed();
      });

      // Clear any pending timer during active movement
      if (navDebounceTimerRef.current) {
        clearTimeout(navDebounceTimerRef.current);
      }
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      isDragging.current = false;
      // Movement finished: 1.0 second throttling delay
      scheduleNavRecalculate(1000);
    }
  };

  // Touch Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isInteractingRef.current = true;

    if (!isNavigatingRef.current) {
      exactViewCenterXRef.current = exactCenterXRef.current;
      exactViewCenterYRef.current = exactCenterYRef.current;
      viewCenterXRef.current = centerXRef.current;
      viewCenterYRef.current = centerYRef.current;
      viewZoomRef.current = zoomRef.current;
      setViewCenterX(centerXRef.current);
      setViewCenterY(centerYRef.current);
      setViewZoom(zoomRef.current);
    }

    if (e.touches.length === 1) {
      isDragging.current = true;
      isPinching.current = false;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDragging.current = true;
      isPinching.current = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const mx = (t1.clientX + t2.clientX) / 2;
      const my = (t1.clientY + t2.clientY) / 2;
      dragStart.current = { x: mx, y: my };
      lastTouchDist.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    const aspect = width / height;

    if (e.touches.length === 1 && isDragging.current && !isPinching.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;

      const scaleX = (zoomRef.current * aspect) / width;
      const scaleY = zoomRef.current / height;

      const newExactCX = exactCenterXRef.current.minus(new Decimal(dx).mul(scaleX));
      const newExactCY = exactCenterYRef.current.plus(new Decimal(dy).mul(scaleY));
      const newCenterX = newExactCX.toNumber();
      const newCenterY = newExactCY.toNumber();

      exactViewCenterXRef.current = newExactCX;
      exactViewCenterYRef.current = newExactCY;

      if (!isNaN(newCenterX) && isFinite(newCenterX) && !isNaN(newCenterY) && isFinite(newCenterY)) {
        viewCenterXRef.current = newCenterX;
        viewCenterYRef.current = newCenterY;
        setViewCenterX(newCenterX);
        setViewCenterY(newCenterY);

        isNavigatingRef.current = true;
        setIsNavigating(true);
        requestAnimationFrame(() => {
          drawStaticBufferTransformed();
        });
        if (navDebounceTimerRef.current) {
          clearTimeout(navDebounceTimerRef.current);
        }
      }
    } else if (e.touches.length === 2 && isPinching.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (dist > 0 && lastTouchDist.current > 0) {
        const ratio = lastTouchDist.current / dist;
        const nextZoom = Math.max(1e-300, Math.min(20, viewZoomRef.current * ratio));

        if (!isNaN(nextZoom) && isFinite(nextZoom)) {
          viewZoomRef.current = nextZoom;
          setViewZoom(nextZoom);

          isNavigatingRef.current = true;
          setIsNavigating(true);
          drawStaticBufferTransformed();
          scheduleNavRecalculate(500);
        }

        lastTouchDist.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    const wasPinching = isPinching.current;
    isDragging.current = false;
    isPinching.current = false;
    // 1.0s throttling for pan move, 0.5s throttling for zoom pinch
    scheduleNavRecalculate(wasPinching ? 500 : 1000);
  };

  // Direct Wheel Zoom on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      isInteractingRef.current = true;

      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      const aspect = width / height;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const stX = mouseX / width - 0.5;
      const stY = 0.5 - mouseY / height;

      const zoomFactor = e.deltaY < 0 ? 0.85 : 1.18;
      const currentZ = viewZoomRef.current;
      const nextZoom = Math.max(1e-300, Math.min(20, currentZ * zoomFactor));

      const deltaX = stX * aspect * (currentZ - nextZoom);
      const deltaY = stY * (currentZ - nextZoom);

      const newExactCX = exactViewCenterXRef.current.plus(new Decimal(deltaX));
      const newExactCY = exactViewCenterYRef.current.plus(new Decimal(deltaY));

      exactViewCenterXRef.current = newExactCX;
      exactViewCenterYRef.current = newExactCY;
      viewZoomRef.current = nextZoom;

      const newCX = newExactCX.toNumber();
      const newCY = newExactCY.toNumber();

      viewCenterXRef.current = newCX;
      viewCenterYRef.current = newCY;
      setViewCenterX(newCX);
      setViewCenterY(newCY);
      setViewZoom(nextZoom);

      isNavigatingRef.current = true;
      setIsNavigating(true);
      drawStaticBufferTransformed();

      // Zooming action: 0.5 second throttling delay
      scheduleNavRecalculate(500);
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Quick Zoom Helper Buttons
  const zoomIn = () => {
    const currentZ = viewZoomRef.current;
    const nextZ = Math.max(1e-300, currentZ * 0.5);
    viewZoomRef.current = nextZ;
    setViewZoom(nextZ);
    isNavigatingRef.current = true;
    setIsNavigating(true);
    drawStaticBufferTransformed();
    scheduleNavRecalculate(500);
  };

  const zoomOut = () => {
    const currentZ = viewZoomRef.current;
    const nextZ = Math.min(20, currentZ * 2.0);
    viewZoomRef.current = nextZ;
    setViewZoom(nextZ);
    isNavigatingRef.current = true;
    setIsNavigating(true);
    drawStaticBufferTransformed();
    scheduleNavRecalculate(500);
  };

  const resetView = () => {
    setCameraPositionDirect(-0.7, 0.0, 4.0, new Decimal(-0.7), new Decimal(0.0));
  };

  // Initialize WebGL Offscreen Canvas on Mount
  useEffect(() => {
    const glCanvas = document.createElement('canvas');
    glCanvas.width = 800;
    glCanvas.height = 600;
    glCanvasRef.current = glCanvas;
    initWebGL(glCanvas);
  }, []);

  // Initialize history on mount
  useEffect(() => {
    if (!historyCurrentRef.current) {
      pushHistoryState(centerXRef.current, centerYRef.current, zoomRef.current);
    }
  }, []);

  // Render on parameter updates
  useEffect(() => {
    if (!isActive) return;
    renderFractal();
  }, [isActive, centerX, centerY, zoom, maxIterations, autoMaxIter, colorScheme, smoothColoring, juliaMode, juliaX, juliaY, ricisTheta, formulaType, renderMode]);

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      renderFractal();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerX, centerY, zoom, maxIterations, colorScheme, smoothColoring, juliaMode, juliaX, juliaY, ricisTheta, formulaType, renderMode]);

  // SVG Export Generator
  const handleExportSvg = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const res = svgResolution;
        const aspect = 1;
        const cx = centerX;
        const cy = centerY;
        const zValue = zoom;
        const maxI = maxIterations;
        const smooth = smoothColoring;
        const scheme = colorScheme;
        const theta = ricisTheta;
        const isJulia = juliaMode;
        const jx = juliaX;
        const jy = juliaY;

        let paths: Record<string, string[]> = {};

        for (let py = 0; py < res; py++) {
          const stY = py / res;
          const im = cy + (stY - 0.5) * zValue;

          for (let px = 0; px < res; px++) {
            const stX = px / res;
            const re = cx + (stX - 0.5) * aspect * zValue;

            let zr = isJulia ? re : 0.0;
            let zi = isJulia ? im : 0.0;
            const cr = isJulia ? jx : re;
            const ci = isJulia ? jy : im;

            let iter = 0;
            let escaped = false;

            while (iter < maxI) {
              const r2 = zr * zr;
              const i2 = zi * zi;

              if (r2 + i2 > 4.0) {
                escaped = true;
                break;
              }

              let nextR = 0.0;
              let nextI = 0.0;

              if (formulaType === 'cubic') {
                nextR = zr * zr * zr - 3.0 * zr * i2 + cr;
                nextI = 3.0 * r2 * zi - zi * i2 + ci;
              } else if (formulaType === 'quartic') {
                nextR = r2 * r2 - 6.0 * r2 * i2 + i2 * i2 + cr;
                nextI = 4.0 * zr * zr * zr * zi - 4.0 * zr * zi * i2 + ci;
              } else if (formulaType === 'burning_ship') {
                const abs_zr = Math.abs(zr);
                const abs_zi = Math.abs(zi);
                nextR = abs_zr * abs_zr - abs_zi * abs_zi + cr;
                nextI = 2.0 * abs_zr * abs_zi + ci;
              } else if (formulaType === 'tricorn') {
                nextR = r2 - i2 + cr;
                nextI = -2.0 * zr * zi + ci;
              } else {
                nextR = r2 - i2 + cr;
                nextI = 2.0 * zr * zi + ci;
              }

              if (theta > 0.0) {
                nextR += theta * 0.08 * Math.sin(zr * 2.0);
                nextI += theta * 0.08 * Math.cos(zi * 2.0);
              }

              zr = nextR;
              zi = nextI;
              iter++;
            }

            let rgbColor = 'rgb(4,4,10)';
            if (escaped) {
              let finalT = iter;
              if (smooth) {
                const log_zn = Math.log(zr * zr + zi * zi) / 2.0;
                const log_val = Math.log(log_zn / 0.693147) / 0.693147;
                if (!isNaN(log_val) && isFinite(log_val)) {
                  finalT = iter + 1.0 - log_val;
                }
              }
              const [r, g, b] = getColorRGB(finalT, maxI, smooth, scheme, theta);
              rgbColor = `rgb(${r},${g},${b})`;
            }

            const w = 1000 / res;
            const x = px * w;
            const y = (res - 1 - py) * w;

            if (!paths[rgbColor]) {
              paths[rgbColor] = [];
            }
            paths[rgbColor].push(`M${x.toFixed(1)},${y.toFixed(1)}h${w.toFixed(1)}v${w.toFixed(1)}h-${w.toFixed(1)}z`);
          }
        }

        let pathElements = '';
        Object.entries(paths).forEach(([color, list]) => {
          pathElements += `  <path fill="${color}" d="${list.join('')}" />\n`;
        });

        const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <rect width="1000" height="1000" fill="#04040a" />
${pathElements}</svg>`;

        setGeneratedSvg(svgContent);
        setShowSvgModal(true);
      } catch (err) {
        console.error('Error generating vector fractal:', err);
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const downloadSvgFile = () => {
    const blob = new Blob([generatedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ricis_mandelbrot_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copySvgText = () => {
    navigator.clipboard.writeText(generatedSvg).then(() => {
      setSvgCopied(true);
      setTimeout(() => setSvgCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-6">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-sans font-medium tracking-tight text-white flex items-center gap-2">
            <span className="p-1 bg-cyan-500/10 text-cyan-400 rounded">𝔐</span>
            {t('Сингулярности Мандельброта', 'Mandelbrot Singularities')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t(
              'Картирование комплексных бесконечностей, деформируемых квантовым полем RICIS. Перетаскивайте для навигации, скролльте для масштабирования.',
              'Mapping complex infinities warped by the RICIS quantum field. Drag to pan, scroll to zoom.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 bg-cyan-950/40 border border-cyan-500/20 px-2.5 py-1 rounded font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {renderMode === 'hybrid' 
              ? `Клиент-Сервер Express (${renderTimeMs}ms)`
              : renderMode === 'webgl' 
                ? (zoom <= 4e-4 ? `Auto CPU Perturbation (${renderTimeMs}ms)` : `WebGL 2.0 GPU (${renderTimeMs}ms)`) 
                : `CPU Canvas (${renderTimeMs}ms)`}
          </span>

          <div className="flex items-center gap-1 bg-cyan-950/60 p-0.5 rounded border border-cyan-500/30">
            {renderMode === 'hybrid' && (
              <button
                onClick={() => setActiveTool('box')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                  activeTool === 'box' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title={t('Выделение области рамкой SVG для сервера', 'Select region with SVG box for server render')}
              >
                🔲 {t('SVG РАМКА', 'SVG BOX')}
              </button>
            )}
            <button
              onClick={() => setActiveTool('pan')}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                activeTool === 'pan' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title={t('Панорамирование и зум мышью', 'Pan & Drag viewport')}
            >
              🖱️ {t('ПАН', 'PAN')}
            </button>
            <button
              onClick={() => setActiveTool('zoom-in')}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                activeTool === 'zoom-in' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Zoom In"
            >
              🔍+
            </button>
            <button
              onClick={() => setActiveTool('zoom-out')}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                activeTool === 'zoom-out' ? 'bg-cyan-500 text-black shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Zoom Out"
            >
              🔍-
            </button>
          </div>

          <button
            onClick={() => setShowRicisTheoryModal(true)}
            className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 cursor-pointer select-none flex items-center gap-1.5 transition"
            title={t('Прямое выражение и уравнения RICIS-Мандельброта', 'Direct RICIS-Mandelbrot Expression & Equations')}
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            {t('RICIS ФОРМУЛА', 'RICIS FORMULA')}
          </button>
          <button
            onClick={() => setShowProfilerModal(true)}
            className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer select-none flex items-center gap-1.5 transition"
            title={t('Запустить профайлер производительности', 'Run Performance Profiler')}
          >
            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
            {t('ПРОФАЙЛЕР', 'PROFILER')}
          </button>
          <button
            onClick={() => setAutoEngineSwitch(prev => !prev)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border cursor-pointer select-none flex items-center gap-1 transition ${
              autoEngineSwitch
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
            }`}
            title={t(
              'Автоматическое переключение на CPU Perturbation при выходе за пределы WebGL (10 000x / 4·10⁻⁴)',
              'Auto switch to CPU Perturbation beyond WebGL precision limit (10,000x / 4e-4)'
            )}
          >
            <Zap className={`w-3 h-3 ${autoEngineSwitch ? 'text-emerald-400' : 'text-slate-500'}`} />
            {autoEngineSwitch ? t('АВТО-ДВИЖОК: ВКЛ', 'AUTO-ENGINE: ON') : t('АВТО-ДВИЖОК: ВЫКЛ', 'AUTO-ENGINE: OFF')}
          </button>
          <button
            onClick={() => setRenderMode(prev => prev === 'webgl' ? 'cpu' : prev === 'cpu' ? 'hybrid' : 'webgl')}
            className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 cursor-pointer select-none flex items-center gap-1.5 transition"
            title={t('Переключить движок рендеринга (WebGL / CPU / Гибридный)', 'Switch rendering backend (WebGL / CPU / Hybrid)')}
          >
            {renderMode === 'webgl' ? 'WEBGL GPU' : renderMode === 'cpu' ? 'CPU' : t('ГИБРИД', 'HYBRID')}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Map Stage (cols 8) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div 
            ref={stageRef}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            className={isFullScreen 
              ? "fixed inset-0 z-50 bg-[#04040a] p-4 flex flex-col justify-center items-center w-screen h-screen animate-in fade-in duration-300 select-none" 
              : "relative border border-white/5 rounded-xl bg-black/40 overflow-hidden group aspect-[4/3] md:aspect-[16/10] select-none"}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrCancel}
              onPointerCancel={handlePointerUpOrCancel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className={`w-full h-full block touch-none select-none ${
                isServerRendering 
                  ? 'cursor-wait' 
                  : activeTool === 'box' 
                    ? 'cursor-crosshair' 
                    : activeTool === 'zoom-in' 
                      ? 'cursor-zoom-in' 
                      : activeTool === 'zoom-out'
                        ? 'cursor-zoom-out'
                        : 'cursor-move'
              }`}
              id="mandelbrot-stage"
            />

            {/* Interactive SVG Selection Box Overlay (Hybrid Mode) */}
            {renderMode === 'hybrid' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                {isSelectingBox && boxStart && boxCurrent && (() => {
                  const x = Math.min(boxStart.x, boxCurrent.x);
                  const y = Math.min(boxStart.y, boxCurrent.y);
                  const w = Math.abs(boxCurrent.x - boxStart.x);
                  const h = Math.abs(boxCurrent.y - boxStart.y);
                  const cx = x + w / 2;
                  const cy = y + h / 2;
                  const stageW = stageRef.current?.clientWidth || 800;
                  const zoomFactor = w > 0 ? (stageW / w) : 1;

                  return (
                    <g>
                      {/* Dimmed backdrop outside selection box */}
                      <path
                        d={`M0,0 H10000 V10000 H0 Z M${x},${y} v${h} h${w} v-${h} Z`}
                        fill="rgba(0,0,0,0.45)"
                        fillRule="evenodd"
                      />
                      {/* Bounding box with glow */}
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill="rgba(6, 182, 212, 0.15)"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />
                      {/* Center Crosshair */}
                      <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="#38bdf8" strokeWidth="1.5" />
                      {/* Corner Handles */}
                      <circle cx={x} cy={y} r="3.5" fill="#38bdf8" />
                      <circle cx={x + w} cy={y} r="3.5" fill="#38bdf8" />
                      <circle cx={x} cy={y + h} r="3.5" fill="#38bdf8" />
                      <circle cx={x + w} cy={y + h} r="3.5" fill="#38bdf8" />

                      {/* Floating Zoom Label Badge */}
                      <foreignObject x={Math.max(10, x)} y={Math.max(10, y - 36)} width="260" height="36">
                        <div className="bg-slate-950/95 border border-cyan-400/80 text-cyan-200 text-[10px] font-mono px-2.5 py-1 rounded-md shadow-2xl flex items-center gap-2 whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                          <span>{t('ЗУМ СЕРВЕРА:', 'SERVER ZOOM:')} <strong className="text-white font-bold">{zoomFactor.toFixed(1)}x</strong></span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })()}
              </svg>
            )}

            {/* Server Rendering Indicator */}
            {isServerRendering && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-cyan-950/90 backdrop-blur-md border border-cyan-400/60 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                <span className="text-[10px] font-bold text-cyan-100 font-mono tracking-wide">
                  {t('☁️ СЕРВЕР EXPRESS ВЫЧИСЛЯЕТ ФРАКТАЛ...', '☁️ EXPRESS SERVER COMPUTING FRACTAL...')}
                </span>
              </div>
            )}

            {/* Navigating indicator */}
            {isNavigating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-cyan-950/90 backdrop-blur-md border border-cyan-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                <span className="text-[9px] font-semibold text-cyan-200 uppercase tracking-wider font-sans">
                  {t('ПЕРЕМЕЩЕНИЕ КАМЕРЫ...', 'NAVIGATING VIEWPORT...')}
                </span>
              </div>
            )}

            {/* Micro-Navigation HUD Map Overlay (Only in Fullscreen) */}
            {isFullScreen && (
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-3 text-slate-300 pointer-events-none select-none max-w-[200px] z-30">
                <div className="text-[10px] font-bold text-cyan-400 tracking-wider font-mono">MAP POSITION HUD</div>
                <div className="space-y-1 mt-1.5 font-mono text-[9px] leading-relaxed text-slate-400">
                  <div className="truncate">X: <span className="text-white font-semibold">{centerX.toFixed(8)}</span></div>
                  <div className="truncate">Y: <span className="text-white font-semibold">{centerY.toFixed(8)}</span></div>
                  <div>Z: <span className="text-white font-semibold">{(1.0 / zoom).toExponential(3)}</span></div>
                </div>
              </div>
            )}

            {/* Floating Navigation Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/10 z-30">
              {/* History back/forward buttons */}
              <div className="flex items-center gap-1 border-r border-white/10 pr-1.5 mr-0.5 shrink-0">
                <button
                  onClick={goBackInHistory}
                  disabled={!canGoBack}
                  className={`p-1.5 rounded transition cursor-pointer flex items-center justify-center ${
                    canGoBack ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'text-slate-600 border border-transparent opacity-40 cursor-not-allowed'
                  }`}
                  title={t('Назад по истории', 'History Back')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goForwardInHistory}
                  disabled={!canGoForward}
                  className={`p-1.5 rounded transition cursor-pointer flex items-center justify-center ${
                    canGoForward ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20' : 'text-slate-600 border border-transparent opacity-40 cursor-not-allowed'
                  }`}
                  title={t('Вперед по истории', 'History Forward')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {historyLength > 1 && (
                  <span className="text-[9px] font-mono text-slate-400 px-1 select-none font-semibold">
                    {historyIndex + 1}/{historyLength}
                  </span>
                )}
              </div>

              <button
                onClick={zoomIn}
                className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white transition cursor-pointer"
                title={t('Приблизить', 'Zoom In')}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={zoomOut}
                className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white transition cursor-pointer"
                title={t('Отдалить', 'Zoom Out')}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetView}
                className="p-1.5 rounded bg-white/5 hover:bg-white/15 text-white transition cursor-pointer"
                title={t('Сбросить', 'Reset View')}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsFullScreen(!isFullScreen);
                  setTimeout(() => renderFractal(), 50);
                }}
                className="p-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition cursor-pointer flex items-center justify-center"
                title={isFullScreen ? t('Свернуть', 'Exit Fullscreen') : t('Развернуть на весь экран', 'Fullscreen')}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Settings & Controls Panel (cols 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-950/60 border border-white/10 rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              {t('Параметры квантового поля', 'Quantum Field Settings')}
            </h2>

            {/* Formula Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>{t('Тип фрактала', 'Fractal Formula')}</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standard', name: 'Mandelbrot' },
                  { id: 'cubic', name: 'Cubic (z³+c)' },
                  { id: 'quartic', name: 'Quartic (z⁴+c)' },
                  { id: 'burning_ship', name: 'Burning Ship' },
                  { id: 'tricorn', name: 'Tricorn' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFormulaType(f.id as any);
                    }}
                    className={`px-2.5 py-1.5 rounded text-xs font-medium border transition cursor-pointer text-left truncate ${
                      formulaType === f.id
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Julia Set Mode */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-300">{t('Множество Жюлиа', 'Julia Set Mode')}</span>
              <button
                onClick={() => setJuliaMode(!juliaMode)}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                  juliaMode
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-slate-500'
                }`}
              >
                {juliaMode ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            {juliaMode && (
              <div className="space-y-2 bg-white/5 p-2.5 rounded-lg border border-white/5">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Julia C (Real):</span>
                    <span className="font-mono text-cyan-400 font-bold">{juliaX.toFixed(4)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0" max="1.0" step="0.005"
                    value={juliaX}
                    onChange={e => setJuliaX(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                    <span>Julia C (Imag):</span>
                    <span className="font-mono text-cyan-400 font-bold">{juliaY.toFixed(4)}</span>
                  </div>
                  <input
                    type="range"
                    min="-1.5" max="1.5" step="0.005"
                    value={juliaY}
                    onChange={e => setJuliaY(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>
              </div>
            )}

            {/* RICIS Theta Deform Parameter */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{t('Деформация RICIS θ', 'RICIS Theta Deformation')}</span>
                <span className="font-mono text-cyan-400 font-bold">{ricisTheta.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.0" max="0.4" step="0.005"
                value={ricisTheta}
                onChange={e => setRicisTheta(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1"
              />
            </div>

            {/* RICIS Delta Escape Criterion */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                {t('Критерий RICIS |Δₙ| > 4', 'RICIS Escape |Δₙ| > 4')}
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono border border-indigo-500/30">
                  -30% Iter
                </span>
              </span>
              <button
                onClick={() => setUseRicisCriterion(!useRicisCriterion)}
                className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                  useRicisCriterion
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-slate-500'
                }`}
              >
                {useRicisCriterion ? 'RICIS' : 'CLASSIC'}
              </button>
            </div>

            {/* Max Iterations & Adaptive Depth */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 items-center">
                <span className="flex items-center gap-1.5">
                  {t('Глубина итераций', 'Max Iterations')}
                  {autoIterations && (
                    <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono font-bold border border-cyan-500/30">
                      AUTO ({Math.max(getAdaptiveIterations(maxIterations, zoom, true), autoMaxIter)})
                    </span>
                  )}
                </span>
                <span className="font-mono text-cyan-400 font-bold">{maxIterations}</span>
              </div>
              <input
                type="range"
                min="50" max={Math.max(1000, maxIterations)} step="10"
                value={maxIterations}
                onChange={e => setMaxIterations(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1"
              />
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
                <span>{t('Адаптивная глубина (Бесконечная детализация)', 'Adaptive Fractal Depth')}</span>
                <button
                  onClick={() => setAutoIterations(!autoIterations)}
                  className={`px-2 py-0.5 rounded font-bold text-[9px] border transition cursor-pointer ${
                    autoIterations ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-500'
                  }`}
                >
                  {autoIterations ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Palette Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                {t('Цветовая гамма', 'Color Palette')}
              </label>
              <select
                value={colorScheme}
                onChange={e => setColorScheme(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs font-semibold text-cyan-300 cursor-pointer focus:outline-none focus:border-cyan-500"
              >
                <option value="cosmic">Cosmic Nebula</option>
                <option value="fire">Solar Fire</option>
                <option value="rainbow">Spectrum Rainbow</option>
                <option value="psychedelic">Psychedelic Wave</option>
                <option value="classic">Classic Cyan/Gold</option>
                <option value="monochrome">Monochrome</option>
              </select>
            </div>

            {/* Smooth Coloring Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-300">{t('Сглаживание градиента', 'Smooth Gradient')}</span>
              <button
                onClick={() => setSmoothColoring(!smoothColoring)}
                className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer border ${
                  smoothColoring
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-slate-500'
                }`}
              >
                {smoothColoring ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Export SVG Button */}
            <div className="pt-2 border-t border-white/5">
              <button
                onClick={handleExportSvg}
                disabled={isExporting}
                className="w-full py-2 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? t('ГЕНЕРАЦИЯ ВЕКТОРА...', 'GENERATING SVG...') : t('ЭКСПОРТ В ВЕКТОР (SVG)', 'EXPORT VECTOR (SVG)')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Profiler Modal */}
      {showProfilerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                {t('Отчет Профайлера Производительности (Profiler Diagnostics)', 'Performance Profiler Diagnostics')}
              </h3>
              <button
                onClick={() => setShowProfilerModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t('Время Кадра', 'Frame Time')}</div>
                <div className="text-xl font-mono font-bold text-cyan-300 mt-1">{profilerStats.renderTimeMs} <span className="text-xs">ms</span></div>
                <div className="text-[9px] text-slate-500 mt-0.5">~{profilerStats.fps} FPS</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t('Движок', 'Engine Mode')}</div>
                <div className="text-xs font-mono font-bold text-amber-300 mt-1 truncate">{profilerStats.engine}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">Zoom 10⁻{profilerStats.zoomExponent}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t('Разрешение', 'Canvas Resolution')}</div>
                <div className="text-sm font-mono font-bold text-emerald-300 mt-1">{profilerStats.width} × {profilerStats.height}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">DPR: {profilerStats.dpr} ({(profilerStats.totalPixels / 1e6).toFixed(2)}M px)</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t('Объем Операций', 'Total Flops')}</div>
                <div className="text-sm font-mono font-bold text-indigo-300 mt-1">{(profilerStats.totalOps / 1e6).toFixed(1)}M</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{profilerStats.maxIter} max iter</div>
              </div>
            </div>

            {/* Bottlenecks Breakdown Section */}
            <div className="space-y-3 bg-black/50 border border-cyan-500/20 rounded-xl p-4">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                {t('Анализ Узких Мест (Bottleneck Profiling)', 'Bottleneck Analysis')}
              </h4>
              
              <div className="space-y-2 text-xs text-slate-300 font-sans">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">1.</span>
                  <div>
                    <span className="font-bold text-amber-300">{t('Переключение на CPU Perturbation на высоком зуме:', 'CPU Perturbation Switch at Deep Zoom:')}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t(
                        `При зуме > 10¹⁴ (или выключенном WebGL) GPU передает обработку на CPU. Однопоточный JS обрабатывает ${(profilerStats.totalPixels / 1e6).toFixed(2)}M пикселей × ${profilerStats.maxIter} итераций = ${(profilerStats.totalOps / 1e6).toFixed(0)} миллионов циклов на главном UI-потоке.`,
                        `At zoom > 10¹⁴ GPU falls back to single-threaded CPU processing ${(profilerStats.totalPixels / 1e6).toFixed(2)}M pixels × ${profilerStats.maxIter} iter = ${(profilerStats.totalOps / 1e6).toFixed(0)}M iterations on main thread.`
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">2.</span>
                  <div>
                    <span className="font-bold text-indigo-300">{t('Вычисление Опорной Орбиты (C_ref Orbit):', 'Reference Orbit Calculation:')}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t(
                        `Расчет опорной орбиты для центра C_ref занимает ${profilerStats.refOrbitTimeMs}ms с точностью ${Math.max(50, profilerStats.zoomExponent + 25)} знаков (Decimal.js). Выполнено с оптимизацией повторного использования инстансов Decimal.`,
                        `Reference orbit calculation for C_ref took ${profilerStats.refOrbitTimeMs}ms with ${Math.max(50, profilerStats.zoomExponent + 25)} digits precision.`
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">3.</span>
                  <div>
                    <span className="font-bold text-emerald-300">{t('Увеличение итераций в AUTO режиме:', 'Iteration Scale in AUTO Mode:')}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t(
                        `На текущей глубине 10⁻${profilerStats.zoomExponent} адаптивный алгоритм установил ${profilerStats.maxIter} итераций для устранения пикселизации.`,
                        `At current depth 10⁻${profilerStats.zoomExponent} adaptive depth set ${profilerStats.maxIter} iterations to preserve sharp fractal boundary.`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowProfilerModal(false)}
                className="py-2 px-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {t('Закрыть отчет', 'Close Diagnostics')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vector Export Modal */}
      {showSvgModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-cyan-400" />
                {t('Векторный фрактал SVG сгенерирован', 'Vector Fractal SVG Generated')}
              </h3>
              <button
                onClick={() => setShowSvgModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300">
              {t(
                'Векторное изображение Mandelbrot готово к скачиванию или копированию в буфер обмена.',
                'The vector Mandelbrot image is ready for download or copying to clipboard.'
              )}
            </p>
            <div className="bg-black/60 border border-white/10 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-[10px] text-slate-400 break-all select-all">
              {generatedSvg.slice(0, 500)}...
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={downloadSvgFile}
                className="flex-1 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {t('Скачать SVG файл', 'Download SVG File')}
              </button>
              <button
                onClick={copySvgText}
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                {svgCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {svgCopied ? t('Скопировано!', 'Copied!') : t('Copy Code')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RICIS-Mandelbrot Theory & Direct Formula Modal */}
      {showRicisTheoryModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto font-sans">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  RICIS-III v7.7 MONOLITH CALCULUS
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  {t('RICIS-МАНДЕЛЬБРОТ: ПРЯМОЕ ВЫРАЖЕНИЕ МНОЖЕСТВА', 'RICIS-MANDELBROT: DIRECT SET EXPRESSION')}
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {t(
                    'Единая структурная формула без итерационного цикла | Автор: Д. В. Алейников (ORCID: 0009-0004-3226-7700)',
                    'Unified structural non-iterative formula | Author: D. V. Aleinikov (ORCID: 0009-0004-3226-7700)'
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowRicisTheoryModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Core Highlight Box */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/80 border border-indigo-500/50 rounded-xl p-5 space-y-3 shadow-inner">
              <h3 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                {t('ГЛАВНЫЙ РЕЗУЛЬТАТ: ЕДИНАЯ ФОРМУЛА МАНДЕЛЬБРОТА', 'MAIN RESULT: UNIFIED MANDELBROT FORMULA')}
              </h3>
              <div className="bg-black/70 border border-indigo-500/30 rounded-lg p-4 text-center font-mono text-cyan-200">
                <Latex math="M = \left\{ c \in \mathbb{C} : \limsup_{n \to \infty} |\Delta_n(c)| < \infty \right\}" block />
                <div className="text-[11px] text-slate-400 mt-2">
                  {t('где RICIS-разность: ', 'where RICIS-difference: ')}
                  <Latex math="\Delta_n(c) = P_c^{n+1}(0) - P_c^n(0)" />
                  {t(' при ', ' for ')}
                  <Latex math="P_c(z) = z^2 + c" />
                </div>
              </div>
              <div className="bg-black/50 border border-cyan-500/30 rounded-lg p-3 text-center font-mono text-xs text-indigo-200">
                <span className="text-slate-400 font-sans mr-2">{t('Форма в классах RICIS:', 'RICIS Infinity Class Form:')}</span>
                <Latex math="M = \left\{ c \in \mathbb{C} : \text{Class}(\infty_{\Delta(c)}) = \text{FINITE} \right\}" />
              </div>
            </div>

            {/* Grid of Formula Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Point Classification & Boundary */}
              <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  {t('Прямая Классификация & Уравнение Границы ∂M', 'Point Classification & Boundary Equation ∂M')}
                </h4>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div className="p-2 bg-black/40 rounded border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">c ∈ M ⇔</span>
                    <Latex math="\infty_{P_c^\infty(0) - P_c^{\infty-1}(0)} \in \text{FIN}" />
                  </div>
                  <div className="p-2 bg-black/40 rounded border border-white/5 flex items-center justify-between">
                    <span className="text-slate-400">c ∉ M ⇔</span>
                    <Latex math="\infty_{P_c^\infty(0) - P_c^{\infty-1}(0)} = \infty_{\infty}" />
                  </div>
                  <div className="p-2.5 bg-indigo-950/40 rounded border border-indigo-500/30 text-center">
                    <div className="text-[10px] text-indigo-300 font-bold mb-1 font-sans">{t('Уравнение Границы ∂M:', 'Boundary Equation ∂M:')}</div>
                    <Latex math="\partial M = \left\{ c \in \mathbb{C} : \limsup_{n \to \infty} |\Delta_n(c)| = L, \; 0 < L < \infty \right\}" block />
                  </div>
                </div>
              </div>

              {/* Cyclotomic Polynomial Factorization */}
              <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  {t('Факторизация по Многочленам Циклов Φ_d(c)', 'Cyclotomic Polynomial Factorization Φ_d(c)')}
                </h4>
                <div className="space-y-2 text-xs text-slate-300 font-mono">
                  <div className="p-2 bg-black/40 rounded border border-white/5 text-center">
                    <Latex math="\Delta_n(c) = c \cdot \prod_{d | n, d \neq 0} \Phi_d(c)" block />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="p-1.5 bg-black/30 rounded border border-white/5">
                      <span className="text-cyan-400 font-bold">Φ₁(c)</span> = c
                    </div>
                    <div className="p-1.5 bg-black/30 rounded border border-white/5">
                      <span className="text-cyan-400 font-bold">Φ₂(c)</span> = c + 1
                    </div>
                    <div className="p-1.5 bg-black/30 rounded border border-white/5 col-span-2">
                      <span className="text-cyan-400 font-bold">Φ₃(c)</span> = c³ + 2c² + 2c + 1
                    </div>
                    <div className="p-1.5 bg-black/30 rounded border border-white/5 col-span-2">
                      <span className="text-cyan-400 font-bold">Φ₄(c)</span> = c⁶ + 3c⁵ + 3c⁴ + 3c³ + 2c² + 1
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rendering Algorithm & Optimal Depth */}
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                {t('Однопроходная Формула Рендеринга & Шкала N_opt(s)', 'Single-Pass Rendering Formula & Scale N_opt(s)')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold font-sans">{t('Критерии Рендеринга:', 'Rendering Criteria:')}</div>
                  <div className="text-[11px] text-cyan-300">
                    • <span className="font-bold">|Δₙ| &lt; 1/(2s)</span> → {t('Сходимость (Внутри M)', 'Convergence (Inside M)')}
                  </div>
                  <div className="text-[11px] text-amber-300">
                    • <span className="font-bold">|Δₙ| &gt; 4</span> → {t('Уход (на 30% раньше |zₙ|>2)', 'Escape (30% earlier than |zₙ|>2)')}
                  </div>
                </div>
                <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[10px] text-slate-400 font-bold font-sans">{t('Логарифмическая Глубина N_max(s):', 'Logarithmic Depth N_max(s):')}</div>
                  <Latex math="N_{\text{max}}(s) = \left(1 + \frac{0.01}{|c_0| + 0.001}\right) \cdot (30 + 6 \cdot \log_2 s)" block />
                </div>
              </div>
            </div>

            {/* Compact Theory Matrix (7 Points) */}
            <div className="bg-black/50 border border-indigo-500/20 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono">
                {t('Компактная Матрица Теории RICIS (7 Постулатов)', 'Compact RICIS Theory Matrix (7 Postulates)')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300">
                <div className="p-2 bg-white/5 rounded border border-white/5">① Δₙ = P_cⁿ⁺¹(0) − P_cⁿ(0)</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">② M = limsup⁻¹ [0,∞)</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">③ ∞_F / 0 = ∞_F (мост)</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">④ Z = Z² + c, Z = ∞_Δ</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">{'⑤ Δₙ = c · ∏_{d|n} Φ_d'}</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">⑥ |Δₙ| &gt; 4 ⇔ уход (-30%)</div>
                <div className="p-2 bg-white/5 rounded border border-white/5">⑦ N_opt(s) = O(log s)</div>
                <div className="p-2 bg-indigo-500/20 rounded border border-indigo-500/40 text-indigo-300 font-bold">Class(∞_Δ) ≠ ∞_∞</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRicisTheoryModal(false)}
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-lg"
              >
                {t('Понятно (Закрыть)', 'Understood (Close)')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MandelbrotSingularity;
