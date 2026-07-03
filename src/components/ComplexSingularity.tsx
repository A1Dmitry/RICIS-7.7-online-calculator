/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ComplexState } from '../types';
import { Sparkles, Shield, Info, Compass, HelpCircle, Activity } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface ComplexSingularityProps {
  preset?: ComplexState;
}

export default function ComplexSingularity({ preset }: ComplexSingularityProps = {}) {
  const [state, setState] = useState<ComplexState>({
    funcType: 'pole_1',
    singularityX: 0.0,
    singularityY: 0.0,
    zoom: 2.0,
    blowUp: 0.2, // RICIS III epsilon
    cursorX: 0.5,
    cursorY: 0.5
  });

  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Run domain coloring canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    const z0_x = state.singularityX;
    const z0_y = state.singularityY;
    const zoom = state.zoom;
    const epsilon = state.blowUp; // RICIS III parameter
    const type = state.funcType;

    // Helper to map pixel to complex plane
    // Centered at (0,0)
    const mapPixelToComplex = (px: number, py: number) => {
      const cx = ((px - width / 2) / (width / 2)) * zoom;
      const cy = -((py - height / 2) / (height / 2)) * zoom; // invert Y for standard Cartesian
      return { x: cx, y: cy };
    };

    // Fast HSL to RGB conversion
    const hslToRgb = (h: number, s: number, l: number, out: Uint8ClampedArray, index: number) => {
      let r, g, b;
      if (s === 0) {
        r = g = b = l; // achromatic
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
      out[index + 3] = 255; // Alpha
    };

    // Pixel calculation loop
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const { x, y } = mapPixelToComplex(px, py);

        // Vector delta to singularity: z - z0
        const dx = x - z0_x;
        const dy = y - z0_y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);

        let w_x = 0;
        let w_y = 0;

        // Apply selected complex function with RICIS III regularization
        // Classical: w = f(z)
        // RICIS III: division is regularized via epsilon.
        // For example, instead of 1 / dz, we do dz_conjugate / (|dz|^2 + epsilon^2)
        if (type === 'pole_1') {
          // f(z) = 1 / (z - z0)
          // Classical: dx / r2 - i * dy / r2
          // RICIS III: dx / (r2 + eps^2) - i * dy / (r2 + eps^2)
          const denom = r2 + epsilon * epsilon;
          w_x = dx / denom;
          w_y = -dy / denom;
        } 
        else if (type === 'pole_2') {
          // f(z) = 1 / (z - z0)^2
          // dz^2 = dx^2 - dy^2 + 2*i*dx*dy
          // Conjugate of dz^2 = dx^2 - dy^2 - 2*i*dx*dy
          // RICIS III regularized division
          const dz2_real = dx * dx - dy * dy;
          const dz2_imag = 2 * dx * dy;
          const mag2 = dz2_real * dz2_real + dz2_imag * dz2_imag;
          const denom = mag2 + epsilon * epsilon * 10; // scale epsilon for higher poles
          w_x = dz2_real / denom;
          w_y = -dz2_imag / denom;
        } 
        else if (type === 'essential') {
          // f(z) = exp(1 / (z - z0))
          // 1 / dz regularized = dx / (r2 + eps^2) - i * dy / (r2 + eps^2)
          const denom = r2 + epsilon * epsilon;
          const power_x = dx / denom;
          const power_y = -dy / denom;
          // exp(a + ib) = exp(a) * (cos(b) + i * sin(b))
          const exp_a = Math.exp(power_x);
          w_x = exp_a * Math.cos(power_y);
          w_y = exp_a * Math.sin(power_y);
        } 
        else if (type === 'branch') {
          // f(z) = ln(z - z0) = ln|z-z0| + i * arg(z-z0)
          // RICIS III branch regularization: ln|z-z0| -> ln(sqrt(|z-z0|^2 + epsilon^2))
          const arg = Math.atan2(dy, dx);
          const log_r = 0.5 * Math.log(r2 + epsilon * epsilon + 1e-9);
          w_x = log_r;
          w_y = arg;
        }

        // Domain Coloring logic:
        // Hue represents complex argument (phase angle)
        // Saturation represents detail grid
        // Lightness represents magnitude (white for infinite poles, black for zeros)
        const w_mag = Math.sqrt(w_x * w_x + w_y * w_y);
        const w_arg = Math.atan2(w_y, w_x);

        // Normalize argument to [0, 1]
        let hue = (w_arg + Math.PI) / (2 * Math.PI);

        // Detail grid: grid lines in magnitude and phase
        const log_mag = Math.log(w_mag + 1e-12);
        const grid_mag = Math.sin(log_mag * 4.0);
        const grid_phase = Math.sin(w_arg * 8.0);
        const grid = Math.max(0, 0.7 + 0.3 * grid_mag * grid_phase);

        // Map magnitude to lightness
        // In classical mapping, infinity goes to white, 0 goes to black.
        // We use a smooth sigmoid function to map [0, inf) to [0.1, 0.9]
        // This ensures a highly balanced and eye-safe color scheme!
        let lightness = 0.5;
        if (w_mag > 0.01) {
          lightness = 0.1 + 0.8 * (w_mag / (w_mag + 0.5));
        } else {
          lightness = 0.1;
        }

        // Apply grid lines onto lightness
        lightness = lightness * grid;
        // Clamp lightness
        lightness = Math.max(0.05, Math.min(0.95, lightness));

        const pixelIndex = (py * width + px) * 4;
        hslToRgb(hue, 0.9, lightness, data, pixelIndex);
      }
    }

    // Put image data on canvas
    ctx.putImageData(imgData, 0, 0);

    // Draw singularity point overlay
    const scaleToPixelX = (cx: number) => width / 2 + (cx / zoom) * (width / 2);
    const scaleToPixelY = (cy: number) => height / 2 - (cy / zoom) * (height / 2);

    const s_px = scaleToPixelX(z0_x);
    const s_py = scaleToPixelY(z0_y);

    // If RICIS blow-up is active, draw the "Blown-up" circle/throat boundary
    if (epsilon > 0.02) {
      const circleRadius = (epsilon / zoom) * (width / 2);
      ctx.beginPath();
      ctx.arc(s_px, s_py, circleRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fill a very soft dark circle inside to show resolution
      ctx.fillStyle = 'rgba(15, 17, 21, 0.15)';
      ctx.beginPath();
      ctx.arc(s_px, s_py, circleRadius, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '9px monospace';
      ctx.fillText('Горловина ε', s_px + circleRadius + 5, s_py - 4);
    } else {
      // Classical singular dot
      ctx.beginPath();
      ctx.arc(s_px, s_py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    }

    // Draw cursor probe overlay
    const c_px = scaleToPixelX(state.cursorX);
    const c_py = scaleToPixelY(state.cursorY);
    ctx.beginPath();
    ctx.arc(c_px, c_py, 5, 0, 2 * Math.PI);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [state]);

  // Handle canvas clicks to move probe cursor or singularity
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;

    // Convert pixel to complex coordinates
    const cx = ((px - width / 2) / (width / 2)) * state.zoom;
    const cy = -((py - height / 2) / (height / 2)) * state.zoom;

    // If shift key or right mouse button is pressed, move the singularity instead!
    if (e.shiftKey) {
      setState(prev => ({
        ...prev,
        singularityX: Math.max(-2, Math.min(2, cx)),
        singularityY: Math.max(-2, Math.min(2, cy))
      }));
    } else {
      // Move probe cursor
      setState(prev => ({
        ...prev,
        cursorX: Math.max(-state.zoom, Math.min(state.zoom, cx)),
        cursorY: Math.max(-state.zoom, Math.min(state.zoom, cy))
      }));
    }
  };

  // Evaluate function at cursor for textual telemetry
  const evaluateAtCursor = () => {
    const z0_x = state.singularityX;
    const z0_y = state.singularityY;
    const epsilon = state.blowUp;
    const type = state.funcType;
    
    // Probe coordinates z = x + i*y
    const z_x = state.cursorX;
    const z_y = state.cursorY;

    // z - z0
    const dx = z_x - z0_x;
    const dy = z_y - z0_y;
    const r2 = dx * dx + dy * dy;

    let w_x = 0;
    let w_y = 0;
    const isAtSingularity = r2 < 0.001 && epsilon === 0;

    let w_str = "";
    let w_mag = 0;
    let w_arg = 0;

    if (isAtSingularity) {
      if (type === 'pole_1') {
        w_str = "∞₁ (Аксиома А1 / Вес 1)";
        w_mag = Infinity;
        w_arg = 0;
      } else if (type === 'pole_2') {
        w_str = "∞₂ (Аксиома А1 / Вес 2)";
        w_mag = Infinity;
        w_arg = 0;
      } else if (type === 'essential') {
        w_str = "∞_exp (Существ. бесконечность)";
        w_mag = Infinity;
        w_arg = 0;
      } else if (type === 'branch') {
        w_str = "-∞₁ (Аксиома А1 / Ветвление)";
        w_mag = Infinity;
        w_arg = Math.PI;
      }
    } else {
      if (type === 'pole_1') {
        const denom = r2 + epsilon * epsilon;
        w_x = dx / denom;
        w_y = -dy / denom;
      } else if (type === 'pole_2') {
        const dz2_real = dx * dx - dy * dy;
        const dz2_imag = 2 * dx * dy;
        const mag2 = dz2_real * dz2_real + dz2_imag * dz2_imag;
        const denom = mag2 + epsilon * epsilon * 10;
        w_x = dz2_real / denom;
        w_y = -dz2_imag / denom;
      } else if (type === 'essential') {
        const denom = r2 + epsilon * epsilon;
        const power_x = dx / denom;
        const power_y = -dy / denom;
        const exp_a = Math.exp(power_x);
        w_x = exp_a * Math.cos(power_y);
        w_y = exp_a * Math.sin(power_y);
      } else if (type === 'branch') {
        const log_r = 0.5 * Math.log(r2 + epsilon * epsilon + 1e-9);
        const arg = Math.atan2(dy, dx);
        w_x = log_r;
        w_y = arg;
      }
      w_mag = Math.sqrt(w_x * w_x + w_y * w_y);
      w_arg = Math.atan2(w_y, w_x);
      w_str = `${w_x.toFixed(3)} ${w_y >= 0 ? '+' : '-'} ${Math.abs(w_y).toFixed(3)}i`;
    }

    // Also compute classical evaluation to show the contrast
    let w_class_mag = 0;
    if (type === 'pole_1') {
      w_class_mag = 1.0 / (Math.sqrt(r2) + 1e-15);
    } else if (type === 'pole_2') {
      w_class_mag = 1.0 / (r2 + 1e-15);
    } else if (type === 'essential') {
      w_class_mag = Math.exp(dx / (r2 + 1e-15));
    } else if (type === 'branch') {
      w_class_mag = Math.abs(0.5 * Math.log(r2 + 1e-15));
    }

    return {
      z: `${z_x.toFixed(3)} ${z_y >= 0 ? '+' : '-'} ${Math.abs(z_y).toFixed(3)}i`,
      w: w_str,
      w_mag: w_mag,
      w_arg_deg: ((w_arg * 180) / Math.PI).toFixed(1),
      w_class_mag: w_class_mag,
      isSingular: isAtSingularity
    };
  };

  const evalResults = evaluateAtCursor();

  return (
    <div id="complex-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-slate-300">
      {/* Simulation Screen */}
      <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <Compass className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Фазовый портрет комплексного поля</h3>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Activity className="w-3 h-3 text-cyan-400" />
              Комплексные Полюса
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Карта комплексного отображения. Цвета кодируют аргумент (фазу), яркость — модуль. Кликните по карте для перемещения зеленого зонда. Зажмите <kbd className="bg-white/10 px-1 py-0.5 rounded border border-white/10 text-[10px] text-white">Shift</kbd> и кликните для перемещения самой сингулярности.
          </p>
        </div>

        <div className="relative border border-white/10 rounded-lg overflow-hidden bg-[#09090B] flex items-center justify-center p-4">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={300} 
            onClick={handleCanvasInteraction}
            className="w-full h-auto max-w-[300px] aspect-square rounded block cursor-crosshair border border-white/10 shadow-2xl"
          />
        </div>

        {/* Dynamic Telemetry Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Координата Z</span>
            <span className="text-[11px] font-semibold text-white font-mono break-all block mt-1">{evalResults.z}</span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">|z-z0| = {Math.sqrt((state.cursorX - state.singularityX)**2 + (state.cursorY - state.singularityY)**2).toFixed(3)}</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Значение W=f(z)</span>
            <span className="text-[11px] font-semibold text-cyan-400 font-mono break-all block mt-1">{evalResults.w}</span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Регуляризовано ε</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Модуль |W|</span>
            <span className="text-sm font-semibold text-amber-400 font-mono block mt-1">
              {evalResults.w_mag > 1e4 ? evalResults.w_mag.toExponential(3) : evalResults.w_mag.toFixed(4)}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              Без ε: {evalResults.w_class_mag > 1e8 ? '∞ (Ошибка)' : evalResults.w_class_mag.toFixed(1)}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Аргумент (Фаза)</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono block mt-1">{evalResults.w_arg_deg}°</span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Цветовая гамма HSL</span>
          </div>
        </div>
      </div>

      {/* Control sliders */}
      <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h4 className="font-semibold text-white text-xs uppercase tracking-widest text-cyan-400">Комплексное поле</h4>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Вид функции и регуляризирующий фактор</p>
          </div>

          {/* Preset Selector */}
          <div className="bg-[#09090B] border border-white/5 p-3 rounded-lg space-y-2">
            <label className="text-slate-500 font-mono uppercase text-[9px] block tracking-wider">Типовой сценарий</label>
            <div className="flex flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => setState({ funcType: 'pole_1', singularityX: 0.0, singularityY: 0.0, zoom: 2.0, blowUp: 0, cursorX: 0.1, cursorY: 0.1 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Чистый полюс z=0
              </button>
              <button 
                type="button"
                onClick={() => setState({ funcType: 'essential', singularityX: 0.0, singularityY: 0.0, zoom: 1.5, blowUp: 0.25, cursorX: 0.1, cursorY: 0.1 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Существенная exp(1/z)
              </button>
              <button 
                type="button"
                onClick={() => setState({ funcType: 'branch', singularityX: 0.0, singularityY: 0.0, zoom: 2.0, blowUp: 0.3, cursorX: 0.2, cursorY: 0.2 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Разрез ln(z) с ε
              </button>
            </div>
          </div>

          {/* Function Selector */}
          <div className="space-y-3">
            <label className="text-[10px] text-slate-500 font-mono uppercase block">Тип сингулярности f(z)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setState({...state, funcType: 'pole_1'})}
                className={`text-xs px-3.5 py-3 rounded border text-left transition duration-200 ${
                  state.funcType === 'pole_1' 
                    ? 'bg-cyan-950/20 border-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="font-bold text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Полюс 1 пор.</div>
                <div className="text-[9px] text-slate-500 mt-1">1 / (z - z₀)</div>
              </button>
              <button
                onClick={() => setState({...state, funcType: 'pole_2'})}
                className={`text-xs px-3.5 py-3 rounded border text-left transition duration-200 ${
                  state.funcType === 'pole_2' 
                    ? 'bg-cyan-950/20 border-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="font-bold text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Полюс 2 пор.</div>
                <div className="text-[9px] text-slate-500 mt-1">1 / (z - z₀)²</div>
              </button>
              <button
                onClick={() => setState({...state, funcType: 'essential'})}
                className={`text-xs px-3.5 py-3 rounded border text-left transition duration-200 ${
                  state.funcType === 'essential' 
                    ? 'bg-cyan-950/20 border-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="font-bold text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Существенная</div>
                <div className="text-[9px] text-slate-500 mt-1">exp(1 / (z - z₀))</div>
              </button>
              <button
                onClick={() => setState({...state, funcType: 'branch'})}
                className={`text-xs px-3.5 py-3 rounded border text-left transition duration-200 ${
                  state.funcType === 'branch' 
                    ? 'bg-cyan-950/20 border-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="font-bold text-[10px] text-cyan-400 font-mono uppercase tracking-wider">Ветвление</div>
                <div className="text-[9px] text-slate-500 mt-1">ln(z - z₀)</div>
              </button>
            </div>
          </div>

          {/* Singularity Position Re */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Сдвиг сингулярности Re(z₀)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.singularityX.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="-1.5" 
              max="1.5" 
              step="0.05" 
              value={state.singularityX}
              onChange={(e) => setState({...state, singularityX: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Singularity Position Im */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Сдвиг сингулярности Im(z₀)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.singularityY.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="-1.5" 
              max="1.5" 
              step="0.05" 
              value={state.singularityY}
              onChange={(e) => setState({...state, singularityY: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Zoom */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Масштабирование (Zoom)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.zoom.toFixed(1)}</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="4.0" 
              step="0.1" 
              value={state.zoom}
              onChange={(e) => setState({...state, zoom: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Blow Up epsilon */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-cyan-400 font-mono uppercase font-semibold text-[10px]">Раздутие RICIS III (ε)</label>
              <span className="font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2.5 py-1 text-xs rounded">{state.blowUp.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.02" 
              value={state.blowUp}
              onChange={(e) => setState({...state, blowUp: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Google Sheets Export */}
        <div className="mt-4">
          <ExportToSheetsButton 
            mode="COMPLEX_ANALYSIS" 
            params={state} 
            defaultDescription={`Комплексная симуляция: тип=${state.funcType}, Полюс=(${state.singularityX}, ${state.singularityY}), ε=${state.blowUp}`} 
          />
        </div>

        {/* Dynamic warning or info card */}
        {state.blowUp === 0 ? (
          <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-lg text-xs text-red-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <Shield className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Деление на ноль!</span>
            </div>
            <p className="leading-relaxed">
              При ε = 0 комплексная функция терпит бесконечный разрыв. Включите коэффициент раздутия ε &gt; 0 для регуляризации сингулярной точки.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-lg text-xs text-slate-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-200/80 font-mono">Раздутие Активно</span>
            </div>
            <p className="leading-relaxed">
              Точечный полюс расширен в устойчивую кольцевую горловину радиусом ε. Деление на ноль устранено, фазовые контуры абсолютно непрерывны.
            </p>
          </div>
        )}
      </div>
    </div>

  );
}
