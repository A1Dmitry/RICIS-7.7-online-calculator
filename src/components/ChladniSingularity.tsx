/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChladniState } from '../types';
import { 
  Play, Pause, RotateCcw, Sliders, Waves, HelpCircle, 
  Settings, Info, Shield, Radio, Volume2, Sparkles, Award,
  Copy, Check, Bookmark, Trash2, Plus, Download, Cpu
} from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  color: string;
}

interface VoynichPreset {
  name: string;
  desc: string;
  freq: number;
  n1: number;
  m1: number;
  n2: number;
  m2: number;
  phi: number;
  ratioBA: number;
}

interface SavedChladniFigure {
  id: string;
  name: string;
  activePackage: 1 | 2 | 3 | 4;
  state: ChladniState;
  timestamp: number;
}

const voynichPresets: VoynichPreset[] = [
  {
    name: 'Растительный Стебель',
    desc: 'Folio 9v - Переплетенные растительные узоры',
    freq: 380,
    n1: 3,
    m1: 2,
    n2: 5,
    m2: 3,
    phi: Math.PI / 4,
    ratioBA: 0.7
  },
  {
    name: 'Звездный Вортекс',
    desc: 'Folio 68r - Кружащаяся схема звездного неба',
    freq: 840,
    n1: 4,
    m1: 1,
    n2: 6,
    m2: 2,
    phi: Math.PI / 3,
    ratioBA: 0.8
  },
  {
    name: 'Космический Диск',
    desc: 'Folio 86v - Девятисекционный зодиакальный круг',
    freq: 1120,
    n1: 5,
    m1: 2,
    n2: 2,
    m2: 4,
    phi: Math.PI / 6,
    ratioBA: 0.65
  },
  {
    name: 'Вязь Корней',
    desc: 'Folio 33v - Спиралевидные ризомы и корни растений',
    freq: 580,
    n1: 2,
    m1: 3,
    n2: 4,
    m2: 3,
    phi: Math.PI / 5,
    ratioBA: 0.75
  }
];

interface ChladniSingularityProps {
  preset?: any;
}

export default function ChladniSingularity({ preset }: ChladniSingularityProps = {}) {
  const [state, setState] = useState<ChladniState>({
    plateType: 'circle',
    attachmentPoint: 'center',
    customX: 0.5,
    customY: 0.5,
    thickness: 1.5,
    size: 350,
    sandType: 'fine',
    frequency: 440,
    dutyCycle: 0.5,
    signalType: 'sine',
    n1: 3,
    m1: 2,
    n2: 5,
    m2: 4,
    phi: Math.PI / 4,
    ratioBA: 0.7,
    damping: 0.02,
    regularization: 0.1,
    time: 0
  });

  const [activePackage, setActivePackage] = useState<1 | 2 | 3 | 4>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showMath, setShowMath] = useState<boolean>(true);
  const [autoModes, setAutoModes] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'text' | 'latex' | null>(null);
  const [savedFigures, setSavedFigures] = useState<SavedChladniFigure[]>([]);
  const [newFigureName, setNewFigureName] = useState<string>('');
  const [copiedFigureId, setCopiedFigureId] = useState<string | null>(null);
  const [useShader, setUseShader] = useState<boolean>(true);
  const [webglSupported, setWebglSupported] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const webglRef = useRef<any>(null);

  // Apply preset safely
  useEffect(() => {
    if (preset) {
      if (preset.activePackage !== undefined) {
        setActivePackage(preset.activePackage);
      }
      setState(prev => ({
        ...prev,
        ...preset
      }));
    }
  }, [preset]);

  // Accurate Bessel roots
  const getBesselRoot = (n: number, m: number): number => {
    const roots: Record<number, number[]> = {
      0: [2.4048, 5.5201, 8.6537, 11.7915, 14.9309],
      1: [3.8317, 7.0156, 10.1735, 13.3237, 16.4706],
      2: [5.1356, 8.4172, 11.6198, 14.7960, 17.9598],
      3: [6.3802, 9.7610, 13.0152, 16.2235, 19.4094],
      4: [7.5883, 11.0647, 14.3725, 17.6160, 20.8269],
      5: [8.7715, 12.3386, 15.7002, 18.9801, 22.2178],
      6: [9.9361, 13.5893, 17.0038, 20.3208, 23.5861],
    };
    const list = roots[Math.floor(n)];
    if (list && list[m - 1]) {
      return list[m - 1];
    }
    return Math.PI * (m + n / 2 - 0.25);
  };

  const initWebGL = (width: number, height: number) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;

      const glContext = gl as WebGLRenderingContext;

      // Vertex Shader
      const vsSource = `
        attribute vec2 position;
        varying vec2 v_texCoord;
        void main() {
          v_texCoord = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      // Fragment Shader
      const fsSource = `
        precision mediump float;
        varying vec2 v_texCoord;

        uniform int u_activePackage;
        uniform int u_plateType; // 0 for circle, 1 for square
        uniform float u_n1;
        uniform float u_m1;
        uniform float u_n2;
        uniform float u_m2;
        uniform float u_freq;
        uniform float u_phi;
        uniform float u_ratioBA;
        uniform float u_damping;
        uniform float u_regularization;
        uniform float u_thickness;
        uniform float u_time;
        uniform float u_besselRoot1;
        uniform float u_besselRoot2;
        uniform float u_besselRoot3;
        uniform float u_n3;
        uniform float u_m3;

        const float PI = 3.14159265359;

        float besselJ(float n, float x) {
          if (x == 0.0) {
            return (n == 0.0) ? 1.0 : 0.0;
          }
          float sum = 0.0;
          for (int i = 0; i <= 16; i++) {
            float t = (float(i) * PI) / 16.0;
            float term = cos(n * t - x * sin(t));
            if (i == 0 || i == 16) {
              sum += term * 0.5;
            } else {
              sum += term;
            }
          }
          return sum / 16.0;
        }

        float psiCircle(float n, float m, float r, float theta, float freq, float root) {
          float scale = sqrt(freq / max(root * root * (u_thickness / 1.5) * 4.62, 0.001));
          if (root == 0.0) scale = 1.0;
          return besselJ(n, root * scale * r) * cos(n * theta);
        }

        float psiSquare(float n, float m, float x, float y, float freq) {
          float rootSq = n*n + m*m;
          float refFreq = 33.84 * rootSq * (u_thickness / 1.5);
          float scale = sqrt(freq / max(refFreq, 0.001));
          
          float kx = n * PI * scale;
          float ky = m * PI * scale;
          
          return cos(kx * x) * cos(ky * y) + cos(ky * x) * cos(kx * y);
        }

        void main() {
          vec2 p = v_texCoord * 2.0 - 1.0;
          float r = length(p);
          
          float theta = atan(p.y, p.x + (p.x >= 0.0 ? 1.0 : -1.0) * u_regularization * 0.0001);
          
          if (u_plateType == 0 && r > 1.0) {
            discard;
          }
          
          float val = 0.0;
          
          if (u_activePackage == 1) {
            val = psiCircle(u_n1, u_m1, min(r, 1.0), theta, u_freq, u_besselRoot1);
          } 
          else if (u_activePackage == 2) {
            float modeA = psiCircle(u_n1, u_m1, min(r, 1.0), theta, u_freq, u_besselRoot1);
            float modeB = psiCircle(u_n2, u_m2, min(r, 1.0), theta + u_phi, u_freq, u_besselRoot2);
            val = modeA + u_ratioBA * modeB;
          } 
          else if (u_activePackage == 3) {
            float w0_1 = (u_plateType == 0)
              ? 4.62 * u_besselRoot1 * u_besselRoot1 * (u_thickness / 1.5)
              : 33.84 * (u_n1 * u_n1 + u_m1 * u_m1) * (u_thickness / 1.5);
              
            float w0_2 = (u_plateType == 0)
              ? 4.62 * u_besselRoot2 * u_besselRoot2 * (u_thickness / 1.5)
              : 33.84 * (u_n2 * u_n2 + u_m2 * u_m2) * (u_thickness / 1.5);
              
            float w0_3 = (u_plateType == 0)
              ? 4.62 * u_besselRoot3 * u_besselRoot3 * (u_thickness / 1.5)
              : 33.84 * (u_n3 * u_n3 + u_m3 * u_m3) * (u_thickness / 1.5);
              
            // Mode 1
            float beta1 = u_freq / w0_1;
            float diff1 = 1.0 - beta1 * beta1;
            float dampTerm1 = 2.0 * u_damping * beta1;
            float denom1 = sqrt(diff1 * diff1 + dampTerm1 * dampTerm1 + u_regularization * 0.1 + 0.001);
            float delta1 = atan(dampTerm1, diff1 + u_regularization * 0.05);
            float timeFactor1 = sin(u_freq * 0.01 * u_time - delta1);
            float modeShape1 = (u_plateType == 0)
              ? psiCircle(u_n1, u_m1, min(r, 1.0), theta, u_freq, u_besselRoot1)
              : psiSquare(u_n1, u_m1, p.x, p.y, u_freq);
            float thicknessFilter1 = exp(-0.03 * u_thickness * (w0_1 / 1000.0));
            float weight1 = thicknessFilter1 / denom1;
            
            // Mode 2
            float beta2 = u_freq / w0_2;
            float diff2 = 1.0 - beta2 * beta2;
            float dampTerm2 = 2.0 * u_damping * beta2;
            float denom2 = sqrt(diff2 * diff2 + dampTerm2 * dampTerm2 + u_regularization * 0.1 + 0.001);
            float delta2 = atan(dampTerm2, diff2 + u_regularization * 0.05);
            float timeFactor2 = sin(u_freq * 0.01 * u_time - delta2);
            float modeShape2 = (u_plateType == 0)
              ? psiCircle(u_n2, u_m2, min(r, 1.0), theta + u_phi, u_freq, u_besselRoot2)
              : psiSquare(u_n2, u_m2, p.x, p.y, u_freq);
            float thicknessFilter2 = exp(-0.03 * u_thickness * (w0_2 / 1000.0));
            float weight2 = (u_ratioBA * thicknessFilter2) / denom2;
            
            // Mode 3
            float beta3 = u_freq / w0_3;
            float diff3 = 1.0 - beta3 * beta3;
            float dampTerm3 = 2.0 * u_damping * beta3;
            float denom3 = sqrt(diff3 * diff3 + dampTerm3 * dampTerm3 + u_regularization * 0.1 + 0.001);
            float delta3 = atan(dampTerm3, diff3 + u_regularization * 0.05);
            float timeFactor3 = sin(u_freq * 0.01 * u_time - delta3);
            float modeShape3 = (u_plateType == 0)
              ? psiCircle(u_n3, u_m3, min(r, 1.0), theta + u_phi, u_freq, u_besselRoot3)
              : psiSquare(u_n3, u_m3, p.x, p.y, u_freq);
            float thicknessFilter3 = exp(-0.03 * u_thickness * (w0_3 / 1000.0));
            float weight3 = (0.5 * u_ratioBA * thicknessFilter3) / denom3;
            
            float totalWeight = weight1 + weight2 + weight3;
            float sumVal = weight1 * timeFactor1 * modeShape1 + weight2 * timeFactor2 * modeShape2 + weight3 * timeFactor3 * modeShape3;
            
            if (totalWeight > 0.01) {
              val = (sumVal / totalWeight) * 1.5;
            }
          } 
          else if (u_activePackage == 4) {
            float alpha = u_phi * 4.0;
            float xPrime = p.x * cos(alpha * r) - p.y * sin(alpha * r);
            float yPrime = p.x * sin(alpha * r) + p.y * cos(alpha * r);
            val = psiSquare(u_n1, u_m1, xPrime, yPrime, u_freq);
          }
          
          float tol = 0.022;
          float distToZero = abs(val);
          
          float isolineGlow = smoothstep(tol, 0.0, distToZero);
          
          float bgGlow = (1.0 - r) * 0.35;
          vec4 glowColor = vec4(8.0/255.0, 47.0/255.0, 73.0/255.0, 0.2) * bgGlow;
          
          vec4 isolineColor = vec4(245.0/255.0, 158.0/255.0, 11.0/255.0, 0.45) * isolineGlow;
          
          float waveAmpGlow = abs(val) * 0.15 * (1.0 - r);
          vec4 waveColor = vec4(34.0/255.0, 211.0/255.0, 238.0/255.0, 1.0) * waveAmpGlow;
          
          gl_FragColor = glowColor + waveColor + isolineColor;
          if (u_plateType == 0) {
            float boundaryFade = smoothstep(1.0, 0.98, r);
            gl_FragColor *= boundaryFade;
          }
        }
      `;

      // Compile Shaders
      const compileShader = (source: string, type: number) => {
        const shader = glContext.createShader(type);
        if (!shader) return null;
        glContext.shaderSource(shader, source);
        glContext.compileShader(shader);
        if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
          console.error('Shader compilation error:', glContext.getShaderInfoLog(shader));
          glContext.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(vsSource, glContext.VERTEX_SHADER);
      const fs = compileShader(fsSource, glContext.FRAGMENT_SHADER);
      if (!vs || !fs) return null;

      const program = glContext.createProgram();
      if (!program) return null;
      glContext.attachShader(program, vs);
      glContext.attachShader(program, fs);
      glContext.linkProgram(program);

      if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
        console.error('Program linking error:', glContext.getProgramInfoLog(program));
        return null;
      }

      glContext.useProgram(program);

      // Vertices for full-screen quad
      const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]);

      const buffer = glContext.createBuffer();
      glContext.bindBuffer(glContext.ARRAY_BUFFER, buffer);
      glContext.bufferData(glContext.ARRAY_BUFFER, vertices, glContext.STATIC_DRAW);

      const positionLocation = glContext.getAttribLocation(program, 'position');
      glContext.enableVertexAttribArray(positionLocation);
      glContext.vertexAttribPointer(positionLocation, 2, glContext.FLOAT, false, 0, 0);

      // Get uniform locations
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const uniformNames = [
        'u_activePackage', 'u_plateType', 'u_n1', 'u_m1', 'u_n2', 'u_m2',
        'u_freq', 'u_phi', 'u_ratioBA', 'u_damping', 'u_regularization',
        'u_thickness', 'u_time', 'u_besselRoot1', 'u_besselRoot2', 'u_besselRoot3',
        'u_n3', 'u_m3'
      ];

      uniformNames.forEach(name => {
        uniforms[name] = glContext.getUniformLocation(program, name);
      });

      return { canvas, gl: glContext, program, uniforms };
    } catch (e) {
      console.error('Failed to initialize WebGL offscreen renderer:', e);
      return null;
    }
  };

  const generateFormulaText = (pId: number, s: ChladniState): string => {
    if (pId === 1) {
      const besselVal = getBesselRoot(s.n1, s.m1).toFixed(4);
      return `Ψ(r, θ, t) = J_${s.n1}(${besselVal} · r) · cos(${s.n1} · θ) · sin(${(s.frequency * 0.01).toFixed(2)} · t)`;
    }
    if (pId === 2) {
      const bessel1 = getBesselRoot(s.n1, s.m1).toFixed(4);
      const bessel2 = getBesselRoot(s.n2, s.m2).toFixed(4);
      return `W(r, θ, t) = 1.00 · J_${s.n1}(${bessel1} · r) · cos(${s.n1} · θ) · sin(${(s.frequency * 0.01).toFixed(2)} · t) + ${s.ratioBA.toFixed(2)} · J_${s.n2}(${bessel2} · r) · cos(${s.n2} · (θ + ${s.phi.toFixed(2)})) · sin(${(s.frequency * 0.01).toFixed(2)} · t)`;
    }
    if (pId === 3) {
      const bessel1 = getBesselRoot(s.n1, s.m1).toFixed(4);
      const bessel2 = getBesselRoot(s.n2, s.m2).toFixed(4);
      const damp = s.damping.toFixed(3);
      const reg = s.regularization.toFixed(4);
      return `U(r, θ, t) = [ sin(${(s.frequency * 0.01).toFixed(2)}·t - δ1)·J_${s.n1}(${bessel1}·r)·cos(${s.n1}·θ) + ${s.ratioBA.toFixed(2)}·sin(${(s.frequency * 0.01).toFixed(2)}·t - δ2)·J_${s.n2}(${bessel2}·r)·cos(${s.n2}·(θ + ${s.phi.toFixed(2)})) ] / √((1 - (f/f0)² )² + (2·${damp}·(f/f0))² + ${reg}² + 0.001)`;
    }
    // pId === 4
    const alpha = (s.regularization * 3.5).toFixed(2);
    return `S(x, y, t) = [ cos(${s.n1}·π·x')·cos(${s.m1}·π·y') + cos(${s.m1}·π·x')·cos(${s.n1}·π·y') ] · sin(${(s.frequency * 0.01).toFixed(2)}·t)\nгде x' = x·cos(${alpha}·r) - y·sin(${alpha}·r), y' = x·sin(${alpha}·r) + y·cos(${alpha}·r)`;
  };

  const generateFormulaLaTeX = (pId: number, s: ChladniState): string => {
    if (pId === 1) {
      const besselVal = getBesselRoot(s.n1, s.m1).toFixed(4);
      return `\\Psi(r, \\theta, t) = J_{${s.n1}}(${besselVal} \\cdot r) \\cdot \\cos(${s.n1} \\theta) \\cdot \\sin(${(s.frequency * 0.01).toFixed(2)} t)`;
    }
    if (pId === 2) {
      const bessel1 = getBesselRoot(s.n1, s.m1).toFixed(4);
      const bessel2 = getBesselRoot(s.n2, s.m2).toFixed(4);
      return `W(r, \\theta, t) = 1.00 \\cdot J_{${s.n1}}(${bessel1} \\cdot r) \\cos(${s.n1} \\theta) \\sin(${(s.frequency * 0.01).toFixed(2)} t) + ${s.ratioBA.toFixed(2)} \\cdot J_{${s.n2}}(${bessel2} \\cdot r) \\cos(${s.n2} (\\theta + ${s.phi.toFixed(2)})) \\sin(${(s.frequency * 0.01).toFixed(2)} t)`;
    }
    if (pId === 3) {
      const bessel1 = getBesselRoot(s.n1, s.m1).toFixed(4);
      const bessel2 = getBesselRoot(s.n2, s.m2).toFixed(4);
      const damp = s.damping.toFixed(3);
      const reg = s.regularization.toFixed(4);
      return `U(r, \\theta, t) = \\frac{\\sin(\\omega t - \\delta_1) J_{${s.n1}}(${bessel1} r) \\cos(${s.n1} \\theta) + ${s.ratioBA.toFixed(2)} \\sin(\\omega t - \\delta_2) J_{${s.n2}}(${bessel2} r) \\cos(${s.n2} (\\theta + ${s.phi.toFixed(2)}))}{\\sqrt{(1 - \\beta^2)^2 + (2 \\cdot ${damp} \\cdot \\beta)^2 + ${reg}^2 + 0.001)}`;
    }
    // pId === 4
    const alpha = (s.regularization * 3.5).toFixed(2);
    return `S(x, y, t) = \\left[ \\cos(${s.n1} \\pi x') \\cos(${s.m1} \\pi y') + \\cos(${s.m1} \\pi x') \\cos(${s.n1} \\pi y') \\right] \\cdot \\sin(${(s.frequency * 0.01).toFixed(2)} t)\\\\ \\text{где } x' = x\\cos(${alpha} r) - y\\sin(${alpha} r), \\ y' = x\\sin(${alpha} r) + y\\cos(${alpha} r)`;
  };

  const getFormulaText = (): string => generateFormulaText(activePackage, state);
  const getFormulaLaTeX = (): string => generateFormulaLaTeX(activePackage, state);

  // Load saved figures from localStorage or fall back to default showcases on mount
  useEffect(() => {
    const defaultSavedFigures: SavedChladniFigure[] = [
      {
        id: 'default-voynich',
        name: '«Спираль Войнича»',
        activePackage: 2,
        timestamp: Date.now() - 3000,
        state: {
          plateType: 'circle',
          attachmentPoint: 'center',
          customX: 0.5,
          customY: 0.5,
          thickness: 1.2,
          size: 300,
          sandType: 'colored',
          frequency: 785,
          dutyCycle: 0.5,
          signalType: 'sine',
          n1: 3,
          m1: 2,
          n2: 5,
          m2: 4,
          phi: 0.785,
          ratioBA: 0.7,
          damping: 0.02,
          regularization: 0.08,
          time: 0
        }
      },
      {
        id: 'default-star',
        name: '«Фрактальная Звезда»',
        activePackage: 3,
        timestamp: Date.now() - 2000,
        state: {
          plateType: 'circle',
          attachmentPoint: 'center',
          customX: 0.5,
          customY: 0.5,
          thickness: 1.6,
          size: 300,
          sandType: 'colored',
          frequency: 1450,
          dutyCycle: 0.5,
          signalType: 'sine',
          n1: 4,
          m1: 3,
          n2: 5,
          m2: 4,
          phi: 0.5,
          ratioBA: 0.8,
          damping: 0.015,
          regularization: 0.06,
          time: 0
        }
      },
      {
        id: 'default-vortex',
        name: '«Космический Вихрь»',
        activePackage: 4,
        timestamp: Date.now() - 1000,
        state: {
          plateType: 'square',
          attachmentPoint: 'center',
          customX: 0.5,
          customY: 0.5,
          thickness: 1.5,
          size: 300,
          sandType: 'colored',
          frequency: 1100,
          dutyCycle: 0.5,
          signalType: 'sine',
          n1: 5,
          m1: 5,
          n2: 2,
          m2: 2,
          phi: 0.0,
          ratioBA: 1.0,
          damping: 0.02,
          regularization: 0.14,
          time: 0
        }
      }
    ];

    try {
      const stored = localStorage.getItem('ricis_chladni_saved_v3');
      if (stored) {
        setSavedFigures(JSON.parse(stored));
      } else {
        setSavedFigures(defaultSavedFigures);
        localStorage.setItem('ricis_chladni_saved_v3', JSON.stringify(defaultSavedFigures));
      }
    } catch (e) {
      setSavedFigures(defaultSavedFigures);
    }
  }, []);

  // WebGL offscreen renderer initialization
  useEffect(() => {
    const glHelper = initWebGL(512, 512);
    if (glHelper) {
      webglRef.current = glHelper;
      setWebglSupported(true);
      setUseShader(true); // Default to WebGL shader-based rendering
    } else {
      console.warn('WebGL not supported, falling back to 2D Canvas CPU rendering.');
      setWebglSupported(false);
      setUseShader(false);
    }
    return () => {
      if (webglRef.current) {
        try {
          const { gl, program } = webglRef.current;
          gl.deleteProgram(program);
        } catch (e) {
          console.error('Error clean up WebGL program:', e);
        }
      }
    };
  }, []);

  const handleSaveFigure = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nameToUse = newFigureName.trim() || `Фигура ${state.frequency}Гц [${state.n1},${state.m1}]`;
    const newFig: SavedChladniFigure = {
      id: 'fig-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: nameToUse,
      activePackage,
      state: { ...state },
      timestamp: Date.now()
    };
    const updated = [newFig, ...savedFigures];
    setSavedFigures(updated);
    try {
      localStorage.setItem('ricis_chladni_saved_v3', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    setNewFigureName('');
  };

  const handleLoadFigure = (fig: SavedChladniFigure) => {
    setActivePackage(fig.activePackage);
    setState({ ...fig.state });
    setTimeout(() => {
      initParticles();
    }, 50);
  };

  const handleDeleteFigure = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFigures.filter(f => f.id !== id);
    setSavedFigures(updated);
    try {
      localStorage.setItem('ricis_chladni_saved_v3', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyFigureFormula = (fig: SavedChladniFigure, e: React.MouseEvent) => {
    e.stopPropagation();
    const formulaText = generateFormulaText(fig.activePackage, fig.state);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formulaText).then(() => {
        setCopiedFigureId(fig.id);
        setTimeout(() => setCopiedFigureId(null), 2000);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = formulaText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedFigureId(fig.id);
        setTimeout(() => setCopiedFigureId(null), 2000);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = formulaText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedFigureId(fig.id);
      setTimeout(() => setCopiedFigureId(null), 2000);
    }
  };

  const handleCopy = (text: string, type: 'text' | 'latex') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedType(type);
        setTimeout(() => setCopiedType(null), 2000);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const downloadSVG = () => {
    const size = 500;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.45;

    let svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <style>
    .bg { fill: #050507; }
    .grid { stroke: rgba(255, 255, 255, 0.05); stroke-width: 0.5; }
    .plate { stroke: rgba(34, 211, 238, 0.3); stroke-width: 2; fill: none; }
    .isoline { fill: rgba(245, 158, 11, 0.35); }
    .particle { opacity: 0.8; }
  </style>
  <rect width="${size}" height="${size}" class="bg" />
  
  <!-- Coordinate Grid -->
`;

    // Add grid lines
    for (let i = 0; i < size; i += 40) {
      svgContent += `  <line x1="${i}" y1="0" x2="${i}" y2="${size}" class="grid" />\n`;
      svgContent += `  <line x1="0" y1="${i}" x2="${size}" y2="${i}" class="grid" />\n`;
    }

    // Add plate boundary
    if (state.plateType === 'circle') {
      svgContent += `  <circle cx="${cx}" cy="${cy}" r="${R}" class="plate" />\n`;
    } else {
      svgContent += `  <rect x="${cx - R}" y="${cy - R}" width="${R * 2}" height="${R * 2}" class="plate" />\n`;
    }

    // Draw some zero potential isolines
    svgContent += `  <!-- Zero Potential Isolines -->\n`;
    const stepSize = 8;
    for (let sx = -R; sx <= R; sx += stepSize) {
      for (let sy = -R; sy <= R; sy += stepSize) {
        const normX = sx / R;
        const normY = sy / R;
        if (state.plateType === 'circle' && normX*normX + normY*normY > 1.0) continue;

        const fVal = evaluateField(normX, normY, state.time || 0);
        const tol = 0.02;
        if (Math.abs(fVal) < tol) {
          svgContent += `  <rect x="${cx + sx - 1}" y="${cy + sy - 1}" width="2" height="2" class="isoline" />\n`;
        }
      }
    }

    // Draw particles
    svgContent += `  <!-- Particles -->\n`;
    const rParticle = state.sandType === 'fine' ? 1.0 : 1.8;
    particlesRef.current.forEach(p => {
      const px = cx + p.x * R;
      const py = cy + p.y * R;
      svgContent += `  <circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${rParticle}" fill="${p.color}" class="particle" />\n`;
    });

    // Include formula and scientific metadata
    const formulaText = generateFormulaText(activePackage, state).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    svgContent += `\n  <!-- Scientific Metadata
      RICIS III Chladni Resonance Pattern
      Frequency: ${state.frequency} Hz
      Formula: ${formulaText}
    -->\n`;

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chladni_ricis_${state.plateType}_${state.frequency}hz.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fast numerical integration for J_n(x)
  const besselJ = (n: number, x: number): number => {
    if (x === 0) return n === 0 ? 1 : 0;
    let sum = 0;
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = (i * Math.PI) / steps;
      const term = Math.cos(n * t - x * Math.sin(t));
      if (i === 0 || i === steps) {
        sum += term * 0.5;
      } else {
        sum += term;
      }
    }
    return sum / steps;
  };

  // Base circular mode
  const psiCircle = (n: number, m: number, r: number, theta: number, freq: number): number => {
    const root = getBesselRoot(n, m);
    
    // Check if current parameters match any Voynich preset
    const activePreset = voynichPresets.find(p => 
      p.n1 === state.n1 && 
      p.m1 === state.m1 && 
      p.n2 === state.n2 && 
      p.m2 === state.m2
    );
    
    // Use matching preset frequency as reference, otherwise fall back to natural resonant frequency
    const refFreq = activePreset 
      ? activePreset.freq 
      : (4.62 * root * root * (state.thickness / 1.5));
      
    const scale = Math.sqrt(freq / (refFreq || 1));
    return besselJ(n, root * scale * r) * Math.cos(n * theta);
  };

  // Base square mode
  const psiSquare = (n: number, m: number, x: number, y: number, freq: number): number => {
    const rootSq = n*n + m*m;
    const refFreq = 33.84 * rootSq * (state.thickness / 1.5);
    const scale = Math.sqrt(freq / (refFreq || 1));
    
    const kx = n * Math.PI * scale;
    const ky = m * Math.PI * scale;
    
    return Math.cos(kx * x) * Math.cos(ky * y) + 
           Math.cos(ky * x) * Math.cos(kx * y);
  };

  // Apply attachment point damping (clamping removed by user request)
  const getAttachmentDamping = (x: number, y: number): number => {
    return 1.0;
  };

  // Main field evaluator based on active package and coordinates in [-1, 1]
  const evaluateField = (x: number, y: number, t: number): number => {
    // Polar coordinates
    const r = Math.sqrt(x * x + y * y);
    // Atan2 singularity regularized by RICIS parameter
    const theta = Math.atan2(y, x + (x >= 0 ? 1 : -1) * state.regularization * 0.0001);

    let val = 0;

    // Pure sine wave harmonics (1.0 weight at fundamental frequency)
    const harmonics = [{ fMult: 1, w: 1.0 }];

    if (activePackage === 1) {
      // Circular Base Wave Field
      const raw = psiCircle(state.n1, state.m1, Math.min(r, 1.0), theta, state.frequency);
      val = raw;
    } 
    else if (activePackage === 2) {
      // Superposition (Voynich spirals)
      const modeA = psiCircle(state.n1, state.m1, Math.min(r, 1.0), theta, state.frequency);
      const modeB = psiCircle(state.n2, state.m2, Math.min(r, 1.0), theta + state.phi, state.frequency);
      val = modeA + state.ratioBA * modeB;
    } 
    else if (activePackage === 3) {
      // Multifrequency Resonance with Damping & RICIS regularization
      // Dynamic modes based on state.n1, m1, n2, m2, thickness, and plateType
      const w0_1 = state.plateType === 'circle' 
        ? 4.62 * getBesselRoot(state.n1, state.m1) * getBesselRoot(state.n1, state.m1) * (state.thickness / 1.5)
        : 33.84 * (state.n1 * state.n1 + state.m1 * state.m1) * (state.thickness / 1.5);
        
      const w0_2 = state.plateType === 'circle' 
        ? 4.62 * getBesselRoot(state.n2, state.m2) * getBesselRoot(state.n2, state.m2) * (state.thickness / 1.5)
        : 33.84 * (state.n2 * state.n2 + state.m2 * state.m2) * (state.thickness / 1.5);

      const n3 = (state.n1 + state.n2) % 6 || 2;
      const m3 = (state.m1 + state.m2) % 5 || 1;
      const w0_3 = state.plateType === 'circle'
        ? 4.62 * getBesselRoot(n3, m3) * getBesselRoot(n3, m3) * (state.thickness / 1.5)
        : 33.84 * (n3 * n3 + m3 * m3) * (state.thickness / 1.5);

      const modes = [
        { n: state.n1, m: state.m1, w0: w0_1, amp: 1.0 },
        { n: state.n2, m: state.m2, w0: w0_2, amp: state.ratioBA },
        { n: n3, m: m3, w0: w0_3, amp: 0.5 * state.ratioBA }
      ];

      let totalWeight = 0;
      harmonics.forEach(harm => {
        const currentFreq = state.frequency * harm.fMult;
        modes.forEach(m => {
          // Dimensionless relative frequency ratio beta = f / f0
          const beta = currentFreq / (m.w0 || 1);
          const diff = 1 - beta * beta;
          const dampTerm = 2 * state.damping * beta;
          
          // Singular denominator resolved using RICIS regularization
          const ricisThetaSq = state.regularization * 0.1;
          const denom = Math.sqrt(diff * diff + dampTerm * dampTerm + ricisThetaSq + 0.001);

          // Standard phase shift with spatial phase offset (phi) applied to secondary modes
          const phiOffset = m.n === state.n1 ? 0 : state.phi;
          const delta = Math.atan2(dampTerm, diff + state.regularization * 0.05);
          const timeFactor = Math.sin(currentFreq * 0.01 * t - delta);

          const modeShape = state.plateType === 'circle' 
            ? psiCircle(m.n, m.m, Math.min(r, 1.0), theta + phiOffset, currentFreq)
            : psiSquare(m.n, m.m, x, y, currentFreq);

          // Thickness filter (high frequency suppression)
          const thicknessFilter = Math.exp(-0.03 * state.thickness * (m.w0 / 1000));
          const weight = (m.amp * thicknessFilter) / denom;
          
          totalWeight += harm.w * weight;
          val += harm.w * weight * timeFactor * modeShape;
        });
      });

      // Normalize val by total active weights to preserve stable pattern geometry
      if (totalWeight > 0.01) {
        val = (val / totalWeight) * 1.5;
      }
    } 
    else if (activePackage === 4) {
      // Square with Radial Twist Distortion
      const alpha = state.phi * 4.0; // Twist intensity from phase parameter
      const rDist = Math.sqrt(x*x + y*y);
      const xPrime = x * Math.cos(alpha * rDist) - y * Math.sin(alpha * rDist);
      const yPrime = x * Math.sin(alpha * rDist) + y * Math.cos(alpha * rDist);
      val = psiSquare(state.n1, state.m1, xPrime, yPrime, state.frequency);
    }

    // Apply attachment damping
    val *= getAttachmentDamping(x, y);

    return val;
  };

  // Re-initialize particles
  const initParticles = () => {
    const count = state.sandType === 'fine' ? 10000 : state.sandType === 'coarse' ? 5000 : 8000;
    const particles: Particle[] = [];
    
    // Choose colors based on sand type
    const colors = {
      fine: ['#ffffff', '#e2e8f0', '#cbd5e1', '#22d3ee'],
      coarse: ['#475569', '#334155', '#1e293b', '#0f172a'],
      colored: ['#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#3b82f6']
    };
    const activeColors = colors[state.sandType];

    for (let i = 0; i < count; i++) {
      let px = 0, py = 0;
      if (state.plateType === 'circle') {
        const pr = Math.sqrt(Math.random());
        const pa = Math.random() * Math.PI * 2;
        px = pr * Math.cos(pa);
        py = pr * Math.sin(pa);
      } else {
        px = Math.random() * 2 - 1;
        py = Math.random() * 2 - 1;
      }
      particles.push({
        x: px,
        y: py,
        color: activeColors[Math.floor(Math.random() * activeColors.length)]
      });
    }
    particlesRef.current = particles;
  };

  // Handle frequency and dynamically update mode shapes based on physical eigenvalues
  const handleFrequencyChange = (freq: number) => {
    const nextFreq = Math.max(10, Math.min(20000, freq));
    
    if (autoModes) {
      // Logarithmic projection of 10 Hz - 20000 Hz into wave complexity indices
      const minF = 10;
      const maxF = 20000;
      const x = Math.log10(nextFreq / minF) / Math.log10(maxF / minF);
      const clampedX = Math.max(0, Math.min(1, x));

      // Map x to integers
      const n1 = Math.min(6, Math.max(0, Math.floor(clampedX * 7))); // 0 to 6
      const m1 = Math.min(5, Math.max(1, Math.floor(clampedX * 5) + 1)); // 1 to 5
      const n2 = Math.min(6, Math.max(0, Math.floor(clampedX * 6) + 1)); // 1 to 6
      const m2 = Math.min(5, Math.max(1, Math.floor(clampedX * 4) + 1)); // 1 to 5

      setState(prev => ({
        ...prev,
        frequency: nextFreq,
        n1,
        m1,
        n2,
        m2
      }));
    } else {
      setState(prev => ({
        ...prev,
        frequency: nextFreq
      }));
    }
  };

  // Handle parameters update safely
  useEffect(() => {
    initParticles();
  }, [state.plateType, state.sandType, activePackage, preset]);

  // Main animation / simulation loop
  useEffect(() => {
    let lastTime = 0;
    let tCount = 0;

    const tick = (timestamp: number) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (isPlaying) {
        tCount += 0.1;
      }

      // Clear with elegant manuscript/blueprints layout
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw Plate Boundary
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.lineWidth = 2;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const R = canvas.width * 0.45;

      if (state.plateType === 'circle') {
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
      } else {
        ctx.rect(cx - R, cy - R, R * 2, R * 2);
      }
      ctx.stroke();

      // Draw manuscript background glow
      const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
      grad.addColorStop(0, 'rgba(8, 47, 73, 0.2)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.fillStyle = grad;
      if (state.plateType === 'circle') {
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      }

      // Render the offscreen WebGL shader background if possible
      let webglRendered = false;
      if (useShader && webglRef.current) {
        try {
          const { gl, program, uniforms, canvas: webglCanvas } = webglRef.current;
          gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
          gl.useProgram(program);

          // Find Bessel roots to pass as uniforms
          const r1 = getBesselRoot(state.n1, state.m1);
          const r2 = getBesselRoot(state.n2, state.m2);
          
          const n3 = (state.n1 + state.n2) % 6 || 2;
          const m3 = (state.m1 + state.m2) % 5 || 1;
          const r3 = getBesselRoot(n3, m3);

          // Set uniforms
          gl.uniform1i(uniforms['u_activePackage'], activePackage);
          gl.uniform1i(uniforms['u_plateType'], state.plateType === 'circle' ? 0 : 1);
          gl.uniform1f(uniforms['u_n1'], state.n1);
          gl.uniform1f(uniforms['u_m1'], state.m1);
          gl.uniform1f(uniforms['u_n2'], state.n2);
          gl.uniform1f(uniforms['u_m2'], state.m2);
          gl.uniform1f(uniforms['u_freq'], state.frequency);
          gl.uniform1f(uniforms['u_phi'], state.phi);
          gl.uniform1f(uniforms['u_ratioBA'], state.ratioBA);
          gl.uniform1f(uniforms['u_damping'], state.damping);
          gl.uniform1f(uniforms['u_regularization'], state.regularization);
          gl.uniform1f(uniforms['u_thickness'], state.thickness);
          gl.uniform1f(uniforms['u_time'], tCount);
          gl.uniform1f(uniforms['u_besselRoot1'], r1);
          gl.uniform1f(uniforms['u_besselRoot2'], r2);
          gl.uniform1f(uniforms['u_besselRoot3'], r3);
          gl.uniform1f(uniforms['u_n3'], n3);
          gl.uniform1f(uniforms['u_m3'], m3);

          // Draw quad
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          // Draw WebGL canvas content onto our 2D canvas at the plate area!
          ctx.drawImage(webglCanvas, cx - R, cy - R, R * 2, R * 2);
          webglRendered = true;
        } catch (e) {
          console.error('WebGL draw error, falling back to 2D canvas:', e);
          webglRendered = false;
        }
      }

      if (!webglRendered) {
        // Draw manuscript scribes / isolines first ("визуализируй изолинии нулевого потенциала тонкими штрихами чернил")
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)'; // Sepia/ink ink-like lines
        const stepSize = 4;
        for (let sx = -R; sx <= R; sx += stepSize) {
          for (let sy = -R; sy <= R; sy += stepSize) {
            const normX = sx / R;
            const normY = sy / R;
            if (state.plateType === 'circle' && normX*normX + normY*normY > 1.0) continue;

            const fVal = evaluateField(normX, normY, tCount);
            // Zero potential line check with small tolerance
            const tol = 0.015;
            if (Math.abs(fVal) < tol) {
              ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
              ctx.fillRect(cx + sx, cy + sy, 1.5, 1.5);
            }
          }
        }
      }

      // Update and draw particles
      const particles = particlesRef.current;
      const speed = 0.04;
      const noise = 0.004 * (state.frequency / 1000 + 0.1) * (1 / (state.thickness + 0.5));

      particles.forEach(p => {
        if (isPlaying) {
          // Evaluate field value
          const val = evaluateField(p.x, p.y, tCount);

          // Finite difference to compute gradient
          const delta = 0.01;
          const valX1 = evaluateField(p.x + delta, p.y, tCount);
          const valX2 = evaluateField(p.x - delta, p.y, tCount);
          const valY1 = evaluateField(p.x, p.y + delta, tCount);
          const valY2 = evaluateField(p.x, p.y - delta, tCount);

          const gradX = (valX1 * valX1 - valX2 * valX2) / (2 * delta);
          const gradY = (valY1 * valY1 - valY2 * valY2) / (2 * delta);

          // Drift towards nodes (gradient descent of amplitude)
          p.x -= gradX * speed * (2.0 / (state.thickness + 0.1));
          p.y -= gradY * speed * (2.0 / (state.thickness + 0.1));

          // Thermal vibration/noise
          p.x += (Math.random() - 0.5) * noise;
          p.y += (Math.random() - 0.5) * noise;

          // Keep within boundaries
          if (state.plateType === 'circle') {
            const dist = Math.sqrt(p.x*p.x + p.y*p.y);
            if (dist > 0.99) {
              p.x = (p.x / dist) * 0.98;
              p.y = (p.y / dist) * 0.98;
            }
          } else {
            p.x = Math.max(-0.99, Math.min(0.99, p.x));
            p.y = Math.max(-0.99, Math.min(0.99, p.y));
          }
        }

        // Draw particle
        const pxCanvas = cx + p.x * R;
        const pyCanvas = cy + p.y * R;
        ctx.fillStyle = p.color;
        ctx.fillRect(pxCanvas, pyCanvas, state.sandType === 'fine' ? 1.2 : 2.0, state.sandType === 'fine' ? 1.2 : 2.0);
      });

      // Draw clamped attachment point is removed by user request

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, state, activePackage, useShader]);

  const applyVoynichPreset = (preset: VoynichPreset) => {
    setState(prev => ({
      ...prev,
      frequency: preset.freq,
      n1: preset.n1,
      m1: preset.m1,
      n2: preset.n2,
      m2: preset.m2,
      phi: preset.phi,
      ratioBA: preset.ratioBA,
      plateType: 'circle'
    }));
    setTimeout(() => {
      initParticles();
    }, 50);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Simulation Workspace & Screen (8 cols) */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-purple-500/10 h-[1.5px]" />
          
          <div className="w-full flex items-center justify-between mb-3 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              Chladni Resonance Field Simulator [RICIS III Core]
            </span>
            <div className="flex items-center gap-3">
              <span>ACTIVE MODEL: PACKAGE {activePackage}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isPlaying ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' : 'bg-red-950/50 text-red-400 border border-red-800/50'}`}>
                {isPlaying ? 'RUNNING' : 'PAUSED'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-stretch relative">
            {/* Vertical Frequency Controller (Left Side) */}
            <div className="flex flex-row sm:flex-col items-center justify-between bg-black/40 border border-white/5 rounded-lg p-2 w-full sm:w-20 select-none shrink-0 gap-2 sm:gap-0">
              <div className="text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                Freq (Hz)
              </div>

              {/* Vertical slider wrapper */}
              <div className="hidden sm:flex flex-1 flex-col items-center justify-center relative w-full my-2 min-h-[180px]">
                <input
                  type="range"
                  min="10"
                  max="20000"
                  step="1"
                  value={state.frequency}
                  onChange={(e) => handleFrequencyChange(parseInt(e.target.value))}
                  style={{
                    WebkitAppearance: 'slider-vertical',
                    height: '180px',
                    width: '8px'
                  }}
                  className="accent-cyan-400 cursor-ns-resize h-full"
                />
              </div>

              {/* Mobile horizontal slider as fallback */}
              <div className="flex sm:hidden flex-1 px-1">
                <input
                  type="range"
                  min="10"
                  max="20000"
                  step="1"
                  value={state.frequency}
                  onChange={(e) => handleFrequencyChange(parseInt(e.target.value))}
                  className="accent-cyan-400 cursor-ew-resize w-full"
                />
              </div>

              {/* Frequency display box */}
              <div className="text-center font-mono text-[11px] text-cyan-400 font-bold sm:my-2 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-800/30 min-w-[55px] sm:w-full truncate">
                {state.frequency} Hz
              </div>

              {/* Delicate Fine Tuning Section */}
              <div className="flex sm:flex-col gap-1 items-center sm:w-full sm:space-y-1.5 sm:mt-1 sm:pt-2 sm:border-t sm:border-white/5 text-center">
                <span className="hidden sm:block text-[8px] font-mono text-slate-500 uppercase tracking-wider">Подстройка</span>
                
                <div className="flex gap-1 justify-center">
                  <button 
                    onClick={() => handleFrequencyChange(state.frequency - 1)}
                    className="w-7 sm:w-8 py-0.5 sm:py-1 bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded text-[9px] font-mono transition border border-white/5 cursor-pointer"
                    title="-1 Hz"
                  >
                    -1
                  </button>
                  <button 
                    onClick={() => handleFrequencyChange(state.frequency + 1)}
                    className="w-7 sm:w-8 py-0.5 sm:py-1 bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded text-[9px] font-mono transition border border-white/5 cursor-pointer"
                    title="+1 Hz"
                  >
                    +1
                  </button>
                </div>

                <div className="flex gap-1 justify-center">
                  <button 
                    onClick={() => handleFrequencyChange(state.frequency - 10)}
                    className="w-7 sm:w-8 py-0.5 sm:py-1 bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded text-[9px] font-mono transition border border-white/5 cursor-pointer"
                    title="-10 Hz"
                  >
                    -10
                  </button>
                  <button 
                    onClick={() => handleFrequencyChange(state.frequency + 10)}
                    className="w-7 sm:w-8 py-0.5 sm:py-1 bg-white/5 hover:bg-white/10 active:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 rounded text-[9px] font-mono transition border border-white/5 cursor-pointer"
                    title="+10 Hz"
                  >
                    +10
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas and its overlays */}
            <div className="relative flex-1 flex items-center justify-center">
              <canvas 
                ref={canvasRef} 
                width={450} 
                height={450}
                className="rounded-lg border border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.03)] bg-[#050507] w-full max-w-[450px] aspect-square"
              />
              
              {/* Visual labels overlay */}
              <div className="absolute bottom-3 left-3 bg-black/80 border border-white/5 p-2 rounded text-[10px] font-mono text-slate-400 space-y-0.5 pointer-events-none select-none">
                <div>• Частота: {state.frequency} Hz</div>
                <div>• Регуляризатор (θ): {state.regularization.toFixed(3)}</div>
                <div>• Коэф. затухания (γ): {state.damping}</div>
              </div>
            </div>

            {/* Right Side Vertical Controllers (Widescreen) / Horizontal (Mobile) */}
            <div className="flex flex-col sm:flex-row items-stretch justify-center bg-black/40 border border-white/5 rounded-lg p-3 w-full sm:w-auto select-none shrink-0 gap-4 sm:gap-4 min-w-0">
              {/* Thickness (h) */}
              <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 flex-1 sm:w-14">
                <div className="text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider font-semibold truncate sm:w-full" title="Толщина пластины (h)">
                  h (мм)
                </div>
                {/* Widescreen Vertical Slider */}
                <div className="hidden sm:flex flex-1 flex-col items-center justify-center relative w-full my-1 min-h-[160px]">
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.1"
                    value={state.thickness}
                    onChange={(e) => setState(prev => ({ ...prev, thickness: parseFloat(e.target.value) }))}
                    style={{
                      WebkitAppearance: 'slider-vertical',
                      height: '160px',
                      width: '6px'
                    }}
                    className="accent-cyan-400 cursor-ns-resize h-full"
                  />
                </div>
                {/* Mobile Horizontal Slider */}
                <div className="flex sm:hidden flex-1 px-1 w-full">
                  <input
                    type="range"
                    min="0.5"
                    max="8.0"
                    step="0.1"
                    value={state.thickness}
                    onChange={(e) => setState(prev => ({ ...prev, thickness: parseFloat(e.target.value) }))}
                    className="accent-cyan-400 cursor-ew-resize w-full"
                  />
                </div>
                <div className="text-center font-mono text-[10px] text-cyan-300 font-bold bg-cyan-950/30 px-1 py-0.5 rounded border border-cyan-800/30 min-w-[45px] sm:w-full truncate">
                  {state.thickness.toFixed(1)}
                </div>
              </div>

              {/* Phase / Twist */}
              <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 flex-1 sm:w-14">
                <div className="text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider font-semibold truncate sm:w-full" title={activePackage === 4 ? "Угол скручивания (α)" : "Сдвиг фазы (φ)"}>
                  {activePackage === 4 ? 'α (Twist)' : 'φ (Phase)'}
                </div>
                {/* Widescreen Vertical Slider */}
                <div className="hidden sm:flex flex-1 flex-col items-center justify-center relative w-full my-1 min-h-[160px]">
                  <input
                    type="range"
                    min="0"
                    max={Math.PI * 2}
                    step="0.05"
                    value={state.phi}
                    onChange={(e) => setState(prev => ({ ...prev, phi: parseFloat(e.target.value) }))}
                    style={{
                      WebkitAppearance: 'slider-vertical',
                      height: '160px',
                      width: '6px'
                    }}
                    className="accent-cyan-400 cursor-ns-resize h-full"
                  />
                </div>
                {/* Mobile Horizontal Slider */}
                <div className="flex sm:hidden flex-1 px-1 w-full">
                  <input
                    type="range"
                    min="0"
                    max={Math.PI * 2}
                    step="0.05"
                    value={state.phi}
                    onChange={(e) => setState(prev => ({ ...prev, phi: parseFloat(e.target.value) }))}
                    className="accent-cyan-400 cursor-ew-resize w-full"
                  />
                </div>
                <div className="text-center font-mono text-[10px] text-cyan-300 font-bold bg-cyan-950/30 px-1 py-0.5 rounded border border-cyan-800/30 min-w-[45px] sm:w-full truncate">
                  {(state.phi / Math.PI).toFixed(1)}π
                </div>
              </div>

              {/* RICIS Regularization (θ) */}
              <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 flex-1 sm:w-14">
                <div className="text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider font-semibold truncate sm:w-full" title="Регуляризатор RICIS (θ)">
                  θ (RICIS)
                </div>
                {/* Widescreen Vertical Slider */}
                <div className="hidden sm:flex flex-1 flex-col items-center justify-center relative w-full my-1 min-h-[160px]">
                  <input
                    type="range"
                    min="0.000"
                    max="0.500"
                    step="0.005"
                    value={state.regularization}
                    onChange={(e) => setState(prev => ({ ...prev, regularization: parseFloat(e.target.value) }))}
                    style={{
                      WebkitAppearance: 'slider-vertical',
                      height: '160px',
                      width: '6px'
                    }}
                    className="accent-cyan-400 cursor-ns-resize h-full"
                  />
                </div>
                {/* Mobile Horizontal Slider */}
                <div className="flex sm:hidden flex-1 px-1 w-full">
                  <input
                    type="range"
                    min="0.000"
                    max="0.500"
                    step="0.005"
                    value={state.regularization}
                    onChange={(e) => setState(prev => ({ ...prev, regularization: parseFloat(e.target.value) }))}
                    className="accent-cyan-400 cursor-ew-resize w-full"
                  />
                </div>
                <div className="text-center font-mono text-[10px] text-cyan-300 font-bold bg-cyan-950/30 px-1 py-0.5 rounded border border-cyan-800/30 min-w-[45px] sm:w-full truncate">
                  {state.regularization.toFixed(2)}
                </div>
              </div>

              {/* B/A (if package 2 or 3 is active) */}
              {(activePackage === 2 || activePackage === 3) && (
                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 flex-1 sm:w-14">
                  <div className="text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider font-semibold truncate sm:w-full" title="Асимметрия мод B/A">
                    B/A
                  </div>
                  {/* Widescreen Vertical Slider */}
                  <div className="hidden sm:flex flex-1 flex-col items-center justify-center relative w-full my-1 min-h-[160px]">
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.05"
                      value={state.ratioBA}
                      onChange={(e) => setState(prev => ({ ...prev, ratioBA: parseFloat(e.target.value) }))}
                      style={{
                        WebkitAppearance: 'slider-vertical',
                        height: '160px',
                        width: '6px'
                      }}
                      className="accent-cyan-400 cursor-ns-resize h-full"
                    />
                  </div>
                  {/* Mobile Horizontal Slider */}
                  <div className="flex sm:hidden flex-1 px-1 w-full">
                    <input
                      type="range"
                      min="0.1"
                      max="2.0"
                      step="0.05"
                      value={state.ratioBA}
                      onChange={(e) => setState(prev => ({ ...prev, ratioBA: parseFloat(e.target.value) }))}
                      className="accent-cyan-400 cursor-ew-resize w-full"
                    />
                  </div>
                  <div className="text-center font-mono text-[10px] text-cyan-300 font-bold bg-cyan-950/30 px-1 py-0.5 rounded border border-cyan-800/30 min-w-[45px] sm:w-full truncate">
                    {state.ratioBA.toFixed(1)}
                  </div>
                </div>
              )}

              {/* Gamma (if package 3 is active) */}
              {activePackage === 3 && (
                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-1.5 flex-1 sm:w-14">
                  <div className="text-center font-mono text-[9px] text-slate-400 uppercase tracking-wider font-semibold truncate sm:w-full" title="Коэффициент затухания (γ)">
                    γ (Damp)
                  </div>
                  {/* Widescreen Vertical Slider */}
                  <div className="hidden sm:flex flex-1 flex-col items-center justify-center relative w-full my-1 min-h-[160px]">
                    <input
                      type="range"
                      min="0.005"
                      max="0.05"
                      step="0.001"
                      value={state.damping}
                      onChange={(e) => setState(prev => ({ ...prev, damping: parseFloat(e.target.value) }))}
                      style={{
                        WebkitAppearance: 'slider-vertical',
                        height: '160px',
                        width: '6px'
                      }}
                      className="accent-cyan-400 cursor-ns-resize h-full"
                    />
                  </div>
                  {/* Mobile Horizontal Slider */}
                  <div className="flex sm:hidden flex-1 px-1 w-full">
                    <input
                      type="range"
                      min="0.005"
                      max="0.05"
                      step="0.001"
                      value={state.damping}
                      onChange={(e) => setState(prev => ({ ...prev, damping: parseFloat(e.target.value) }))}
                      className="accent-cyan-400 cursor-ew-resize w-full"
                    />
                  </div>
                  <div className="text-center font-mono text-[10px] text-cyan-300 font-bold bg-cyan-950/30 px-1 py-0.5 rounded border border-cyan-800/30 min-w-[45px] sm:w-full truncate">
                    {state.damping.toFixed(3)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full flex items-center justify-between mt-4 border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition ${
                  isPlaying 
                    ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:border-amber-400' 
                    : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Пауза' : 'Запуск'}</span>
              </button>
              
              <button
                onClick={initParticles}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 rounded text-xs font-mono uppercase tracking-wider transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Рассыпать песок</span>
              </button>

              <button
                onClick={() => setUseShader(!useShader)}
                disabled={!webglSupported}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition ${
                  useShader 
                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400' 
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200'
                }`}
                title={webglSupported ? "Включить/выключить сверхбыструю отрисовку волнового поля шейдерами WebGL" : "Шейдерная отрисовка не поддерживается в вашем браузере"}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{useShader ? 'Шейдеры' : 'ЦПУ'}</span>
              </button>

              <button
                onClick={downloadSVG}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:border-purple-400 rounded text-xs font-mono uppercase tracking-wider transition"
                title="Скачать векторный график SVG для научных публикаций"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать SVG</span>
              </button>
            </div>

            <button
              onClick={() => setShowMath(!showMath)}
              className="text-xs font-mono text-slate-500 hover:text-cyan-400 flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showMath ? 'Скрыть теорию' : 'Показать формулы'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Formula Display based on Packages */}
        {showMath && (
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Математический аппарат пакета {activePackage}
              </span>
              <span className="text-[10px] font-mono text-slate-500">РЕГУЛЯРИЗАЦИЯ ОСОБЕННОСТЕЙ</span>
            </div>

            {activePackage === 1 && (
              <div className="text-xs text-slate-400 space-y-2 font-mono">
                <p><strong>Базовое волновое поле круга:</strong></p>
                <div className="bg-black/30 p-2 rounded border border-white/5 text-center text-cyan-300 text-sm py-3">
                  Ψ_n,m(r, θ) = J_n(λ_n,m · r) · cos(n θ)
                </div>
                <p className="text-[11px] leading-relaxed">
                  Где J_n — функция Бесселя 1-го рода, λ_n,m — m-й корень функции Бесселя. В центре диска при r → 0 или при расчете угла θ = atan2(y, x) возникает риск деления на ноль. В RICIS III полярный угол регуляризируется добавлением параметра θ.
                </p>
              </div>
            )}

            {activePackage === 2 && (
              <div className="text-xs text-slate-400 space-y-2 font-mono">
                <p><strong>Суперпозиция со сдвигом фаз (Эффект спиралей Войнича):</strong></p>
                <div className="bg-black/30 p-2 rounded border border-white/5 text-center text-cyan-300 text-sm py-3">
                  W(r, θ) = A · Ψ_n1,m1(r, θ) + B · Ψ_n2,m2(r, θ + φ)
                </div>
                <p className="text-[11px] leading-relaxed">
                  Смешивает две моды с пространственным сдвигом φ для нарушения жесткой симметрии и образования закрученных спиральных стеблей. Золотое сечение B/A ≈ 0.707 придает природную асимметрию.
                </p>
              </div>
            )}

            {activePackage === 3 && (
              <div className="text-xs text-slate-400 space-y-2 font-mono">
                <p><strong>Мультичастотный резонанс с затуханием (Фрактальная структура):</strong></p>
                <div className="bg-black/30 p-2.5 rounded border border-white/5 text-center text-cyan-300 text-[11px] py-3 overflow-x-auto">
                  U(x, y) = Σ [ sin(ω·t - δ_i) / √( (ω² - ω_i²)² + (γ·ω)² + θ² ) ] · Ψ_i(x, y)
                </div>
                <p className="text-[11px] leading-relaxed">
                  При совпадении возбуждающей частоты с собственной модой (ω → ω_i) и отсутствии затухания (γ → 0), знаменатель обращается в ноль (сингулярность). 
                  <strong> Регуляризатор RICIS θ²</strong> в знаменателе гарантирует стабильность и конечность амплитуды при резонансе.
                </p>
              </div>
            )}

            {activePackage === 4 && (
              <div className="text-xs text-slate-400 space-y-2 font-mono">
                <p><strong>Модификация для квадрата с радиальным искажением:</strong></p>
                <div className="bg-black/30 p-2.5 rounded border border-white/5 text-[11px] space-y-1 text-cyan-300">
                  <div>S_n,m(x, y) = cos(n π x) cos(m π y) + cos(m π x) cos(n π y)</div>
                  <div>x' = x · cos(α · r) - y · sin(α · r) | y' = x · sin(α · r) + y · cos(α · r)</div>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Радиальное скручивание пространства с интенсивностью α превращает классические линии Хладни в удивительные псевдо-космические орбиты и завихрения.
                </p>
              </div>
            )}

            {/* Copyable Formula Block */}
            <div className="pt-3.5 border-t border-white/5 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Текущая волновая функция (со всеми параметрами):</span>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <div className="flex-1 bg-cyan-950/20 border border-cyan-500/10 rounded px-2.5 py-2 font-mono text-[10px] text-cyan-400 overflow-x-auto select-all whitespace-pre leading-relaxed">
                  {getFormulaText()}
                </div>
                <div className="flex sm:flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(getFormulaText(), 'text')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[9px] font-mono uppercase bg-slate-900 border border-white/10 rounded text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  >
                    {copiedType === 'text' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>Текст</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(getFormulaLaTeX(), 'latex')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[9px] font-mono uppercase bg-slate-900 border border-white/10 rounded text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  >
                    {copiedType === 'latex' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>LaTeX</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Preset Packages */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-white font-mono text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Выбор физического пакета
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 1, title: 'Пакет 1. Полярные волны круга', desc: 'Симметричные радиальные лучи и концентрические диски' },
              { id: 2, title: 'Пакет 2. Спирали Войнича', desc: 'Суперпозиция двух полярных мод со сдвигом фазы φ' },
              { id: 3, title: 'Пакет 3. Мультичастотный резонанс', desc: 'Фрактальный «живой» отклик с регуляризацией полюса' },
              { id: 4, title: 'Пакет 4. Искаженный квадрат', desc: 'Вортексное скручивание координатной сетки квадрата' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setActivePackage(p.id as any);
                  if (p.id === 4) {
                    setState(prev => ({ ...prev, plateType: 'square' }));
                  } else if (p.id === 1 || p.id === 2) {
                    setState(prev => ({ ...prev, plateType: 'circle' }));
                  }
                }}
                className={`w-full text-left p-3 rounded-lg border transition text-xs font-mono cursor-pointer ${
                  activePackage === p.id 
                    ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.05)]' 
                    : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{p.title}</span>
                  {activePackage === p.id && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voynich Presets */}
        {activePackage === 2 && (
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-amber-500/10 pb-2 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Пресеты манускрипта Войнича
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {voynichPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyVoynichPreset(preset)}
                  className="w-full text-left p-2.5 rounded-lg border border-amber-500/10 hover:border-amber-500/40 bg-black/40 hover:bg-amber-950/40 active:bg-amber-950/60 transition text-xs font-mono cursor-pointer"
                >
                  <div className="font-bold text-amber-200 truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{preset.desc}</div>
                  <div className="text-[9px] text-amber-400/80 mt-1 font-mono">
                    Частота: {preset.freq} Hz | Порядок {preset.n1}:{preset.m1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Sliders */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 text-white font-mono text-xs font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              Параметры эксперимента
            </div>
            <span className="text-[9px] text-slate-500">РЕАЛЬНОЕ ВРЕМЯ</span>
          </div>

          <div className="space-y-4">
            {/* Plate Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Форма пластины:</label>
              <div className="flex gap-2">
                {['circle', 'square'].map(t => (
                  <button
                    key={t}
                    onClick={() => setState(prev => ({ ...prev, plateType: t as any }))}
                    className={`flex-1 py-1.5 text-[10px] font-mono uppercase rounded border transition cursor-pointer ${
                      state.plateType === t 
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300' 
                        : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t === 'circle' ? 'Круглая' : 'Квадратная'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sand Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Тип песка (Плотность):</label>
              <div className="flex gap-2">
                {['fine', 'coarse', 'colored'].map(st => (
                  <button
                    key={st}
                    onClick={() => setState(prev => ({ ...prev, sandType: st as any }))}
                    className={`flex-1 py-1.5 text-[9px] font-mono uppercase rounded border transition cursor-pointer ${
                      state.sandType === st 
                        ? 'bg-purple-950/30 border-purple-500/40 text-purple-300' 
                        : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {st === 'fine' ? 'Мелкий' : st === 'coarse' ? 'Крупный' : 'Флуор'}
                  </button>
                ))}
              </div>
            </div>



            {/* Standard Sliders */}
            <div className="space-y-3.5 pt-2 border-t border-white/5">
              {/* Auto Modes Synchronization */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">θ-Синхронизация мод:</span>
                <button
                  type="button"
                  onClick={() => setAutoModes(!autoModes)}
                  className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded border transition cursor-pointer ${
                    autoModes 
                      ? 'bg-cyan-950/30 border-cyan-500/50 text-cyan-300' 
                      : 'bg-black/20 border-white/5 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {autoModes ? 'ВКЛ (Авто)' : 'ВЫКЛ (Фикс)'}
                </button>
              </div>

              {/* Wave modes n1, m1, n2, m2 */}
              {(activePackage === 1 || activePackage === 2 || activePackage === 3 || activePackage === 4) && (
                <div className="grid grid-cols-2 gap-3 bg-black/20 p-2.5 rounded border border-white/5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Порядок n1: {state.n1}</span>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="1"
                      disabled={autoModes}
                      value={state.n1}
                      onChange={(e) => setState(prev => ({ ...prev, n1: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30 accent-cyan-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Корень m1: {state.m1}</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      disabled={autoModes}
                      value={state.m1}
                      onChange={(e) => setState(prev => ({ ...prev, m1: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30 accent-cyan-400"
                    />
                  </div>
                  {(activePackage === 2 || activePackage === 3) && (
                    <>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Порядок n2: {state.n2}</span>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          step="1"
                          disabled={autoModes}
                          value={state.n2}
                          onChange={(e) => setState(prev => ({ ...prev, n2: parseInt(e.target.value) }))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30 accent-cyan-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Корень m2: {state.m2}</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          disabled={autoModes}
                          value={state.m2}
                          onChange={(e) => setState(prev => ({ ...prev, m2: parseInt(e.target.value) }))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-30 accent-cyan-400"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Figures Panel */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase tracking-wider">
              <Bookmark className="w-4 h-4 text-cyan-400" />
              Запомненные фигуры
            </div>
            <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/30 px-2 py-0.5 rounded-full font-bold">
              {savedFigures.length}
            </span>
          </div>

          {/* Save current figure form */}
          <form onSubmit={handleSaveFigure} className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Запомнить текущую конфигурацию:</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Название (например, Спираль ${state.frequency}Гц)`}
                value={newFigureName}
                onChange={(e) => setNewFigureName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                maxLength={40}
              />
              <button
                type="submit"
                className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/30 hover:border-cyan-500 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Запомнить</span>
              </button>
            </div>
          </form>

          {/* List of saved figures */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {savedFigures.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-mono">
                Нет сохраненных фигур. Введите имя выше и сохраните текущую формулу.
              </div>
            ) : (
              savedFigures.map((fig) => {
                const isCopied = copiedFigureId === fig.id;
                const pkgColor = 
                  fig.activePackage === 1 ? 'border-emerald-500/50 bg-emerald-950/5' :
                  fig.activePackage === 2 ? 'border-amber-500/50 bg-amber-950/5' :
                  fig.activePackage === 3 ? 'border-purple-500/50 bg-purple-950/5' :
                  'border-cyan-500/50 bg-cyan-950/5';
                
                const pkgLabelColor = 
                  fig.activePackage === 1 ? 'text-emerald-400 bg-emerald-950/50' :
                  fig.activePackage === 2 ? 'text-amber-400 bg-amber-950/50' :
                  fig.activePackage === 3 ? 'text-purple-400 bg-purple-950/50' :
                  'text-cyan-400 bg-cyan-950/50';

                return (
                  <div
                    key={fig.id}
                    onClick={() => handleLoadFigure(fig)}
                    className={`p-2.5 rounded border border-white/5 border-l-2 ${pkgColor} hover:bg-white/5 transition flex items-center justify-between gap-3 group cursor-pointer`}
                    title="Нажмите, чтобы воспроизвести эту фигуру по формуле"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300 transition">
                          {fig.name}
                        </span>
                        <span className={`text-[8px] font-mono px-1 py-0.5 rounded font-semibold shrink-0 uppercase tracking-widest ${pkgLabelColor}`}>
                          Пакет {fig.activePackage}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono text-slate-400">
                        <span className="bg-white/5 px-1 py-0.5 rounded shrink-0 text-cyan-400 font-bold">{fig.state.frequency} Hz</span>
                        {fig.activePackage === 4 ? (
                          <>
                            <span className="bg-white/5 px-1 py-0.5 rounded shrink-0">n:{fig.state.n1} m:{fig.state.m1}</span>
                            <span className="bg-white/5 px-1 py-0.5 rounded shrink-0">θ:{fig.state.regularization.toFixed(2)}</span>
                          </>
                        ) : (
                          <>
                            <span className="bg-white/5 px-1 py-0.5 rounded shrink-0">n1:{fig.state.n1} m1:{fig.state.m1}</span>
                            {fig.activePackage > 1 && (
                              <>
                                <span className="bg-white/5 px-1 py-0.5 rounded shrink-0">n2:{fig.state.n2} m2:{fig.state.m2}</span>
                                <span className="bg-white/5 px-1 py-0.5 rounded shrink-0">φ:{fig.state.phi.toFixed(2)}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadFigure(fig);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-400 bg-slate-900 border border-white/5 rounded transition cursor-pointer"
                        title="Воспроизвести фигуру"
                      >
                        <Play className="w-3 h-3 fill-cyan-400/20" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleCopyFigureFormula(fig, e)}
                        className="p-1 text-slate-400 hover:text-cyan-400 bg-slate-900 border border-white/5 rounded transition cursor-pointer"
                        title="Скопировать формулу в буфер"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFigure(fig.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 bg-slate-900 border border-white/5 rounded transition cursor-pointer"
                        title="Удалить из списка"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Short Scientific Context card */}
        <div className="p-4 bg-cyan-950/15 border border-cyan-500/10 rounded-xl space-y-2.5">
          <div className="flex items-center gap-2 text-cyan-400">
            <Award className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Физический концепт Chladni-RICIS</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            Эксперимент Хладни демонстрирует стоячие звуковые волны на вибрирующей пластине. В точках механического крепления и в точках резонанса при ω → ω_0 без потерь традиционная механика даёт сингулярные амплитуды (разрыв поля). 
            Метод RICIS III регуляризирует знаменатели и полярные фазовые переходы θ-сдвигом, предотвращая физически невозможные сингулярности и сохраняя целостность волнового монолита.
          </p>
        </div>
      </div>
    </div>
  );
}
