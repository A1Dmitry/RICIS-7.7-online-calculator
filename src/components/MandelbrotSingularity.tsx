/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '../lib/i18n';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Download, 
  Layers, 
  Sliders, 
  HelpCircle, 
  Move,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  Infinity as InfinityIcon
} from 'lucide-react';

interface MandelbrotSingularityProps {
  preset?: any;
  onChangeState?: (state: any) => void;
  isActive?: boolean;
}

export default function MandelbrotSingularity({ preset, onChangeState, isActive = true }: MandelbrotSingularityProps = {}) {
  const { t, language } = useLanguage();

  // State with LocalStorage preservation to prevent arbitrary resets
  const [centerX, setCenterX] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ricis_mandelbrot_camera_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.centerX === 'number') return parsed.centerX;
      }
    } catch (e) {}
    return -0.7;
  });
  const [centerY, setCenterY] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ricis_mandelbrot_camera_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.centerY === 'number') return parsed.centerY;
      }
    } catch (e) {}
    return 0;
  });
  const [zoom, setZoom] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ricis_mandelbrot_camera_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.zoom === 'number') return parsed.zoom;
      }
    } catch (e) {}
    return 2.5;
  });
  const [maxIterations, setMaxIterations] = useState<number>(150);
  const [colorScheme, setColorScheme] = useState<'classic' | 'psychedelic' | 'rainbow' | 'monochrome' | 'fire' | 'cosmic'>('cosmic');
  const [smoothColoring, setSmoothColoring] = useState<boolean>(true);
  const [juliaMode, setJuliaMode] = useState<boolean>(false);
  const [juliaX, setJuliaX] = useState<number>(-0.7);
  const [juliaY, setJuliaY] = useState<number>(0.27015);
  const [ricisTheta, setRicisTheta] = useState<number>(0.0); // RICIS III Regularization parameter
  const [gridSizeIndex, setGridSizeIndex] = useState<number>(2); // Default to 4x4 (16 segments)

  // Raster Navigation Mode state
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [viewCenterX, setViewCenterX] = useState<number>(centerX);
  const [viewCenterY, setViewCenterY] = useState<number>(centerY);
  const [viewZoom, setViewZoom] = useState<number>(zoom);

  // Recalculation progress and alert states
  const [showRecalculationBar, setShowRecalculationBar] = useState<boolean>(false);
  const recalculationStartTimeRef = useRef<number | null>(null);
  const recalculationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [statusAlert, setStatusAlert] = useState<boolean>(false);
  const statusAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // GRID_SIZES dictionary for adaptive shader mapping
  const GRID_SIZES = [
    { value: 1, label: t('1x1 (1 сегмент) - Мобильный', '1x1 (1 segment) - Mobile'), desc: t('Один полноэкранный шейдер. Идеально для слабых мобильных телефонов.', 'Single full-screen shader. Perfect for low-end mobile devices.') },
    { value: 2, label: t('2x2 (4 сегмента) - Начальный GPU', '2x2 (4 segments) - Entry GPU'), desc: t('Разделение на 4 сегмента. Оптимально для средних смартфонов.', 'Split into 4 segments. Optimal for mid-range smartphones.') },
    { value: 4, label: t('4x4 (16 сегментов) - Ноутбук', '4x4 (16 segments) - Laptop'), desc: t('Разделение на 16 сегментов. Для большинства ПК и современных планшетов.', 'Split into 16 segments. For most PCs and modern tablets.') },
    { value: 6, label: t('6x6 (36 сегментов) - Игровой GPU', '6x6 (36 segments) - Gaming GPU'), desc: t('Разделение на 36 сегментов. Для игровых ноутбуков и мощных GPU.', 'Split into 36 segments. For gaming laptops and powerful GPUs.') },
    { value: 8, label: t('8x8 (64 сегмента) - Мощный десктоп', '8x8 (64 segments) - Powerful Desktop'), desc: t('Разделение на 64 сегмента. Максимальная детализация для дискретных видеокарт.', 'Split into 64 segments. Maximum detail for discrete graphics cards.') }
  ];

  // Render and UI stats
  const [renderMode, setRenderMode] = useState<'webgl' | 'cpu'>('webgl');
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [svgResolution, setSvgResolution] = useState<number>(100); // Grid size for SVG vector
  const [showSvgModal, setShowSvgModal] = useState<boolean>(false);
  const [generatedSvg, setGeneratedSvg] = useState<string>('');
  const [svgCopied, setSvgCopied] = useState<boolean>(false);

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [showZoomHint, setShowZoomHint] = useState<boolean>(false);
  const [formulaCopied, setFormulaCopied] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const zoomHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const centerStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const appliedPresetRef = useRef<any>(null);
  const lastTouchDist = useRef<number>(0);
  const isPinching = useRef<boolean>(false);
  const lastPresetJsonRef = useRef<string>('');

  // Flag to indicate active gesture or wheeling to prevent race conditions during React rendering updates
  const isInteractingRef = useRef<boolean>(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time coordinates and zoom refs for high-frequency user interactions
  const centerXRef = useRef<number>(centerX);
  const centerYRef = useRef<number>(centerY);
  const zoomRef = useRef<number>(zoom);

  // Navigation viewport coordinates and refs
  const viewCenterXRef = useRef<number>(centerX);
  const viewCenterYRef = useRef<number>(centerY);
  const viewZoomRef = useRef<number>(zoom);
  const isNavigatingRef = useRef<boolean>(false);
  const stableBufferCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const getStableBuffer = (width: number, height: number) => {
    if (!stableBufferCanvasRef.current) {
      stableBufferCanvasRef.current = document.createElement('canvas');
    }
    const sCanvas = stableBufferCanvasRef.current;
    if (sCanvas.width !== width || sCanvas.height !== height) {
      sCanvas.width = width;
      sCanvas.height = height;
    }
    return sCanvas;
  };

  const endNavigationAndRecalculate = () => {
    isNavigatingRef.current = false;
    setIsNavigating(false);
    
    // Copy view coordinates back to stable coordinates
    centerXRef.current = viewCenterXRef.current;
    centerYRef.current = viewCenterYRef.current;
    zoomRef.current = viewZoomRef.current;
    
    setCenterX(viewCenterXRef.current);
    setCenterY(viewCenterYRef.current);
    setZoom(viewZoomRef.current);

    // Save to localStorage
    try {
      localStorage.setItem('ricis_mandelbrot_camera_v2', JSON.stringify({
        centerX: viewCenterXRef.current,
        centerY: viewCenterYRef.current,
        zoom: viewZoomRef.current
      }));
    } catch (e) {
      console.error('Failed to save camera position:', e);
    }

    // Trigger progressive recalculation
    recalculationStartTimeRef.current = Date.now();
    if (recalculationTimerRef.current) {
      clearTimeout(recalculationTimerRef.current);
    }
    recalculationTimerRef.current = setTimeout(() => {
      if (renderQueue.current.length > 0 && !isNavigatingRef.current) {
        setShowRecalculationBar(true);
      }
    }, 1000);
  };

  const handleRefresh = () => {
    endNavigationAndRecalculate();
  };

  // Sync state values to refs (covers parent presets, bookmarks, and buttons)
  useEffect(() => {
    if (!isInteractingRef.current) {
      centerXRef.current = centerX;
    }
    if (!isNavigatingRef.current) {
      viewCenterXRef.current = centerX;
      setViewCenterX(centerX);
    }
  }, [centerX]);

  useEffect(() => {
    if (!isInteractingRef.current) {
      centerYRef.current = centerY;
    }
    if (!isNavigatingRef.current) {
      viewCenterYRef.current = centerY;
      setViewCenterY(centerY);
    }
  }, [centerY]);

  useEffect(() => {
    if (!isInteractingRef.current) {
      zoomRef.current = zoom;
    }
    if (!isNavigatingRef.current) {
      viewZoomRef.current = zoom;
      setViewZoom(zoom);
    }
  }, [zoom]);

  // Escape key listener for exiting full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  // Tiled Shader Map progressive caching system
  const tileCache = useRef<Map<string, { key: string, x: number, y: number, level: number, canvas: HTMLCanvasElement, lastUsed: number }>>(new Map());
  const renderQueue = useRef<{ tx: number, ty: number, level: number, key: string }[]>([]);

  // Apply parent presets if any
  useEffect(() => {
    if (preset) {
      const presetJson = JSON.stringify(preset);
      if (presetJson !== lastPresetJsonRef.current) {
        lastPresetJsonRef.current = presetJson;
        appliedPresetRef.current = preset;
        if (typeof preset.centerX === 'number') {
          setCenterX(preset.centerX);
          centerXRef.current = preset.centerX;
        }
        if (typeof preset.centerY === 'number') {
          setCenterY(preset.centerY);
          centerYRef.current = preset.centerY;
        }
        if (typeof preset.zoom === 'number') {
          setZoom(preset.zoom);
          zoomRef.current = preset.zoom;
        }
        if (typeof preset.maxIterations === 'number') setMaxIterations(preset.maxIterations);
        if (preset.colorScheme) setColorScheme(preset.colorScheme);
        if (preset.smoothColoring !== undefined) setSmoothColoring(preset.smoothColoring);
        if (preset.juliaMode !== undefined) setJuliaMode(preset.juliaMode);
        if (typeof preset.juliaX === 'number') setJuliaX(preset.juliaX);
        if (typeof preset.juliaY === 'number') setJuliaY(preset.juliaY);
        if (typeof preset.ricisTheta === 'number') setRicisTheta(preset.ricisTheta);
      }
    }
  }, [preset]);

  // Report state changes to parent for link sharing
  useEffect(() => {
    onChangeState?.({
      centerX,
      centerY,
      zoom,
      maxIterations,
      colorScheme,
      smoothColoring,
      juliaMode,
      juliaX,
      juliaY,
      ricisTheta
    });
  }, [centerX, centerY, zoom, maxIterations, colorScheme, smoothColoring, juliaMode, juliaX, juliaY, ricisTheta, onChangeState]);

  // Pre-configured coordinate bookmarks (RICIS singularities)
  const bookmarks = [
    {
      name: t('Долина Спиралей', 'Spiral Valley'),
      desc: t('Каскад бесконечных самоподобных спиралей Мандельброта', 'Infinite cascade of self-similar Mandelbrot spirals'),
      state: { centerX: -0.743643887037158704752191506114774, centerY: 0.131825904205311970493132056385139, zoom: 0.00005, maxIterations: 300, juliaMode: false, ricisTheta: 0.0 }
    },
    {
      name: t('Каньон Морфизма', 'Morphism Canyon'),
      desc: t('Узкий переход с высоким порядком симметрии', 'Narrow corridor with high-order symmetry'),
      state: { centerX: -0.098, centerY: 0.654, zoom: 0.015, maxIterations: 200, juliaMode: false, ricisTheta: 0.02 }
    },
    {
      name: t('Сердце Джулии', 'Heart of Julia'),
      desc: t('Классическое дендритное множество Джулии', 'Classic dendritic Julia set of fractal heart-shapes'),
      state: { centerX: 0, centerY: 0, zoom: 2.2, maxIterations: 180, juliaMode: true, juliaX: -0.7, juliaY: 0.27015, ricisTheta: 0.0 }
    },
    {
      name: t('Сингулярность θ-Волны', 'Theta Wave Singularity'),
      desc: t('Множество Мандельброта, искаженное квантовым полем RICIS', 'Mandelbrot set warped by the RICIS quantum field'),
      state: { centerX: -0.55, centerY: 0.0, zoom: 3.0, maxIterations: 150, juliaMode: false, ricisTheta: 0.18 }
    },
    {
      name: t('Космические Драконы', 'Cosmic Dragons'),
      desc: t('Высокопериодические орбиты на стыке деформаций', 'Highly periodic orbits on the boundary of warping'),
      state: { centerX: -0.162, centerY: 1.0405, zoom: 0.04, maxIterations: 350, juliaMode: false, ricisTheta: 0.03 }
    },
    {
      name: t('Древо Галуа', 'Galois Tree'),
      desc: t('Фрактал Джулии с круговым притяжением', 'Julia fractal with circular attraction'),
      state: { centerX: 0.0, centerY: 0.0, zoom: 2.0, maxIterations: 250, juliaMode: true, juliaX: -0.4, juliaY: 0.6, ricisTheta: 0.0 }
    }
  ];

  const applyBookmark = (b: typeof bookmarks[0]) => {
    setCenterX(b.state.centerX);
    centerXRef.current = b.state.centerX;
    setCenterY(b.state.centerY);
    centerYRef.current = b.state.centerY;
    setZoom(b.state.zoom);
    zoomRef.current = b.state.zoom;
    setMaxIterations(b.state.maxIterations);
    setJuliaMode(b.state.juliaMode);
    if (b.state.juliaX !== undefined) setJuliaX(b.state.juliaX);
    if (b.state.juliaY !== undefined) setJuliaY(b.state.juliaY);
    setRicisTheta(b.state.ricisTheta);
  };

  // Helper colors mapping for scheme
  const getColorRGB = (iter: number, max: number, smooth: boolean, scheme: string, theta: number) => {
    if (iter >= max) return [4, 4, 10]; // Deep interior

    let tVal = iter / max;
    if (smooth) {
      // Add simple continuous factor
      tVal = Math.max(0, Math.min(1, tVal));
    }

    // Warping by RICIS theta
    tVal = (tVal + theta * 0.2) % 1.0;

    switch (scheme) {
      case 'monochrome': {
        const val = Math.floor(Math.pow(tVal, 0.7) * 255);
        return [val, val, val];
      }
      case 'fire': {
        const r = Math.floor(Math.min(255, tVal * 510));
        const g = Math.floor(Math.min(255, Math.pow(tVal, 1.5) * 255 * 2));
        const b = Math.floor(Math.pow(tVal, 3) * 255);
        return [r, g, b];
      }
      case 'rainbow': {
        const r = Math.floor(Math.sin(tVal * Math.PI * 2 + 0.0) * 127 + 128);
        const g = Math.floor(Math.sin(tVal * Math.PI * 2 + 2.0) * 127 + 128);
        const b = Math.floor(Math.sin(tVal * Math.PI * 2 + 4.0) * 127 + 128);
        return [r, g, b];
      }
      case 'psychedelic': {
        const factor = tVal * 40.0;
        const r = Math.floor((Math.sin(factor + 0.0) + 1.0) * 127.5);
        const g = Math.floor((Math.sin(factor + 1.5) + 1.0) * 127.5);
        const b = Math.floor((Math.sin(factor + 3.0) + 1.0) * 127.5);
        return [r, g, b];
      }
      case 'cosmic': {
        // Neon blues, magentas, purples, cyans
        const r = Math.floor(Math.pow(tVal, 1.2) * 180 + Math.sin(tVal * 15.0) * 40 + 10);
        const g = Math.floor(Math.pow(tVal, 2.0) * 70 + Math.cos(tVal * 10.0) * 30);
        const b = Math.floor(tVal * 255);
        return [
          Math.max(0, Math.min(255, r)),
          Math.max(0, Math.min(255, g)),
          Math.max(0, Math.min(255, b))
        ];
      }
      case 'classic':
      default: {
        const r = Math.floor(9 * (1 - tVal) * tVal * tVal * tVal * 255);
        const g = Math.floor(15 * (1 - tVal) * (1 - tVal) * tVal * tVal * 255);
        const b = Math.floor(8.5 * (1 - tVal) * (1 - tVal) * (1 - tVal) * tVal * 255);
        return [r, g, b];
      }
    }
  };

  // WebGL Shaders Initialization & Compilation
  const initWebGL = (canvas: HTMLCanvasElement) => {
    try {
      const gl = canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) 
                 || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
      if (!gl) {
        setRenderMode('cpu');
        return;
      }
      glRef.current = gl as WebGLRenderingContext;

      // Vertex shader (Full-screen quad)
      const vsSource = `
        attribute vec2 position;
        varying vec2 uv;
        void main() {
          uv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      // Fragment shader for Mandelbrot / Julia with optional theta warping
      const fsSource = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        varying vec2 uv;
        uniform vec2 u_resolution;
        uniform vec2 u_center;
        uniform float u_zoom;
        uniform int u_max_iterations;
        uniform int u_color_scheme; // 0: classic, 1: psychedelic, 2: rainbow, 3: monochrome, 4: fire, 5: cosmic
        uniform float u_smooth;
        uniform float u_theta;
        uniform float u_julia;
        uniform vec2 u_julia_c;

        vec3 getColor(float t) {
          // Adjust by theta phase shifts
          t = mod(t + u_theta * 0.2, 1.0);

          if (u_color_scheme == 3) { // monochrome
            float val = pow(t, 0.7);
            return vec3(val);
          }
          else if (u_color_scheme == 4) { // fire
            float r = min(1.0, t * 2.0);
            float g = min(1.0, pow(t, 1.5) * 2.0);
            float b = pow(t, 3.0);
            return vec3(r, g, b);
          }
          else if (u_color_scheme == 2) { // rainbow
            float angle = t * 6.28318530718;
            return vec3(sin(angle) * 0.5 + 0.5, sin(angle + 2.09439510239) * 0.5 + 0.5, sin(angle + 4.18879020479) * 0.5 + 0.5);
          }
          else if (u_color_scheme == 1) { // psychedelic
            float factor = t * 40.0;
            return vec3(sin(factor) * 0.5 + 0.5, sin(factor + 1.5) * 0.5 + 0.5, sin(factor + 3.0) * 0.5 + 0.5);
          }
          else if (u_color_scheme == 5) { // cosmic
            float r = pow(t, 1.2) * 0.7 + sin(t * 15.0) * 0.15 + 0.04;
            float g = pow(t, 2.0) * 0.27 + cos(t * 10.0) * 0.12;
            float b = t;
            return clamp(vec3(r, g, b), 0.0, 1.0);
          }
          else { // classic
            float r = 9.0 * (1.0 - t) * t * t * t;
            float g = 15.0 * (1.0 - t) * (1.0 - t) * t * t;
            float b = 8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t;
            return vec3(r, g, b) * 2.0; // scale up classical saturation
          }
        }

        void main() {
          // Scale UV to map square coordinates directly
          vec2 coord = u_center + (uv - 0.5) * u_zoom;

          vec2 z = (u_julia > 0.5) ? coord : vec2(0.0);
          vec2 c = (u_julia > 0.5) ? u_julia_c : coord;

          float iter = 0.0;
          float max_i = float(u_max_iterations);
          bool escaped = false;

          for (int i = 0; i < 500; i++) {
            if (float(i) >= max_i) break;
            
            float x2 = z.x * z.x;
            float y2 = z.y * z.y;
            
            if (x2 + y2 > 4.0) {
              iter = float(i);
              escaped = true;
              break;
            }

            // z = z^2 + c with RICIS theta-warp
            vec2 z_next = vec2(x2 - y2, 2.0 * z.x * z.y) + c;
            
            // Add subtle non-linear RICIS wave perturbation based on theta
            if (u_theta > 0.0) {
              z_next += u_theta * 0.08 * vec2(sin(z.x * 2.0), cos(z.y * 2.0));
            }
            
            z = z_next;
          }

          if (!escaped) {
            gl_FragColor = vec4(0.01, 0.01, 0.03, 1.0); // Inside color
          } else {
            float t = iter / max_i;
            if (u_smooth > 0.5) {
              // Smooth continuous coloration algorithm
              float log_zn = log(z.x*z.x + z.y*z.y) / 2.0;
              float nu = log(log_zn / 0.69314718056) / 0.69314718056;
              iter = iter + 1.0 - nu;
              t = clamp(iter / max_i, 0.0, 1.0);
            }
            gl_FragColor = vec4(getColor(t), 1.0);
          }
        }
      `;

      // Helper to compile shaders
      const compileShader = (source: string, type: number): WebGLShader | null => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader compile error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(vsSource, gl.VERTEX_SHADER);
      const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking failed:', gl.getProgramInfoLog(program));
        return;
      }

      programRef.current = program;
      setRenderMode('webgl');
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D Canvas CPU mode:', e);
      setRenderMode('cpu');
    }
  };

  // Render a single tile using WebGL
  const renderTileWebGL = (
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    tileCenterX: number,
    tileCenterY: number,
    tileWidth: number,
    maxI: number,
    scheme: string,
    smooth: boolean,
    theta: number,
    isJulia: boolean,
    jx: number,
    jy: number
  ) => {
    gl.viewport(0, 0, 256, 256);
    gl.useProgram(program);

    // Set up position buffer
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

    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const centerLoc = gl.getUniformLocation(program, 'u_center');
    const zoomLoc = gl.getUniformLocation(program, 'u_zoom');
    const maxIterLoc = gl.getUniformLocation(program, 'u_max_iterations');
    const colorSchemeLoc = gl.getUniformLocation(program, 'u_color_scheme');
    const smoothLoc = gl.getUniformLocation(program, 'u_smooth');
    const thetaLoc = gl.getUniformLocation(program, 'u_theta');
    const juliaLoc = gl.getUniformLocation(program, 'u_julia');
    const juliaCLoc = gl.getUniformLocation(program, 'u_julia_c');

    gl.uniform2f(resolutionLoc, 256, 256);
    gl.uniform2f(centerLoc, tileCenterX, tileCenterY);
    gl.uniform1f(zoomLoc, tileWidth);
    gl.uniform1i(maxIterLoc, maxI);

    const schemeMap: Record<string, number> = {
      'classic': 0,
      'psychedelic': 1,
      'rainbow': 2,
      'monochrome': 3,
      'fire': 4,
      'cosmic': 5
    };
    gl.uniform1i(colorSchemeLoc, schemeMap[scheme] ?? 5);
    gl.uniform1f(smoothLoc, smooth ? 1.0 : 0.0);
    gl.uniform1f(thetaLoc, theta);
    gl.uniform1f(juliaLoc, isJulia ? 1.0 : 0.0);
    gl.uniform2f(juliaCLoc, jx, jy);

    // Draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Clean up buffer
    gl.disableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(positionBuffer);
  };

  // Render a single tile using CPU
  const renderTileCPU = (
    tileCanvas: HTMLCanvasElement,
    tileCenterX: number,
    tileCenterY: number,
    tileWidth: number,
    maxI: number,
    scheme: string,
    smooth: boolean,
    theta: number,
    isJulia: boolean,
    jx: number,
    jy: number
  ) => {
    const ctx = tileCanvas.getContext('2d');
    if (!ctx) return;

    const width = tileCanvas.width;
    const height = tileCanvas.height;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let py = 0; py < height; py++) {
      const stY = py / height;
      const im = tileCenterY + (0.5 - stY) * tileWidth; // Complex plane Y goes bottom-to-top

      for (let px = 0; px < width; px++) {
        const stX = px / width;
        const re = tileCenterX + (stX - 0.5) * tileWidth;

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

          let nextR = r2 - i2 + cr;
          let nextI = 2.0 * zr * zi + ci;

          if (theta > 0.0) {
            nextR += theta * 0.08 * Math.sin(zr * 2.0);
            nextI += theta * 0.08 * Math.cos(zi * 2.0);
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
            const log_zn = Math.log(zr * zr + zi * zi) / 2.0;
            const log_val = Math.log(log_zn / 0.69314718056) / 0.69314718056;
            if (!isNaN(log_val) && isFinite(log_val)) {
              finalT = iter + 1.0 - log_val;
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

    ctx.putImageData(imgData, 0, 0);
  };

  // Helper: Draw standard tile on canvas
  const drawTileOnCanvas = (
    ctx: CanvasRenderingContext2D,
    tileCanvas: HTMLCanvasElement,
    tx: number,
    ty: number,
    level: number,
    aspect: number,
    width: number,
    height: number
  ) => {
    const S_L = 2.5 * Math.pow(2, -level);
    const minCX = tx * S_L;
    const maxCX = (tx + 1) * S_L;
    const minCY = ty * S_L;
    const maxCY = (ty + 1) * S_L;

    const screenMinX = ((minCX - (centerXRef.current - zoomRef.current * aspect * 0.5)) / (zoomRef.current * aspect)) * width;
    const screenMaxX = ((maxCX - (centerXRef.current - zoomRef.current * aspect * 0.5)) / (zoomRef.current * aspect)) * width;
    const screenMinY = (1.0 - (maxCY - (centerYRef.current - zoomRef.current * 0.5)) / zoomRef.current) * height;
    const screenMaxY = (1.0 - (minCY - (centerYRef.current - zoomRef.current * 0.5)) / zoomRef.current) * height;

    ctx.drawImage(
      tileCanvas,
      screenMinX,
      screenMinY,
      screenMaxX - screenMinX,
      screenMaxY - screenMinY
    );
  };

  // Helper: Draw sub-region of a parent tile stretched on canvas
  const drawParentSubRegionOnCanvas = (
    ctx: CanvasRenderingContext2D,
    parentCanvas: HTMLCanvasElement,
    parentTX: number,
    parentTY: number,
    parentLevel: number,
    tx: number,
    ty: number,
    level: number,
    aspect: number,
    width: number,
    height: number
  ) => {
    const diff = level - parentLevel;
    const scale = Math.pow(2, -diff);

    const fracMinX = tx * scale - parentTX;
    const fracMaxX = (tx + 1) * scale - parentTX;
    const fracMinY = ty * scale - parentTY;
    const fracMaxY = (ty + 1) * scale - parentTY;

    const sx = fracMinX * 256;
    const sy = (1.0 - fracMaxY) * 256;
    const sw = (fracMaxX - fracMinX) * 256;
    const sh = (fracMaxY - fracMinY) * 256;

    const S_L = 2.5 * Math.pow(2, -level);
    const minCX = tx * S_L;
    const maxCX = (tx + 1) * S_L;
    const minCY = ty * S_L;
    const maxCY = (ty + 1) * S_L;

    const screenMinX = ((minCX - (centerXRef.current - zoomRef.current * aspect * 0.5)) / (zoomRef.current * aspect)) * width;
    const screenMaxX = ((maxCX - (centerXRef.current - zoomRef.current * aspect * 0.5)) / (zoomRef.current * aspect)) * width;
    const screenMinY = (1.0 - (maxCY - (centerYRef.current - zoomRef.current * 0.5)) / zoomRef.current) * height;
    const screenMaxY = (1.0 - (minCY - (centerYRef.current - zoomRef.current * 0.5)) / zoomRef.current) * height;

    ctx.drawImage(
      parentCanvas,
      sx,
      sy,
      sw,
      sh,
      screenMinX,
      screenMinY,
      screenMaxX - screenMinX,
      screenMaxY - screenMinY
    );
  };

  // Helper: Draw simple placeholder grid item
  const drawTilePlaceholder = (
    ctx: CanvasRenderingContext2D,
    tx: number,
    ty: number,
    level: number,
    aspect: number,
    width: number,
    height: number
  ) => {
    const S_L = 2.5 * Math.pow(2, -level);
    const minCX = tx * S_L;
    const maxCX = (tx + 1) * S_L;
    const minCY = ty * S_L;
    const maxCY = (ty + 1) * S_L;

    const screenMinX = ((minCX - (centerXRef.current - zoomRef.current * aspect * 0.5)) / (zoomRef.current * aspect)) * width;
    const screenMaxX = ((maxCX - (centerXRef.current - zoomRef.current * aspect * 0.5)) / (zoomRef.current * aspect)) * width;
    const screenMinY = (1.0 - (maxCY - (centerYRef.current - zoomRef.current * 0.5)) / zoomRef.current) * height;
    const screenMaxY = (1.0 - (minCY - (centerYRef.current - zoomRef.current * 0.5)) / zoomRef.current) * height;

    ctx.fillStyle = '#050510';
    ctx.fillRect(screenMinX, screenMinY, screenMaxX - screenMinX, screenMaxY - screenMinY);
    
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenMinX, screenMinY, screenMaxX - screenMinX, screenMaxY - screenMinY);
  };

  // Draw all visible tiles
  const drawAllTiles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const aspect = width / height;

    if (isNavigatingRef.current && stableBufferCanvasRef.current) {
      // Draw translated and scaled raster image
      ctx.fillStyle = '#04040a';
      ctx.fillRect(0, 0, width, height);

      const stableZoom = zoomRef.current; // the stable zoom level
      const stableCenterX = centerXRef.current;
      const stableCenterY = centerYRef.current;

      const viewZ = viewZoomRef.current;
      const viewCX = viewCenterXRef.current;
      const viewCY = viewCenterYRef.current;

      const scaleRatio = stableZoom / viewZ;
      const dx_complex = stableCenterX - viewCX;
      const dy_complex = viewCY - stableCenterY; // Y is inverted in screen coordinates

      const w_drawn = scaleRatio * width;
      const h_drawn = scaleRatio * height;

      const x_left = (dx_complex / (viewZ * aspect) + 0.5 - 0.5 * scaleRatio) * width;
      const y_top = (dy_complex / viewZ + 0.5 - 0.5 * scaleRatio) * height;

      // Draw the stable buffer image
      ctx.drawImage(stableBufferCanvasRef.current, x_left, y_top, w_drawn, h_drawn);

      // Draw optional subtle border or overlay if zoomed out extremely far to show original frame bounds
      if (scaleRatio < 1.0) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x_left, y_top, w_drawn, h_drawn);
      }
      return;
    }

    // Clear main canvas
    ctx.fillStyle = '#04040a';
    ctx.fillRect(0, 0, width, height);

    // Determine current target level based on gridSize selection
    const G = GRID_SIZES[gridSizeIndex]?.value ?? 4;
    const targetLevel = Math.max(0, Math.min(20, Math.round(-Math.log2(zoomRef.current / (2.5 * G)))));
    const S_L = 2.5 * Math.pow(2, -targetLevel);

    // Calculate current viewport bounds in complex coordinates
    const viewportMinX = centerXRef.current - zoomRef.current * aspect * 0.5;
    const viewportMaxX = centerXRef.current + zoomRef.current * aspect * 0.5;
    const viewportMinY = centerYRef.current - zoomRef.current * 0.5;
    const viewportMaxY = centerYRef.current + zoomRef.current * 0.5;

    const minTX = Math.floor(viewportMinX / S_L);
    const maxTX = Math.floor(viewportMaxX / S_L);
    const minTY = Math.floor(viewportMinY / S_L);
    const maxTY = Math.floor(viewportMaxY / S_L);

    const nextQueue: {tx: number, ty: number, level: number, key: string}[] = [];

    for (let tx = minTX; tx <= maxTX; tx++) {
      for (let ty = minTY; ty <= maxTY; ty++) {
        const key = `${targetLevel}-${tx}-${ty}-${maxIterations}-${colorScheme}-${smoothColoring ? 1 : 0}-${juliaMode ? 1 : 0}-${juliaX.toFixed(4)}-${juliaY.toFixed(4)}-${ricisTheta.toFixed(4)}`;
        
        const cached = tileCache.current.get(key);
        if (cached) {
          cached.lastUsed = Date.now();
          drawTileOnCanvas(ctx, cached.canvas, tx, ty, targetLevel, aspect, width, height);
        } else {
          // Queue for rendering
          nextQueue.push({ tx, ty, level: targetLevel, key });

          // Search parent cascade for temporary stretching fallback (averaging/priority overlays)
          let foundParent = false;
          for (let p = targetLevel - 1; p >= 0; p--) {
            const parentTX = Math.floor(tx * Math.pow(2, p - targetLevel));
            const parentTY = Math.floor(ty * Math.pow(2, p - targetLevel));
            const parentKey = `${p}-${parentTX}-${parentTY}-${maxIterations}-${colorScheme}-${smoothColoring ? 1 : 0}-${juliaMode ? 1 : 0}-${juliaX.toFixed(4)}-${juliaY.toFixed(4)}-${ricisTheta.toFixed(4)}`;
            
            const parentCached = tileCache.current.get(parentKey);
            if (parentCached) {
              parentCached.lastUsed = Date.now();
              drawParentSubRegionOnCanvas(ctx, parentCached.canvas, parentTX, parentTY, p, tx, ty, targetLevel, aspect, width, height);
              foundParent = true;
              break;
            } else {
              // Queue parent tile with high priority if missing
              const parentTileObj = { tx: parentTX, ty: parentTY, level: p, key: parentKey };
              if (!nextQueue.some(q => q.key === parentKey)) {
                nextQueue.unshift(parentTileObj);
              }
            }
          }

          if (!foundParent) {
            drawTilePlaceholder(ctx, tx, ty, targetLevel, aspect, width, height);
          }
        }
      }
    }

    // Sort queue by proximity to the viewport center so the center fills in first!
    const centerTX = (minTX + maxTX) / 2;
    const centerTY = (minTY + maxTY) / 2;
    nextQueue.sort((a, b) => {
      const distA = Math.hypot(a.tx - centerTX, a.ty - centerTY);
      const distB = Math.hypot(b.tx - centerTX, b.ty - centerTY);
      // Give higher priority to parents (lower level)
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return distA - distB;
    });

    renderQueue.current = nextQueue;
  };

  // Progressive Queue Processor
  const processQueue = () => {
    if (renderQueue.current.length === 0) {
      // Clear recalculation timer and hide bar on completion
      recalculationStartTimeRef.current = null;
      if (recalculationTimerRef.current) {
        clearTimeout(recalculationTimerRef.current);
        recalculationTimerRef.current = null;
      }
      setShowRecalculationBar(false);

      if (!isNavigatingRef.current && canvasRef.current) {
        const mainCanvas = canvasRef.current;
        const sCanvas = getStableBuffer(mainCanvas.width, mainCanvas.height);
        const sCtx = sCanvas.getContext('2d');
        if (sCtx) {
          sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
          sCtx.drawImage(mainCanvas, 0, 0);
        }
      }
      return;
    }

    const gl = glRef.current;
    const program = programRef.current;
    const useWebGL = renderMode === 'webgl' && gl && program;

    // Process up to 3 tiles per frame for high frame rate
    const tilesToProcess = Math.min(3, renderQueue.current.length);
    let renderedAny = false;
    const tStart = performance.now();

    for (let i = 0; i < tilesToProcess; i++) {
      const tile = renderQueue.current.shift();
      if (!tile) continue;

      if (tileCache.current.has(tile.key)) continue;

      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = 256;
      tileCanvas.height = 256;

      const S_L = 2.5 * Math.pow(2, -tile.level);
      const tileCenterX = (tile.tx + 0.5) * S_L;
      const tileCenterY = (tile.ty + 0.5) * S_L;

      if (useWebGL) {
        try {
          renderTileWebGL(
            gl!,
            program!,
            tileCenterX,
            tileCenterY,
            S_L,
            maxIterations,
            colorScheme,
            smoothColoring,
            ricisTheta,
            juliaMode,
            juliaX,
            juliaY
          );
          const tileCtx = tileCanvas.getContext('2d')!;
          // Draw WebGL hidden buffer to offscreen 2D tile canvas
          tileCtx.drawImage(glCanvasRef.current!, 0, 0);
        } catch (e) {
          console.warn('WebGL tile rendering crashed, using CPU fallback:', e);
          renderTileCPU(
            tileCanvas,
            tileCenterX,
            tileCenterY,
            S_L,
            maxIterations,
            colorScheme,
            smoothColoring,
            ricisTheta,
            juliaMode,
            juliaX,
            juliaY
          );
        }
      } else {
        renderTileCPU(
          tileCanvas,
          tileCenterX,
          tileCenterY,
          S_L,
          maxIterations,
          colorScheme,
          smoothColoring,
          ricisTheta,
          juliaMode,
          juliaX,
          juliaY
        );
      }

      // Add to LRU cache
      tileCache.current.set(tile.key, {
        key: tile.key,
        x: tile.tx,
        y: tile.ty,
        level: tile.level,
        canvas: tileCanvas,
        lastUsed: Date.now()
      });
      renderedAny = true;
    }

    // Limit cache size to 150 tiles for memory protection
    if (tileCache.current.size > 150) {
      const cacheValues = Array.from(tileCache.current.values()) as { key: string, x: number, y: number, level: number, canvas: HTMLCanvasElement, lastUsed: number }[];
      const sorted = cacheValues.sort((a, b) => a.lastUsed - b.lastUsed);
      const toEvict = sorted.slice(0, sorted.length - 100);
      toEvict.forEach(t => {
        tileCache.current.delete(t.key);
      });
    }

    if (renderedAny) {
      const tEnd = performance.now();
      setRenderTimeMs(Math.round(tEnd - tStart));
      drawAllTiles();

      // If the queue has just become empty, capture the stable buffer immediately
      if (renderQueue.current.length === 0 && !isNavigatingRef.current && canvasRef.current) {
        const mainCanvas = canvasRef.current;
        const sCanvas = getStableBuffer(mainCanvas.width, mainCanvas.height);
        const sCtx = sCanvas.getContext('2d');
        if (sCtx) {
          sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
          sCtx.drawImage(mainCanvas, 0, 0);
        }
      }
    }
  };

  // Perform render function
  const renderFractal = () => {
    drawAllTiles();
  };

  // Drag and drop / navigation logic
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isInteractingRef.current = true;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };

    // Clear old recalculation bar/timer when beginning interaction
    if (recalculationTimerRef.current) {
      clearTimeout(recalculationTimerRef.current);
      recalculationTimerRef.current = null;
    }
    setShowRecalculationBar(false);

    // If not currently navigating, sync view coordinates with current coordinates
    if (!isNavigatingRef.current) {
      viewCenterXRef.current = centerX;
      viewCenterYRef.current = centerY;
      viewZoomRef.current = zoom;
      setViewCenterX(centerX);
      setViewCenterY(centerY);
      setViewZoom(zoom);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    const aspect = width / height;
    
    // Map pixels to complex coordinates using current viewZoom
    const scaleX = (viewZoomRef.current * aspect) / width;
    const scaleY = viewZoomRef.current / height;

    const newCenterX = viewCenterXRef.current - dx * scaleX;
    const newCenterY = viewCenterYRef.current + dy * scaleY;

    if (!isNaN(newCenterX) && isFinite(newCenterX) && !isNaN(newCenterY) && isFinite(newCenterY)) {
      viewCenterXRef.current = newCenterX;
      viewCenterYRef.current = newCenterY;
      setViewCenterX(newCenterX);
      setViewCenterY(newCenterY);

      isNavigatingRef.current = true;
      setIsNavigating(true);
      drawAllTiles();
    }

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging.current) {
      isDragging.current = false;
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 50);
      endNavigationAndRecalculate();
    }
  };

  // Touch event handlers for mobile gestures (pan & pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    isInteractingRef.current = true;

    // Clear old recalculation bar/timer when beginning interaction
    if (recalculationTimerRef.current) {
      clearTimeout(recalculationTimerRef.current);
      recalculationTimerRef.current = null;
    }
    setShowRecalculationBar(false);

    // If not currently navigating, sync view coordinates with current coordinates
    if (!isNavigatingRef.current) {
      viewCenterXRef.current = centerX;
      viewCenterYRef.current = centerY;
      viewZoomRef.current = zoom;
      setViewCenterX(centerX);
      setViewCenterY(centerY);
      setViewZoom(zoom);
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

      const scaleX = (viewZoomRef.current * aspect) / width;
      const scaleY = viewZoomRef.current / height;

      const newCenterX = viewCenterXRef.current - dx * scaleX;
      const newCenterY = viewCenterYRef.current + dy * scaleY;

      if (!isNaN(newCenterX) && isFinite(newCenterX) && !isNaN(newCenterY) && isFinite(newCenterY)) {
        viewCenterXRef.current = newCenterX;
        viewCenterYRef.current = newCenterY;
        setViewCenterX(newCenterX);
        setViewCenterY(newCenterY);

        isNavigatingRef.current = true;
        setIsNavigating(true);
        drawAllTiles();
      }

      dragStart.current = { x: touch.clientX, y: touch.clientY };
    } else if (e.touches.length === 2 && isPinching.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const mx = (t1.clientX + t2.clientX) / 2;
      const my = (t1.clientY + t2.clientY) / 2;
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      if (dist > 0 && lastTouchDist.current > 0) {
        const ratio = lastTouchDist.current / dist;
        const nextZoom = Math.max(1e-15, Math.min(20, viewZoomRef.current * ratio));

        const rect = canvas.getBoundingClientRect();
        const touchX = mx - rect.left;
        const touchY = my - rect.top;

        const stX = touchX / width;
        const stY = 1.0 - (touchY / height);

        const worldX = viewCenterXRef.current + (stX - 0.5) * aspect * viewZoomRef.current;
        const worldY = viewCenterYRef.current + (stY - 0.5) * viewZoomRef.current;

        let nextCenterX = worldX - (stX - 0.5) * aspect * nextZoom;
        let nextCenterY = worldY - (stY - 0.5) * nextZoom;

        const dx = mx - dragStart.current.x;
        const dy = my - dragStart.current.y;
        const scaleX = (nextZoom * aspect) / width;
        const scaleY = nextZoom / height;

        nextCenterX = nextCenterX - dx * scaleX;
        nextCenterY = nextCenterY + dy * scaleY;

        if (
          !isNaN(nextCenterX) && isFinite(nextCenterX) &&
          !isNaN(nextCenterY) && isFinite(nextCenterY) &&
          !isNaN(nextZoom) && isFinite(nextZoom)
        ) {
          viewZoomRef.current = nextZoom;
          viewCenterXRef.current = nextCenterX;
          viewCenterYRef.current = nextCenterY;
          setViewZoom(nextZoom);
          setViewCenterX(nextCenterX);
          setViewCenterY(nextCenterY);

          isNavigatingRef.current = true;
          setIsNavigating(true);
          drawAllTiles();
        }

        dragStart.current = { x: mx, y: my };
        lastTouchDist.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    isPinching.current = false;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 50);
    endNavigationAndRecalculate();
  };

  // Wheel zoom at mouse cursor position with Shift requirement and exponential inverse zoom scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) {
        // Normal scrolling: do not zoom. Flash warning in the status bar instead of annoying popup.
        setStatusAlert(true);
        if (statusAlertTimeoutRef.current) {
          clearTimeout(statusAlertTimeoutRef.current);
        }
        statusAlertTimeoutRef.current = setTimeout(() => {
          setStatusAlert(false);
        }, 3000);
        return; // Allow page to scroll normally if Shift is not held
      }

      // If Shift is held, prevent standard page scroll/zoom and zoom into coordinate
      e.preventDefault();
      isInteractingRef.current = true;

      // Clear old recalculation bar/timer when beginning interaction
      if (recalculationTimerRef.current) {
        clearTimeout(recalculationTimerRef.current);
        recalculationTimerRef.current = null;
      }
      setShowRecalculationBar(false);

      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      wheelTimeoutRef.current = setTimeout(() => {
        isInteractingRef.current = false;
        // Automatically trigger progressive recalculation when scrolling stops!
        endNavigationAndRecalculate();
      }, 500); // 500ms of wheel inactivity means the user stopped scrolling

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      const aspect = width / height;
      
      // Position under cursor in complex coordinates before zoom
      const stX = mouseX / width;
      const stY = 1.0 - (mouseY / height); // Invert Y
      
      const worldX = viewCenterXRef.current + (stX - 0.5) * aspect * viewZoomRef.current;
      const worldY = viewCenterYRef.current + (stY - 0.5) * viewZoomRef.current;

      // Exponential inverse dependency: as zoom (magnification) increases, zoom step percentage decreases exponentially.
      // viewZoomRef.current ranges from 1e-15 to 2.5
      const zoomStepPercent = 0.03 + 0.22 * Math.pow(viewZoomRef.current / 2.5, 0.15);

      // When deltaY < 0, scroll up (zoom in)
      const factor = e.deltaY < 0 ? (1.0 - zoomStepPercent) : (1.0 / (1.0 - zoomStepPercent));
      const nextZoom = Math.max(1e-15, Math.min(20, viewZoomRef.current * factor));

      // Calculate new center so worldX/worldY remains under mouse cursor
      const nextCenterX = worldX - (stX - 0.5) * aspect * nextZoom;
      const nextCenterY = worldY - (stY - 0.5) * nextZoom;

      if (
        !isNaN(nextCenterX) && isFinite(nextCenterX) &&
        !isNaN(nextCenterY) && isFinite(nextCenterY) &&
        !isNaN(nextZoom) && isFinite(nextZoom)
      ) {
        viewZoomRef.current = nextZoom;
        viewCenterXRef.current = nextCenterX;
        viewCenterYRef.current = nextCenterY;
        setViewZoom(nextZoom);
        setViewCenterX(nextCenterX);
        setViewCenterY(nextCenterY);

        isNavigatingRef.current = true;
        setIsNavigating(true);
        drawAllTiles();
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
    };
  }, [isActive]);

  // Button zoom triggers
  const zoomIn = () => {
    if (recalculationTimerRef.current) {
      clearTimeout(recalculationTimerRef.current);
      recalculationTimerRef.current = null;
    }
    setShowRecalculationBar(false);

    const nextZ = Math.max(1e-15, viewZoomRef.current * 0.7);
    viewZoomRef.current = nextZ;
    setViewZoom(nextZ);
    endNavigationAndRecalculate();
  };

  const zoomOut = () => {
    if (recalculationTimerRef.current) {
      clearTimeout(recalculationTimerRef.current);
      recalculationTimerRef.current = null;
    }
    setShowRecalculationBar(false);

    const nextZ = Math.min(20, viewZoomRef.current * 1.3);
    viewZoomRef.current = nextZ;
    setViewZoom(nextZ);
    endNavigationAndRecalculate();
  };

  const resetView = () => {
    const cx = juliaMode ? 0.0 : -0.7;
    const cy = 0.0;
    const z = 2.5;

    viewCenterXRef.current = cx;
    viewCenterYRef.current = cy;
    viewZoomRef.current = z;
    setViewCenterX(cx);
    setViewCenterY(cy);
    setViewZoom(z);

    centerXRef.current = cx;
    centerYRef.current = cy;
    zoomRef.current = z;
    setCenterX(cx);
    setCenterY(cy);
    setZoom(z);

    setRicisTheta(0.0);

    // Save defaults to localStorage
    try {
      localStorage.setItem('ricis_mandelbrot_camera_v2', JSON.stringify({
        centerX: cx,
        centerY: cy,
        zoom: z
      }));
    } catch (e) {}

    if (recalculationTimerRef.current) {
      clearTimeout(recalculationTimerRef.current);
      recalculationTimerRef.current = null;
    }
    setShowRecalculationBar(false);

    endNavigationAndRecalculate();
  };

  // Initialize WebGL Offscreen Canvas on Mount
  useEffect(() => {
    const glCanvas = document.createElement('canvas');
    glCanvas.width = 256;
    glCanvas.height = 256;
    glCanvasRef.current = glCanvas;
    initWebGL(glCanvas);
  }, []);

  // Background queue processing animation loop
  useEffect(() => {
    if (!isActive) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      processQueue();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, [isActive, renderMode, maxIterations, colorScheme, smoothColoring, juliaMode, juliaX, juliaY, ricisTheta]);

  // Recalculate and redraw when any coordinate or parameter changes
  useEffect(() => {
    if (!isActive) return;
    renderFractal();
  }, [isActive, centerX, centerY, zoom, maxIterations, colorScheme, smoothColoring, juliaMode, juliaX, juliaY, ricisTheta, gridSizeIndex]);

  // Handle window resizing dynamically
  useEffect(() => {
    const handleResize = () => {
      renderFractal();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [centerX, centerY, zoom, maxIterations, colorScheme, smoothColoring, juliaMode, juliaX, juliaY, ricisTheta, gridSizeIndex]);

  // SVG Export Generator
  const handleExportSvg = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const res = svgResolution;
        const aspect = 1; // Square SVG export looks cleanest and is fully balanced
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

        let paths: Record<string, string[]> = {}; // Group rectangles of the same color into a single path

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

              let nextR = r2 - i2 + cr;
              let nextI = 2.0 * zr * zi + ci;

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

            // Define point coordinates for SVG viewport size 1000x1000
            const w = 1000 / res;
            const x = px * w;
            const y = (res - 1 - py) * w; // Invert Y coordinate back to top-down in SVG

            if (!paths[rgbColor]) {
              paths[rgbColor] = [];
            }
            paths[rgbColor].push(`M${x.toFixed(1)},${y.toFixed(1)}h${w.toFixed(1)}v${w.toFixed(1)}h-${w.toFixed(1)}z`);
          }
        }

        // Combine into a clean vector layout
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
          <span className="text-[10px] text-slate-500 bg-white/5 px-2.5 py-1 rounded font-mono">
            {renderMode === 'webgl' ? 'WebGL GPU Acceleration' : 'Standard CPU Canvas'} ({renderTimeMs}ms)
          </span>
          <button
            onClick={() => setRenderMode(prev => prev === 'webgl' ? 'cpu' : 'webgl')}
            className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 cursor-pointer select-none"
            title={t('Переключить движок рендеринга', 'Switch rendering backend')}
          >
            {t('ДВИЖОК', 'ENGINE')}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Map Stage (cols 8) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className={isFullScreen 
            ? "fixed inset-0 z-50 bg-[#04040a] p-4 flex flex-col justify-center items-center w-screen h-screen animate-in fade-in duration-300" 
            : "relative border border-white/5 rounded-xl bg-black/40 overflow-hidden group aspect-[4/3] md:aspect-[16/10]"}
          >
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
              id="mandelbrot-stage"
            />

            {/* Navigating indicator */}
            {isNavigating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-cyan-950/90 backdrop-blur-md border border-cyan-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                <span className="text-[9px] font-semibold text-cyan-200 uppercase tracking-wider font-sans">
                  {t('ПЕРЕМЕЩЕНИЕ КАМЕРЫ...', 'NAVIGATING VIEWPORT...')}
                </span>
              </div>
            )}

            {/* Glowing Recalculation Progress Bar */}
            {showRecalculationBar && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 w-[80%] max-w-xs bg-black/85 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2.5 flex flex-col gap-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-1 font-sans">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '3s' }} />
                    {t('ВЫЧИСЛЕНИЕ...', 'CALCULATING...')}
                  </span>
                  <span className="text-slate-400">
                    {t('Сегментов: ', 'Segs: ')}
                    <span className="text-white font-bold">{renderQueue.current.length}</span>
                  </span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                    style={{ 
                      width: `${Math.max(5, 100 - (renderQueue.current.length / (GRID_SIZES[gridSizeIndex]?.value * GRID_SIZES[gridSizeIndex]?.value || 16)) * 100)}%` 
                    }}
                  />
                </div>
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

            {/* Super Compact Floating HUD Overlay (Only in Fullscreen) */}
            {isFullScreen && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md border border-cyan-500/10 rounded-xl p-1.5 flex flex-wrap md:flex-nowrap items-center gap-2 w-[96%] shadow-2xl z-40 text-[9px] text-slate-300">
                {/* 1. Formula & Smooth Toggle Group */}
                <div className="flex flex-row md:flex-col gap-1 border-r border-white/5 pr-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold uppercase text-[7.5px] tracking-wider w-[40px]">{t('ФОРМУЛА', 'FORMULA')}:</span>
                    <button
                      onClick={() => {
                        setJuliaMode(!juliaMode);
                        setCenterX(juliaMode ? -0.7 : 0.0);
                        setCenterY(0.0);
                        setZoom(2.5);
                      }}
                      className="px-1 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-bold transition text-[8px] cursor-pointer"
                    >
                      {juliaMode ? 'JULIA' : 'MANDEL'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold uppercase text-[7.5px] tracking-wider w-[40px]">{t('СГЛАЖИВ.', 'SMOOTH')}:</span>
                    <button
                      onClick={() => setSmoothColoring(!smoothColoring)}
                      className={`px-1 py-0.5 rounded text-[7.5px] font-bold transition cursor-pointer border ${
                        smoothColoring 
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300 font-bold' 
                          : 'bg-white/5 border-transparent text-slate-500'
                      }`}
                    >
                      {smoothColoring ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* 2. Julia Constant Sliders (Only if Julia is active) */}
                {juliaMode && (
                  <div className="flex flex-col gap-0.5 border-r border-white/5 pr-2 min-w-[110px] max-w-[140px] shrink-0">
                    <div className="flex justify-between text-[7.5px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      <span>C.Real: <strong className="text-cyan-300">{juliaX.toFixed(3)}</strong></span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="1.0"
                      step="0.005"
                      value={juliaX}
                      onChange={e => setJuliaX(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-0.5"
                    />
                    <div className="flex justify-between text-[7.5px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      <span>C.Imag: <strong className="text-cyan-300">{juliaY.toFixed(3)}</strong></span>
                    </div>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.005"
                      value={juliaY}
                      onChange={e => setJuliaY(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-0.5"
                    />
                  </div>
                )}

                {/* 3. Sliders: RICIS θ, Iterations, Grid size */}
                <div className="flex-1 flex flex-row items-center gap-2 min-w-0">
                  {/* RICIS θ */}
                  <div className="flex-1 flex flex-col gap-0.5 min-w-[60px]">
                    <div className="flex justify-between items-center text-[8px] leading-none">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">θ:</span>
                      <span className="font-mono text-cyan-300 font-bold">{ricisTheta.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.4"
                      step="0.005"
                      value={ricisTheta}
                      onChange={e => setRicisTheta(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-0.5"
                    />
                  </div>

                  {/* Max Iterations */}
                  <div className="flex-1 flex flex-col gap-0.5 min-w-[60px]">
                    <div className="flex justify-between items-center text-[8px] leading-none">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">{t('ИТЕР.', 'ITER')}:</span>
                      <span className="font-mono text-cyan-300 font-bold">{maxIterations}</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="500"
                      step="10"
                      value={maxIterations}
                      onChange={e => setMaxIterations(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-0.5"
                    />
                  </div>

                  {/* Shader count grid size index */}
                  <div className="flex-1 flex flex-col gap-0.5 min-w-[60px]">
                    <div className="flex justify-between items-center text-[8px] leading-none">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">{t('СЕТКА', 'GRID')}:</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {GRID_SIZES[gridSizeIndex]?.value}x{GRID_SIZES[gridSizeIndex]?.value}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={GRID_SIZES.length - 1}
                      step="1"
                      value={gridSizeIndex}
                      onChange={e => setGridSizeIndex(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-0.5"
                    />
                  </div>
                </div>

                {/* 4. Color Scheme select & Close button */}
                <div className="flex items-center gap-1.5 border-l border-white/5 pl-2 shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">{t('ГАММА', 'PALETTE')}:</span>
                    <select
                      value={colorScheme}
                      onChange={e => setColorScheme(e.target.value as any)}
                      className="bg-black/60 border border-white/15 rounded px-1 py-0.5 text-[8.5px] font-semibold text-cyan-300 accent-black cursor-pointer"
                    >
                      <option value="classic">Classic</option>
                      <option value="psychedelic">Psychedelic</option>
                      <option value="rainbow">Rainbow</option>
                      <option value="monochrome">Monochr.</option>
                      <option value="fire">Fire</option>
                      <option value="cosmic">Cosmic</option>
                    </select>
                  </div>

                  {isFullScreen && (
                    <button
                      onClick={() => {
                        setIsFullScreen(false);
                        setTimeout(() => renderFractal(), 50);
                      }}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer flex items-center justify-center h-7 w-7"
                      title={t('Свернуть', 'Exit Fullscreen')}
                    >
                      <Minimize2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[10px] text-slate-400 font-mono">
            <span className={`flex items-center gap-1.5 transition-all duration-300 ${statusAlert ? 'text-yellow-400 font-bold scale-[1.01]' : 'text-slate-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusAlert ? 'bg-yellow-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`} />
              {statusAlert 
                ? t('ВНИМАНИЕ: Для масштабирования зажмите Shift + колесико мыши!', 'ATTENTION: Hold Shift + scroll wheel to zoom!')
                : t('Управление: зажмите ЛКМ для перемещения, Shift + колесико для зума.', 'Usage: Drag to pan, Shift + wheel to zoom.')}
            </span>
            <div className="flex gap-4">
              <span>{t('Разрешение SVG:', 'SVG Resolution:')} <strong className="text-slate-200">{svgResolution}x{svgResolution} px</strong></span>
              <span>{t('Режим:', 'Formula:')} <strong className="text-slate-200">{juliaMode ? 'Julia Set' : 'Mandelbrot'}</strong></span>
            </div>
          </div>
        </div>

        {/* Configurations Drawer / Settings Panel (cols 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#121214] border border-white/5 rounded-xl p-5 space-y-5">
            <h3 className="text-xs font-bold font-sans tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              {t('ПАРАМЕТРЫ СИНГУЛЯРНОСТИ', 'SINGULARITY CONFIGURATION')}
            </h3>

            {/* Formula Selector Toggle */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300">{t('Математическая структура', 'Mathematical Structure')}</span>
                <button
                  onClick={() => {
                    setJuliaMode(!juliaMode);
                    setCenterX(juliaMode ? -0.7 : 0.0);
                    setCenterY(0.0);
                    setZoom(2.5);
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer select-none"
                >
                  {juliaMode ? <ToggleRight className="w-5 h-5 text-cyan-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                  <span>{juliaMode ? 'JULIA SET' : 'MANDELBROT'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                {juliaMode 
                  ? t('Множество Джулии вычисляется для фиксированной константы С.', 'The Julia set is computed for a static constant coordinate C.')
                  : t('Множество Мандельброта картирует орбиты всех стартовых точек.', 'The Mandelbrot set maps the boundary behaviors of critical orbits.')}
              </p>
            </div>

            {/* Julia Constant controls (only if juliaMode is active) */}
            {juliaMode && (
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-3">
                <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400">JULIA CONSTANT C</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-400">Real(C)</span>
                      <span className="text-cyan-300 font-bold">{juliaX.toFixed(4)}</span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="1.0"
                      step="0.001"
                      value={juliaX}
                      onChange={e => setJuliaX(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-mono">
                      <span className="text-slate-400">Imag(C)</span>
                      <span className="text-cyan-300 font-bold">{juliaY.toFixed(4)}</span>
                    </div>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.001"
                      value={juliaY}
                      onChange={e => setJuliaY(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Camera Controls ("Движки" / Sliders for position and scale) */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-3">
              <span className="text-[10px] font-bold font-mono tracking-wider text-cyan-400 flex items-center gap-1.5 uppercase">
                <Move className="w-3.5 h-3.5" />
                {t('Управление Камерой (RICIS-3)', 'Camera Navigation (RICIS-3)')}
              </span>
              
              <div className="space-y-2.5">
                {/* Camera X */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-slate-400">Camera X</span>
                    <span className="text-cyan-300 font-bold">{centerX.toFixed(6)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.0001"
                    value={centerX}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      centerXRef.current = val;
                      setCenterX(val);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>

                {/* Camera Y */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-slate-400">Camera Y</span>
                    <span className="text-cyan-300 font-bold">{centerY.toFixed(6)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.0001"
                    value={centerY}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      centerYRef.current = val;
                      setCenterY(val);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>

                {/* Camera Zoom (Logarithmic scale) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-slate-400">{t('Масштаб (Zoom)', 'Zoom Scale')}</span>
                    <span className="text-cyan-300 font-bold">{(2.5 / zoom).toExponential(3)}x</span>
                  </div>
                  <input
                    type="range"
                    min="-15.0"
                    max="1.3"
                    step="0.01"
                    value={Math.log10(zoom)}
                    onChange={e => {
                      const val = Math.pow(10, parseFloat(e.target.value));
                      zoomRef.current = val;
                      setZoom(val);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-1"
                  />
                </div>
              </div>
            </div>

            {/* RICIS theta Warping */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  {t('Регуляризация RICIS θ', 'RICIS Regularization θ')}
                  <span className="text-[9px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.2 rounded font-mono">III</span>
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">{ricisTheta.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.4"
                step="0.005"
                value={ricisTheta}
                onChange={e => setRicisTheta(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 leading-normal">
                {t('Искажает классическую плоскость волновым квантовым полем.', 'Warps the classical plane geometry through non-linear wave interaction.')}
              </p>
            </div>

            {/* Iterations control */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">{t('Глубина итераций', 'Max Iterations')}</span>
                <span className="text-xs font-mono text-slate-300 font-bold">{maxIterations}</span>
              </div>
              <input
                type="range"
                min="30"
                max="500"
                step="10"
                value={maxIterations}
                onChange={e => setMaxIterations(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Adaptive Shaders (Grid Size) control */}
            <div className="space-y-2 border-t border-white/5 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  {t('Количество шейдеров', 'Shader Count Grid')}
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {GRID_SIZES[gridSizeIndex]?.value}x{GRID_SIZES[gridSizeIndex]?.value}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={GRID_SIZES.length - 1}
                step="1"
                value={gridSizeIndex}
                onChange={e => setGridSizeIndex(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <p className="text-[11px] font-medium text-slate-300 leading-snug">
                {GRID_SIZES[gridSizeIndex]?.label}
              </p>
              <p className="text-[10px] text-slate-500 leading-normal">
                {GRID_SIZES[gridSizeIndex]?.desc}
              </p>
            </div>

            {/* Color Scheme Picker */}
            <div className="space-y-2">
              <span className="text-xs text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-slate-400" />
                {t('Цветовая гамма', 'Color Scheme')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['classic', 'psychedelic', 'rainbow', 'monochrome', 'fire', 'cosmic'] as const).map(scheme => (
                  <button
                    key={scheme}
                    onClick={() => setColorScheme(scheme)}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded text-left capitalize cursor-pointer border ${
                      colorScheme === scheme 
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-bold' 
                        : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
                    }`}
                  >
                    {t(
                      scheme === 'classic' ? 'Классика' :
                      scheme === 'psychedelic' ? 'Психоделика' :
                      scheme === 'rainbow' ? 'Радуга' :
                      scheme === 'monochrome' ? 'Монохром' :
                      scheme === 'fire' ? 'Огонь' : 'Космос',
                      scheme
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Continuous Coloring toggle */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs text-slate-300">{t('Гладкое сглаживание цветов', 'Smooth Coloring')}</span>
              <button
                onClick={() => setSmoothColoring(!smoothColoring)}
                className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider select-none cursor-pointer ${
                  smoothColoring 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'bg-white/5 text-slate-500 border border-transparent'
                }`}
              >
                {smoothColoring ? t('ВКЛ', 'ON') : t('ВЫКЛ', 'OFF')}
              </button>
            </div>

            {/* Vector Export config and execute */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>{t('Сетка вектора SVG', 'SVG Export Quality')}</span>
                <span className="font-mono text-cyan-300 font-bold">{svgResolution}x{svgResolution}</span>
              </div>
              <input
                type="range"
                min="60"
                max="240"
                step="20"
                value={svgResolution}
                onChange={e => setSvgResolution(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              
              <button
                onClick={handleExportSvg}
                disabled={isExporting}
                className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition bg-cyan-500 text-black hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 select-none cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t('ВЫЧИСЛЕНИЕ ВЕКТОРА...', 'COMPUTING VECTOR...')}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>{t('ЭКСПОРТ В SVG ВЕКТОР', 'EXPORT TO SVG VECTOR')}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Dynamic Formula & Share Link Center */}
      <div className="bg-[#121214] border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <h3 className="text-xs font-bold font-sans tracking-wider text-slate-200 flex items-center gap-2">
            <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" />
            {t('МАТЕМАТИЧЕСКАЯ ФОРМУЛА И ИНТЕГРАЦИЯ', 'MATHEMATICAL FORMULA & INTEGRATION')}
          </h3>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/5">
            RICIS III Regularized
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Formula Display */}
          <div className="lg:col-span-7 bg-black/40 border border-white/5 rounded-lg p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                {juliaMode ? t('Рекуррентное уравнение множества Джулии', 'Julia Set Recurrence Relation') : t('Рекуррентное уравнение множества Мандельброта', 'Mandelbrot Set Recurrence Relation')}
              </span>
              
              <div className="py-4 px-3 bg-[#070709] border border-white/5 rounded font-mono text-xs text-center text-white/90 select-all overflow-x-auto min-h-[56px] flex items-center justify-center">
                {juliaMode ? (
                  ricisTheta > 0 ? (
                    <div>
                      <span>z<sub>n+1</sub> = z<sub>n</sub>² + ({juliaX >= 0 ? '+' : ''}{juliaX.toFixed(5)} {juliaY >= 0 ? '+' : ''}{juliaY.toFixed(5)}i)</span>
                      <span className="text-cyan-400 block mt-1 text-[10px]">+ {ricisTheta.toFixed(3)} · 0.08 · (sin(2·Re(z<sub>n</sub>)) + i·cos(2·Im(z<sub>n</sub>)))</span>
                    </div>
                  ) : (
                    <span>z<sub>n+1</sub> = z<sub>n</sub>² + ({juliaX >= 0 ? '+' : ''}{juliaX.toFixed(5)} {juliaY >= 0 ? '+' : ''}{juliaY.toFixed(5)}i)</span>
                  )
                ) : (
                  ricisTheta > 0 ? (
                    <div>
                      <span>z<sub>n+1</sub> = z<sub>n</sub>² + c</span>
                      <span className="text-cyan-400 block mt-1 text-[10px]">+ {ricisTheta.toFixed(3)} · 0.08 · (sin(2·Re(z<sub>n</sub>)) + i·cos(2·Im(z<sub>n</sub>)))</span>
                    </div>
                  ) : (
                    <span>z<sub>n+1</sub> = z<sub>n</sub>² + c</span>
                  )
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
              <p className="text-[10px] text-slate-500 leading-tight pr-4">
                {ricisTheta > 0 
                  ? t('Формула содержит член регуляризации RICIS III θ для сглаживания и предотвращения коллапса траекторий.', 'Formula incorporates the RICIS III θ regularization term to smooth and prevent orbit collapse.')
                  : t('Классическое фрактальное уравнение без дополнительных внешних возмущений.', 'Classical fractal equation with no external perturbation terms.')}
              </p>
              <button
                onClick={() => {
                  const cStr = `${juliaX >= 0 ? '+' : ''}${juliaX.toFixed(5)} ${juliaY >= 0 ? '+' : ''}${juliaY.toFixed(5)}i`;
                  const formulaText = juliaMode 
                    ? (ricisTheta > 0 ? `z_{n+1} = z_n² + (${cStr}) + ${ricisTheta.toFixed(3)} * 0.08 * (sin(2*Re(z_n)) + i*cos(2*Im(z_n)))` : `z_{n+1} = z_n² + (${cStr})`)
                    : (ricisTheta > 0 ? `z_{n+1} = z_n² + c + ${ricisTheta.toFixed(3)} * 0.08 * (sin(2*Re(z_n)) + i*cos(2*Im(z_n)))` : `z_{n+1} = z_n² + c`);
                  
                  navigator.clipboard.writeText(formulaText).then(() => {
                    setFormulaCopied(true);
                    setTimeout(() => setFormulaCopied(false), 2000);
                  });
                }}
                className="px-3 py-1.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {formulaCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('СКОПИРОВАНО', 'COPIED')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('СКОПИРОВАТЬ', 'COPY')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share link and telemetry coordinates */}
          <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-lg p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block">
                {t('Ссылка для обмена параметрами', 'Shareable Parameter Link')}
              </span>
              <p className="text-[10px] text-slate-500 leading-normal">
                {t('Скопируйте эту ссылку, чтобы передать точное состояние фрактала (координаты, масштаб, палитру и параметр θ) другому пользователю.', 'Copy this link to transmit the precise fractal state (coordinates, zoom, palette and θ parameter) to another user.')}
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${window.location.pathname}?mode=MANDELBROT&state=${encodeURIComponent(JSON.stringify({
                  centerX,
                  centerY,
                  zoom,
                  maxIterations,
                  colorScheme,
                  smoothColoring,
                  juliaMode,
                  juliaX,
                  juliaY,
                  ricisTheta
                }))}`}
                className="flex-1 bg-[#070709] border border-white/5 rounded px-2.5 py-1.5 text-[9px] font-mono text-slate-400 focus:outline-none select-all truncate"
              />
              <button
                onClick={() => {
                  const stateObj = {
                    centerX,
                    centerY,
                    zoom,
                    maxIterations,
                    colorScheme,
                    smoothColoring,
                    juliaMode,
                    juliaX,
                    juliaY,
                    ricisTheta
                  };
                  const url = `${window.location.origin}${window.location.pathname}?mode=MANDELBROT&state=${encodeURIComponent(JSON.stringify(stateObj))}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
                className="px-3 rounded bg-cyan-500 text-black hover:bg-cyan-400 text-[10px] font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('ГОТОВО', 'DONE')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('ССЫЛКА', 'LINK')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Micro-telemetry block */}
            <div className="bg-[#070709] border border-white/5 rounded p-2 text-[9px] font-mono space-y-0.5 text-slate-500">
              <div className="flex justify-between">
                <span>CENTER_X:</span>
                <span className="text-slate-300 font-semibold">{centerX.toFixed(14)}</span>
              </div>
              <div className="flex justify-between">
                <span>CENTER_Y:</span>
                <span className="text-slate-300 font-semibold">{centerY.toFixed(14)}</span>
              </div>
              <div className="flex justify-between">
                <span>ZOOM_LVL:</span>
                <span className="text-slate-300 font-semibold">{(2.5 / zoom).toFixed(3)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-configured Case-Study Benchmarks */}
      <div className="bg-[#121214] border border-white/5 rounded-xl p-5">
        <h3 className="text-xs font-bold font-sans tracking-wider text-slate-200 mb-4 flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          {t('НАУЧНЫЕ КООРДИНАТЫ И АНОМАЛИИ', 'SCIENTIFIC COORDINATE MAPS')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookmarks.map((b, idx) => (
            <button
              key={idx}
              onClick={() => applyBookmark(b)}
              className="p-3 rounded-lg bg-black/40 border border-white/5 hover:border-cyan-500/40 text-left transition group hover:bg-[#151518] cursor-pointer"
            >
              <div className="font-bold text-xs text-cyan-300 group-hover:text-cyan-200 truncate">{b.name}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">{b.desc}</div>
              <div className="mt-2.5 flex items-center justify-between text-[8px] font-mono text-slate-400">
                <span>{b.state.juliaMode ? 'Julia set' : 'Mandelbrot'}</span>
                <span>θ = {b.state.ricisTheta}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SVG Export Output Modal Code Viewer */}
      {showSvgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121214] border border-white/10 rounded-xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-cyan-500/10 text-cyan-400 rounded">
                  <Download className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{t('Векторный файл SVG готов', 'Vector SVG Generated')}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {t(
                      `Адаптированный векторный фрактал разрешения ${svgResolution}x${svgResolution}`,
                      `Adaptive vector fractal rendered on a ${svgResolution}x${svgResolution} density grid`
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSvgModal(false)}
                className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded cursor-pointer transition select-none"
              >
                {t('ЗАКРЫТЬ', 'CLOSE')}
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SVG Visual Thumbnail */}
                <div className="border border-white/5 rounded-lg bg-black p-3 flex flex-col items-center justify-center min-h-[220px]">
                  <div 
                    dangerouslySetInnerHTML={{ __html: generatedSvg }} 
                    className="w-full max-w-[200px] aspect-square overflow-hidden"
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-2">Vector Vectorization Preview</span>
                </div>

                {/* SVG Source code */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-slate-400 uppercase">SVG XML Source</span>
                  <textarea
                    readOnly
                    value={generatedSvg}
                    className="flex-1 w-full p-2.5 rounded bg-black border border-white/5 font-mono text-[9px] text-slate-300 min-h-[200px] resize-none focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-4 bg-black/40 border-t border-white/5 flex items-center justify-end gap-2">
              <button
                onClick={copySvgText}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 flex items-center gap-1.5 cursor-pointer select-none"
              >
                {svgCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('СКОПИРОВАНО', 'COPIED')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('СКОПИРОВАТЬ КОД', 'COPY SOURCE')}</span>
                  </>
                )}
              </button>
              <button
                onClick={downloadSvgFile}
                className="px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider transition bg-cyan-500 text-black hover:bg-cyan-400 flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('СКАЧАТЬ ФАЙЛ', 'DOWNLOAD FILE')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
