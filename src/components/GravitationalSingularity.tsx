/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GravitationalState } from '../types';
import { Shield, Sparkles, AlertTriangle, RefreshCw, Zap, Disc } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';
import { useLanguage } from '../lib/i18n';

interface GravitationalSingularityProps {
  preset?: GravitationalState;
}

export default function GravitationalSingularity({ preset }: GravitationalSingularityProps = {}) {
  const { t, language } = useLanguage();
  const [state, setState] = useState<GravitationalState>({
    mass: 5,           // M_sun
    spin: 0.3,         // a (normalized angular momentum, 0 to 0.99)
    charge: 0.2,       // Q (normalized charge, 0 to 0.99)
    radius: 3.0,       // in units of R_s
    regularization: 0.8 // RICIS theta (0 to 2)
  });

  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Constants
  const G = 1;
  const c = 1;

  // Compute values
  const M = state.mass;
  const a = state.spin * M * 0.5; // Scale angular momentum to prevent naked singularities too easily
  const Q = state.charge * M * 0.5; // Scale charge

  // Discriminant for horizons: M^2 - a^2 - Q^2
  const disc = M * M - a * a - Q * Q;
  const isNaked = disc < 0;

  // Schwarzschild radius in normalized units
  const r_s = 2 * G * M;
  
  // Horizons
  const r_plus = isNaked ? 0 : M + Math.sqrt(disc);
  const r_minus = isNaked ? 0 : M - Math.sqrt(disc);

  // Conversion factor for real-world display (approx stellar black hole)
  const realRsKm = (state.mass * 2.953).toFixed(2);

  // Distance from singularity in meters/geometric units
  const r_eval = state.radius * r_s;

  // Kretschmann scalar
  // K_classical = 48 * M^2 / r^6
  // K_ricis = 48 * M^2 / (r^6 + theta^6)
  const theta = state.regularization * r_s; // scale theta with size of black hole
  const r_eval_zero = r_eval < 1e-4;
  const theta_zero = theta < 1e-4;

  const K_classical_val = r_eval_zero ? Infinity : (48 * M * M) / Math.pow(r_eval, 6);
  const K_ricis_val = (r_eval_zero && theta_zero) ? Infinity : (48 * M * M) / (Math.pow(r_eval, 6) + Math.pow(theta, 6));

  // Tidal force (index of spaghettification)
  const F_classical_val = r_eval_zero ? Infinity : (2 * M) / Math.pow(r_eval, 3);
  const F_ricis_val = (r_eval_zero && theta_zero) ? Infinity : (2 * M) / (Math.pow(r_eval, 3) + Math.pow(theta, 3));

  // Determine current observer state
  const isInsideHorizon = !isNaked && r_eval <= r_plus;
  const isInsideInnerHorizon = !isNaked && r_eval <= r_minus;
  const isSpaghettified = F_ricis_val > 0.5;

  // Draw gravity well visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear background to match Elegant Dark base
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Draw space-time mesh grid with Elegant Cyan
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
    ctx.lineWidth = 1;

    const centerY = height * 0.35;
    const centerX = width / 2;
    const scaleX = width / 20;

    // Draw horizontal grid lines bent by gravity well
    const gridSpacing = 15;
    for (let y = 10; y < height; y += gridSpacing) {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 5) {
        const dx = (x - centerX) / scaleX;
        
        // Potential well formula
        const r_dist = Math.abs(dx);
        const theta_normalized = state.regularization * 1.5;
        const potential = -M * 0.5 / Math.sqrt(r_dist * r_dist + theta_normalized * theta_normalized);
        
        const weight = Math.max(0, 1 - Math.abs(y - centerY) / 80);
        const bend = potential * 60 * weight;

        if (x === 0) {
          ctx.moveTo(x, y + bend);
        } else {
          ctx.lineTo(x, y + bend);
        }
      }
      ctx.stroke();
    }

    // Draw vertical grid lines bent by gravity well
    for (let x = 10; x < width; x += gridSpacing) {
      ctx.beginPath();
      const dx = (x - centerX) / scaleX;
      const r_dist = Math.abs(dx);
      const theta_normalized = state.regularization * 1.5;
      const potential = -M * 0.5 / Math.sqrt(r_dist * r_dist + theta_normalized * theta_normalized);

      for (let y = 0; y <= height; y += 5) {
        const weight = Math.max(0, 1 - Math.abs(y - centerY) / 80);
        const bend = potential * 60 * weight;

        if (y === 0) {
          ctx.moveTo(x, y + bend);
        } else {
          ctx.lineTo(x, y + bend);
        }
      }
      ctx.stroke();
    }

    // Draw horizons as overlays
    if (!isNaked) {
      // Draw event horizon (outer)
      const horizonRadiusX = r_plus * scaleX * 0.4;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, horizonRadiusX, horizonRadiusX * 0.3, 0, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Horizon text label
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.font = '10px monospace';
      ctx.fillText(t('Горизонт r+', 'Event Horizon r+'), centerX + horizonRadiusX + 5, centerY);
    }

    // Draw quantum core (for theta > 0)
    if (state.regularization > 0.05) {
      const coreRadius = state.regularization * scaleX * 0.4;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0.8)');
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.2)');
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, coreRadius, coreRadius * 0.4, 0, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Draw classical singularity as a tiny glowing white-hot point
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }

    // Draw Observer
    const observerX = centerX + (state.radius * 2) * scaleX * 0.6;
    ctx.beginPath();
    ctx.arc(observerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(observerX, centerY - 12);
    ctx.lineTo(observerX, centerY + 12);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.font = '10px monospace';
    ctx.fillText(t('Наблюдатель', 'Observer'), observerX - 35, centerY - 18);

  }, [state, M, r_plus, r_minus, isNaked, t]);

  return (
    <div id="gravitational-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-slate-300">
      {/* Simulation Screen */}
      <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <Disc className="w-5 h-5 text-cyan-400 animate-spin-slow" />
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">{t('Сечение пространства-времени', 'Space-Time Section')}</h3>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Zap className="w-3 h-3 text-cyan-400" />
              {t('Гравитационное поле', 'Gravitational Field')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {t('Визуализация гравитационного колодца черной дыры. Регуляризатор сглаживает сингулярность, формируя устойчивое квантовое ядро конечной плотности.', 'Visualization of the gravitational well of a black hole. The regularizer smooths the singularity, forming a stable quantum core of finite density.')}
          </p>
        </div>

        <div className="relative border border-white/10 rounded-lg overflow-hidden bg-[#09090B] flex items-center justify-center p-2">
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={280} 
            className="w-full h-auto max-h-[280px] rounded block"
          />
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none">
            {isInsideHorizon && (
              <div className="bg-red-950/80 border border-red-500/30 text-red-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{t('Горизонт событий пройден!', 'Event Horizon Crossed!')}</span>
              </div>
            )}
            {isSpaghettified && (
              <div className="bg-amber-950/80 border border-amber-500/30 text-amber-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('Критический приливный градиент', 'Critical Tidal Gradient')}</span>
              </div>
            )}
            {state.regularization > 0.05 && (
              <div className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('Регуляризация RICIS III Активна', 'RICIS III Regularization Active')}</span>
              </div>
            )}
            {isNaked && (
              <div className="bg-purple-950/80 border border-purple-500/30 text-purple-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('Голая сингулярность (Naked Singularity)', 'Naked Singularity')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Telemetry Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 border border-white/5 rounded-lg p-4">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">{t('Радиус R_s', 'Radius R_s')}</span>
            <span className="text-sm font-semibold text-white font-mono block mt-1">{realRsKm} {t('км', 'km')}</span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">2GM / c²</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-4">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">{t('Кривизна (Кретчман)', 'Curvature (Kretschmann)')}</span>
            <span className="text-sm font-semibold text-cyan-400 font-mono block mt-1">
              {r_eval_zero && theta_zero ? t('∞_G (Аксиома А1)', '∞_G (Axiom A1)') : (K_ricis_val > 1e6 ? K_ricis_val.toExponential(3) : K_ricis_val.toFixed(2))}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              {t('Кл:', 'Cl:')} {K_classical_val === Infinity ? t('∞ (Сингулярно)', '∞ (Singular)') : K_classical_val.toExponential(2)}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-4">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">{t('Приливное поле', 'Tidal Field')}</span>
            <span className="text-sm font-semibold text-amber-400 font-mono block mt-1">
              {r_eval_zero && theta_zero ? t('∞_F (Аксиома А1)', '∞_F (Axiom A1)') : (F_ricis_val > 1e4 ? F_ricis_val.toExponential(2) : F_ricis_val.toFixed(3))}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
              {t('Кл:', 'Cl:')} {F_classical_val === Infinity ? '∞' : F_classical_val.toExponential(1)}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-4">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">{t('Горизонт r+', 'Horizon r+')}</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono block mt-1">
              {isNaked ? t('Нет (Голая)', 'No (Naked)') : `${(r_plus / r_s).toFixed(2)} R_s`}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">r-: {isNaked ? t('Нет', 'None') : `${(r_minus / r_s).toFixed(2)} R_s`}</span>
          </div>
        </div>
      </div>

      {/* Control sliders */}
      <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h4 className="font-semibold text-white text-xs uppercase tracking-widest text-cyan-400">{t('Характеристики сингулярности', 'Singularity Characteristics')}</h4>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">{t('Параметры черной дыры и масштабирования', 'Black Hole & Scaling Parameters')}</p>
          </div>

          {/* Preset Selector */}
          <div className="bg-[#09090B] border border-white/5 p-3 rounded-lg space-y-2">
            <label className="text-slate-500 font-mono uppercase text-[9px] block tracking-wider">{t('Типовой сценарий', 'Typical Scenario')}</label>
            <div className="flex flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => setState({ mass: 5, spin: 0, charge: 0, radius: 0.1, regularization: 0 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 font-mono transition-all duration-200 cursor-pointer"
              >
                {t('Коллапс Шварцшильда', 'Schwarzschild Collapse')}
              </button>
              <button 
                type="button"
                onClick={() => setState({ mass: 12, spin: 0.95, charge: 0.0, radius: 1.2, regularization: 0.1 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 font-mono transition-all duration-200 cursor-pointer"
              >
                {t('Быстрое вращение Керра', 'Fast Kerr Rotation')}
              </button>
              <button 
                type="button"
                onClick={() => setState({ mass: 5, spin: 0, charge: 0, radius: 0.1, regularization: 0.8 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 font-mono transition-all duration-200 cursor-pointer"
              >
                {t('Регуляризация RICIS III', 'RICIS III Regularization')}
              </button>
            </div>
          </div>

          {/* Mass */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">{t('Масса черной дыры (M)', 'Black Hole Mass (M)')}</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.mass} M_☉</span>
            </div>
            <input 
              type="range" 
              min="1.5" 
              max="20" 
              step="0.1" 
              value={state.mass}
              onChange={(e) => setState({...state, mass: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Spin a */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">{t('Вращение / Спин (a)', 'Rotation / Spin (a)')}</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.spin.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="0.99" 
              step="0.01" 
              value={state.spin}
              onChange={(e) => setState({...state, spin: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Charge Q */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">{t('Электрический заряд (Q)', 'Electric Charge (Q)')}</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.charge.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="0.99" 
              step="0.01" 
              value={state.charge}
              onChange={(e) => setState({...state, charge: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Observer Radius */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">{t('Позиция наблюдателя (r)', 'Observer Position (r)')}</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{(r_eval / r_s).toFixed(2)} R_s</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="6.0" 
              step="0.05" 
              value={state.radius}
              onChange={(e) => setState({...state, radius: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* RICIS Regularization θ */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-cyan-400 font-mono uppercase font-semibold text-[10px]">{t('Регуляризатор RICIS III (θ)', 'RICIS III Regularizer (θ)')}</label>
              <span className="font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2.5 py-1 text-xs rounded">{state.regularization.toFixed(2)} R_s</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="2.0" 
              step="0.05" 
              value={state.regularization}
              onChange={(e) => setState({...state, regularization: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>

        {/* Google Sheets Export */}
        <div className="mt-4">
          <ExportToSheetsButton 
            mode="GRAVITATIONAL" 
            params={state} 
            defaultDescription={t(
              `Гравитационная симуляция: М=${state.mass}, Спин=${state.spin}, Заряд=${state.charge}, θ=${state.regularization}`,
              `Gravitational simulation: M=${state.mass}, Spin=${state.spin}, Charge=${state.charge}, θ=${state.regularization}`
            )} 
          />
        </div>

        {/* Reset / Explanation (Styled as paradigm state box) */}
        <div className="mt-4 p-5 bg-cyan-950/10 border border-cyan-500/20 rounded-lg">
          <span className="text-[10px] text-cyan-200/60 uppercase font-mono tracking-wider font-semibold block mb-2">{t('Методология Регуляризации', 'Regularization Methodology')}</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t(
              'Сингулярности черных дыр, рассчитанные по методологии RICIS III, избегают коллапса пространства-времени путем удержания квантово-стабилизированного натяжения в ядре.',
              'Black hole singularities calculated using the RICIS III methodology avoid space-time collapse by maintaining quantum-stabilized tension in the core.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
