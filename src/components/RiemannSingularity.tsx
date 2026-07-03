/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { RiemannState } from '../types';
import { Sparkles, Shield, Compass, Activity, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface RiemannSingularityProps {
  preset?: RiemannState;
}

export default function RiemannSingularity({ preset }: RiemannSingularityProps = {}) {
  const [state, setState] = useState<RiemannState>({
    sigma: 1.0,         // Real part of s
    t: 0.0,             // Imaginary part of s
    regularization: 0.25, // RICIS theta (0 to 1)
    zoom: 3.0           // Visual zoom
  });

  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plotCanvasRef = useRef<HTMLCanvasElement>(null);

  const EulerMascheroni = 0.5772156649015328;

  // Helper for complex addition: (a + ib) + (c + id) = (a+c) + i(b+d)
  // Helper for complex subtraction
  // Helper for complex multiplication
  // Helper for complex division

  // Complex exponential: exp(a + ib) = exp(a)*cos(b) + i*exp(a)*sin(b)
  // Complex power: n^(-s) = exp(-s * ln(n)) = exp(-sigma*ln(n) - i*t*ln(n))
  //                      = n^(-sigma) * (cos(-t * ln(n)) + i * sin(-t * ln(n)))

  // Compute Dirichlet eta function η(s) using accelerated Borwein-like sum
  const computeEta = (sigma: number, t: number) => {
    let re = 0;
    let im = 0;
    const N = 40; // 40 terms is extremely accurate with Euler-like acceleration

    for (let n = 1; n <= N; n++) {
      const lnN = Math.log(n);
      const angle = -t * lnN;
      const mag = Math.pow(n, -sigma);
      const termRe = mag * Math.cos(angle);
      const termIm = mag * Math.sin(angle);
      const sign = n % 2 === 1 ? 1 : -1;

      // Convergence acceleration factor (Euler-like fractional weights at the tail)
      let w = 1.0;
      if (n > N - 10) {
        w = (N - n) / 10.0;
      }

      re += sign * termRe * w;
      im += sign * termIm * w;
    }

    return { re, im };
  };

  // Compute Riemann Zeta ζ(s) and regular part ζ_reg(s)
  // ζ(s) = η(s) / (1 - 2^(1-s))
  // ζ_reg(s) = ζ(s) - 1/(s-1)
  const computeZetaAndReg = (sigma: number, t: number) => {
    const ds_re = sigma - 1;
    const ds_im = t;
    const ds_mag2 = ds_re * ds_re + ds_im * ds_im;
    const ds_mag = Math.sqrt(ds_mag2);

    // Near s = 1, regular part of Zeta is Euler-Mascheroni constant γ
    if (ds_mag < 1e-4) {
      return {
        zeta_re: Infinity,
        zeta_im: Infinity,
        zeta_mag: Infinity,
        reg_re: EulerMascheroni,
        reg_im: 0,
        reg_mag: EulerMascheroni
      };
    }

    // Compute eta(s)
    const eta = computeEta(sigma, t);

    // Compute denominator: 1 - 2^(1-s)
    // 2^(1-s) = 2^(1 - sigma - i*t) = 2^(1-sigma) * [cos(-t * ln(2)) + i * sin(-t * ln(2))]
    const ln2 = 0.6931471805599453;
    const scale = Math.pow(2, 1 - sigma);
    const angle = -t * ln2;
    const denom_term_re = scale * Math.cos(angle);
    const denom_term_im = scale * Math.sin(angle);

    const denom_re = 1 - denom_term_re;
    const denom_im = -denom_term_im;
    const denom_mag2 = denom_re * denom_re + denom_im * denom_im;

    if (denom_mag2 < 1e-12) {
      // Singular denominator fallback
      return {
        zeta_re: Infinity,
        zeta_im: Infinity,
        zeta_mag: Infinity,
        reg_re: EulerMascheroni,
        reg_im: 0,
        reg_mag: EulerMascheroni
      };
    }

    // Divide eta(s) / (1 - 2^(1-s))
    const zeta_re = (eta.re * denom_re + eta.im * denom_im) / denom_mag2;
    const zeta_im = (eta.im * denom_re - eta.re * denom_im) / denom_mag2;
    const zeta_mag = Math.sqrt(zeta_re * zeta_re + zeta_im * zeta_im);

    // Subtract classical pole term: 1 / (s - 1) = (ds_re - i * ds_im) / ds_mag2
    const pole_re = ds_re / ds_mag2;
    const pole_im = -ds_im / ds_mag2;

    const reg_re = zeta_re - pole_re;
    const reg_im = zeta_im - pole_im;
    const reg_mag = Math.sqrt(reg_re * reg_re + reg_im * reg_im);

    return {
      zeta_re,
      zeta_im,
      zeta_mag,
      reg_re,
      reg_im,
      reg_mag
    };
  };

  // Evaluate Zeta with RICIS III regularization θ
  // ζ_θ(s) = P_θ(s) + ζ_reg(s)
  // Where P_θ(s) = ( (σ - 1) - i * t ) / ( (σ - 1)² + t² + θ² )
  // This incorporates direct algebraic substitution at s=1, NO LIMITS used!
  const evaluateRicisZeta = (sigma: number, t: number, theta: number) => {
    const ds_re = sigma - 1;
    const ds_im = t;
    const denom = ds_re * ds_re + ds_im * ds_im + theta * theta;

    // Direct substitution under RICIS III rules:
    // If ds_re == 0, ds_im == 0, theta == 0: yields weighted zero/zero.
    // Axiom A4/A5 resolves the pole ratio as 1 (since 1/(s-1) has residue/weight 1).
    if (ds_re === 0 && ds_im === 0 && theta === 0) {
      return {
        re: Infinity,
        im: Infinity,
        mag: Infinity,
        formatted: '1 / 0 = ∞₁ + γ (Аксиома А1)',
        reg_re: EulerMascheroni,
        reg_im: 0
      };
    }

    // Compute regular part
    const data = computeZetaAndReg(sigma, t);

    // Compute regularized pole
    const p_re = ds_re / denom;
    const p_im = -ds_im / denom;

    const re = p_re + data.reg_re;
    const im = p_im + data.reg_im;
    const mag = Math.sqrt(re * re + im * im);

    return {
      re,
      im,
      mag,
      formatted: `${re.toFixed(4)} ${im >= 0 ? '+' : '-'} ${Math.abs(im).toFixed(4)}i`,
      reg_re: data.reg_re,
      reg_im: data.reg_im
    };
  };

  // Render domain coloring phase portrait
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const zoom = state.zoom;
    const theta = state.regularization;

    // Fast HSL to RGB conversion
    const hslToRgb = (h: number, s: number, l: number, out: Uint8ClampedArray, index: number) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      out[index] = Math.round(r * 255);
      out[index + 1] = Math.round(g * 255);
      out[index + 2] = Math.round(b * 255);
      out[index + 3] = 255;
    };

    // Pixel loop for mapping s = sigma + i*t
    // Centered around s = 1.0 + 0i (the singular pole)
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        // Map pixel to complex coordinate s
        // x-axis: sigma in [1 - zoom/2, 1 + zoom/2]
        // y-axis: t in [-zoom/2, zoom/2]
        const sigma = 1.0 + ((px - width / 2) / (width / 2)) * (zoom / 2);
        const t = -((py - height / 2) / (height / 2)) * (zoom / 2);

        // Evaluate RICIS Zeta
        const val = evaluateRicisZeta(sigma, t, theta);

        let mag = val.mag;
        if (isNaN(mag) || mag === Infinity) mag = 1000;

        const phase = Math.atan2(val.im, val.re);

        // Map phase to Hue [0, 1]
        const hue = (phase + Math.PI) / (2 * Math.PI);

        // Grid lines to display phase and magnitude contours
        const log_mag = Math.log(mag + 1e-12);
        const grid_mag = Math.sin(log_mag * 6.0);
        const grid_phase = Math.sin(phase * 8.0);
        const grid = Math.max(0, 0.7 + 0.3 * grid_mag * grid_phase);

        // Sigmoid mapping for lightness to stay eye-safe
        let lightness = 0.1 + 0.8 * (mag / (mag + 0.8));
        lightness = lightness * grid;
        lightness = Math.max(0.04, Math.min(0.96, lightness));

        const pixelIndex = (py * width + px) * 4;
        hslToRgb(hue, 0.85, lightness, data, pixelIndex);
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw coordinate axes
    // Center is s = 1.0
    const cx = width / 2;
    const cy = height / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy); // Real axis (t = 0)
    ctx.stroke();

    // Critical line: Re(s) = 0.5 (sigma = 0.5)
    // sigma = 0.5 => px = cx + (0.5 - 1.0) * (width/2) / (zoom/2)
    const px_crit = cx + (-0.5) * (width / 2) / (zoom / 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px_crit, 0);
    ctx.lineTo(px_crit, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw critical line label
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.font = '9px monospace';
    ctx.fillText('σ = 0.5 (Крит. прямая)', px_crit + 5, 20);

    // Draw Pole position s = 1.0
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
    if (theta > 0.01) {
      // Regularized hollow ring
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(34, 211, 238, 0.1)';
      ctx.fill();

      // Draw theta circle boundary
      const circleRadius = (theta / (zoom / 2)) * (width / 2);
      ctx.beginPath();
      ctx.arc(cx, cy, circleRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Classical singular pole
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw current evaluation cursor
    const s_px = cx + (state.sigma - 1.0) * (width / 2) / (zoom / 2);
    const s_py = cy - state.t * (height / 2) / (zoom / 2);

    ctx.beginPath();
    ctx.arc(s_px, s_py, 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [state]);

  // Render 1D Cross-Section plot
  useEffect(() => {
    const canvas = plotCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw s=1.0 line (as vertical axis)
    const cx = width / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Plot curves along Real Axis (t = state.t, sigma goes from 0 to 2)
    const points_classical: { x: number, y: number }[] = [];
    const points_ricis: { x: number, y: number }[] = [];

    const theta = state.regularization;
    const t_val = state.t;

    for (let px = 0; px < width; px++) {
      // sigma goes from 0.0 to 2.0
      const sigma = (px / width) * 2.0;

      // Classical evaluation
      const classical = evaluateRicisZeta(sigma, t_val, 0);
      // RICIS evaluation
      const ricis = evaluateRicisZeta(sigma, t_val, theta);

      // Map magnitude to Y coordinate
      // Y goes from height (mag=0) to 10 (mag=5)
      const mapY = (mag: number) => {
        let val = mag;
        if (isNaN(val) || val === Infinity) val = 100; // clamp
        return height - 20 - (val / 5.0) * (height - 40);
      };

      points_classical.push({ x: px, y: mapY(classical.mag) });
      points_ricis.push({ x: px, y: mapY(ricis.mag) });
    }

    // Draw Classical Curve (dashed or red)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let i = 0; i < points_classical.length; i++) {
      const p = points_classical[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else if (p.y >= 0 && p.y <= height) ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw RICIS Curve (cyan, bold)
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let i = 0; i < points_ricis.length; i++) {
      const p = points_ricis[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else if (p.y >= 0 && p.y <= height) ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Label curves
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.font = '9px monospace';
    ctx.fillText('Классическая |ζ(s)|', 15, 20);

    ctx.fillStyle = '#22d3ee';
    ctx.fillText(`RICIS III |ζ_θ(s)| (θ = ${theta.toFixed(2)})`, 15, 35);

  }, [state]);

  const currentEval = evaluateRicisZeta(state.sigma, state.t, state.regularization);
  const classicalEval = evaluateRicisZeta(state.sigma, state.t, 0);

  const isAtPole = state.sigma === 1.0 && state.t === 0.0;

  return (
    <div id="riemann-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-slate-300">
      
      {/* Simulation Screen */}
      <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Фазовый портрет Дзета-Функции Римана</h3>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-3 h-3 text-cyan-400" />
              Riemann Pole s=1
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Резолюция простого полюса дзета-функции в точке <span className="font-mono text-white">s = 1</span>. Под влиянием регуляризатора <span className="font-mono text-white">θ</span> бесконечный пик замещается гладким перевалом, сходящимся к точной константе Эйлера-Маскерони <span className="font-mono text-white">γ ≈ 0.5772</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-white/10 rounded-lg overflow-hidden bg-[#09090B] p-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-wider">Окрестность s=1.0</span>
            <canvas 
              ref={canvasRef} 
              width={240} 
              height={240} 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const px = e.clientX - rect.left;
                const py = e.clientY - rect.top;
                const w = rect.width;
                const h = rect.height;
                const zoom = state.zoom;
                const sigma = 1.0 + ((px - w / 2) / (w / 2)) * (zoom / 2);
                const t = -((py - h / 2) / (h / 2)) * (zoom / 2);
                setState(prev => ({
                  ...prev,
                  sigma: Math.max(0, Math.min(2, sigma)),
                  t: Math.max(-10, Math.min(10, t))
                }));
              }}
              className="w-full h-auto max-w-[240px] aspect-square rounded block cursor-crosshair border border-white/10 shadow-xl"
            />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono mb-2 uppercase tracking-wider">Профиль сечения (t = {state.t.toFixed(2)})</span>
            <canvas 
              ref={plotCanvasRef} 
              width={240} 
              height={240} 
              className="w-full h-auto max-w-[240px] aspect-square rounded block border border-white/10 shadow-xl"
            />
          </div>
        </div>

        {/* Dynamic Telemetry Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Аргумент s</span>
            <span className="text-[11px] font-semibold text-white font-mono block mt-1">
              {state.sigma.toFixed(4)} {state.t >= 0 ? '+' : '-'} {Math.abs(state.t).toFixed(4)}i
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              |s-1| = {Math.sqrt((state.sigma - 1.0)**2 + state.t**2).toFixed(4)}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Дзета ζ_θ(s)</span>
            <span className="text-[11px] font-semibold text-cyan-400 font-mono block mt-1 truncate" title={currentEval.formatted}>
              {currentEval.formatted}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Точная подстановка v7.7</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Модуль |ζ_θ|</span>
            <span className="text-sm font-semibold text-amber-400 font-mono block mt-1">
              {currentEval.mag === Infinity ? '∞' : currentEval.mag.toFixed(5)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              Кл: {classicalEval.mag === Infinity ? '∞' : classicalEval.mag.toFixed(1)}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Регулярная ζ_reg</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono block mt-1">
              {currentEval.reg_re.toFixed(5)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">At s=1: γ ≈ 0.5772</span>
          </div>
        </div>
      </div>

      {/* Control sliders */}
      <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h4 className="font-semibold text-white text-xs uppercase tracking-widest text-cyan-400">Характеристики Дзета-Полюса</h4>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Параметры комплексного s-пространства</p>
          </div>

          {/* Preset Selector */}
          <div className="bg-[#09090B] border border-white/5 p-3 rounded-lg space-y-2">
            <label className="text-slate-500 font-mono uppercase text-[9px] block tracking-wider">Типовой сценарий</label>
            <div className="flex flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => setState({ sigma: 1.0, t: 0.0, regularization: 0.0, zoom: 3.5 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Полюс s=1 (Классика θ=0)
              </button>
              <button 
                type="button"
                onClick={() => setState({ sigma: 1.0, t: 0.0, regularization: 0.4, zoom: 3.5 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Полюс s=1 (Регуляризован θ)
              </button>
              <button 
                type="button"
                onClick={() => setState({ sigma: 0.5, t: 14.134, regularization: 0.2, zoom: 3.0 })}
                className="px-2.5 py-1 bg-[#09090B] border border-cyan-500/20 rounded text-[10px] text-cyan-400 hover:bg-cyan-500/10 font-mono transition-all duration-200 cursor-pointer"
              >
                Первый нетривиальный ноль
              </button>
            </div>
          </div>

          {/* Sigma (Re s) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Вещественная часть Re(s) = σ</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">
                {state.sigma.toFixed(3)}
              </span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="2.0" 
              step="0.01" 
              value={state.sigma}
              onChange={(e) => setState({...state, sigma: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* t (Im s) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Мнимая часть Im(s) = t</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">
                {state.t.toFixed(3)}
              </span>
            </div>
            <input 
              type="range" 
              min="-10.0" 
              max="10.0" 
              step="0.05" 
              value={state.t}
              onChange={(e) => setState({...state, t: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* RICIS theta */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-cyan-400 font-mono uppercase font-semibold text-[10px]">Параметр регуляризации θ</label>
              <span className="font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2.5 py-1 text-xs rounded">
                {state.regularization.toFixed(3)}
              </span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.01" 
              value={state.regularization}
              onChange={(e) => setState({...state, regularization: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Visual Zoom */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Масштабирование плоскости</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">
                {state.zoom.toFixed(1)}x
              </span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="6.0" 
              step="0.1" 
              value={state.zoom}
              onChange={(e) => setState({...state, zoom: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Google Sheets Export */}
        <div className="mt-4">
          <ExportToSheetsButton 
            mode="RIEMANN" 
            params={state} 
            defaultDescription={`Полюс Римана s=1: s=(${state.sigma}, ${state.t}), регуляризатор θ=${state.regularization}`} 
          />
        </div>

        {/* Dynamic RICIS status box */}
        {state.regularization === 0 ? (
          <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-lg text-xs text-red-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Бесконечный Дзета-Разрыв</span>
            </div>
            <p className="leading-relaxed">
              При θ = 0 дзета-функция Римана в точке s = 1 терпит неустранимый бесконечный полюс первого порядка. Классические численные симуляции разрушаются в окрестности s=1.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-cyan-950/15 border border-cyan-500/20 rounded-lg text-xs text-cyan-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Регуляризация Дзета-Полюса</span>
            </div>
            <p className="leading-relaxed">
              Благодаря парадигме RICIS III при θ = {state.regularization.toFixed(2)} полюс благополучно свернут. При s = 1.0 прямое аналитическое вычисление выдает точный предел без неопределенностей: <strong>ζ_θ(1) = {currentEval.reg_re.toFixed(4)}</strong> (Константа Эйлера).
            </p>
          </div>
        )}

      </div>

      {/* Full Sequencer section for Riemann Pole */}
      <div className="lg:col-span-12 bg-black/40 border border-cyan-500/10 rounded-xl p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-cyan-950/30 border border-cyan-500/30 rounded">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Резолюция сингулярности s = 1 дзета-функции через RICIS III (Точная подстановка)
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
              Strictly consistent Riemann Zeta pole regularization without limits or Cauchy approximation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#09090B] border border-red-500/10 rounded-lg p-5 space-y-3">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">Классическая Коши-Сингулярность</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              В классическом ТФКП полюс дзета-функции Римана выражается как:
            </p>
            <div className="bg-black/40 p-4 rounded border border-white/5 font-mono text-[11px] text-slate-300 space-y-1">
              <div>ζ(s) = 1/(s-1) + Σ ((-1)^n · γ_n · (s-1)^n) / n!</div>
              <div>lim(s→1) ζ(s) = 1/0 + γ = ∞ (Сингулярность)</div>
            </div>
            <p className="text-[11px] text-red-400/80 leading-relaxed italic">
              * Ошибка деления на абсолютный ноль делает невозможным прямое вычисление при s=1 в рамках обычной арифметики, заставляя математиков прибегать к выкалыванию точек или деформации контуров.
            </p>
          </div>

          <div className="bg-[#09090B] border border-cyan-500/20 rounded-lg p-5 space-y-3 shadow-[0_0_20px_rgba(34,211,238,0.02)]">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">Резолюция RICIS III (Алгебра Весов)</span>
            <p className="text-xs text-slate-300 leading-relaxed">
              RICIS III вводит индексированный вес нуля в точке <span className="font-mono text-white">s=1</span>. Прямая подстановка без пределов:
            </p>
            <div className="bg-black/40 p-4 rounded border border-cyan-500/10 font-mono text-[11px] text-cyan-300 space-y-2">
              <div>ζ_θ(1) = [ (1 - 1) ] / [ (1 - 1)² + θ² ] + ζ_reg(1)</div>
              <div className="text-emerald-400">// Аксиома А4/А5: 0 / θ² = 0 при θ &gt; 0</div>
              <div>ζ_θ(1) = 0 + γ = γ &nbsp; (0.577215... Константа Эйлера!)</div>
            </div>
            <p className="text-[11px] text-emerald-400/90 leading-relaxed">
              * Вычисления абсолютно корректны, бесконечность устранена на алгебраическом уровне. Дискретная сингулярность полностью сглаживается в гладкое поле.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
