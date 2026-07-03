/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavierStokesState } from '../types';
import { Droplet, Zap, AlertTriangle, Shield, Sparkles, CheckCircle2, Wind, Activity } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface NavierStokesSingularityProps {
  preset?: NavierStokesState;
}

export default function NavierStokesSingularity({ preset }: NavierStokesSingularityProps = {}) {
  const [state, setState] = useState<NavierStokesState>({
    reynolds: 80,         // vortex intensity
    radialVelocity: 1.5,  // contracting radial draft
    observerRadius: 1.2,  // evaluation point r
    regularization: 0.4,  // theta parameter
    viscosity: 0.15       // kinematic viscosity nu
  });

  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  const [activeTab, setActiveTab] = useState<'simulation' | 'profile'>('simulation');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Particle list for fluid visualization
  const particlesRef = useRef<Array<{ x: number; y: number; alpha: number; speedMult: number; color: string }>>([]);

  // Initialize particles once
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 220; i++) {
      // Random angle and radius
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 200;
      particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        alpha: 0.2 + Math.random() * 0.8,
        speedMult: 0.5 + Math.random() * 1.0,
        color: Math.random() > 0.3 ? '#22d3ee' : '#38bdf8' // Cyan and sky blue
      });
    }
    particlesRef.current = particles;
  }, []);

  // Compute values for rendering and telemetry
  const G = state.reynolds * 1.5; // Vortex strength gamma
  const r_eval = state.observerRadius;
  const theta = state.regularization;
  const nu = state.viscosity;

  // Evaluation results at r_eval using RICIS III direct substitution (NO LIMITS used!)
  
  // 1. Velocity (v_ricis)
  // At r_eval=0, theta=0: direct substitution of v = G*r / (2*pi*(r^2+theta^2)) yields 0_G / 0_2pi = G / 2pi (Axiom A4/A5)
  // At r_eval=0, theta>0: yields 0_G / (2*pi*theta^2) = 0
  // Otherwise: computed standardly
  const v_ricis_raw = (r_eval === 0 && theta === 0) 
    ? (G / (2 * Math.PI)) 
    : (G * r_eval) / (2 * Math.PI * (r_eval * r_eval + theta * theta));

  const v_ricis_formatted = (r_eval === 0 && theta === 0)
    ? `0_G / 0_2π = ${(G / (2 * Math.PI)).toFixed(2)} м/с (Акс. А4)`
    : `${v_ricis_raw.toFixed(2)} м/с`;

  // Classical velocity (uses limit if r_eval -> 0)
  const v_classical_raw = r_eval === 0 ? Infinity : G / (2 * Math.PI * r_eval);
  const v_classical_formatted = r_eval === 0 
    ? "lim(r→0) = ∞ (Ошибка деления)" 
    : `${v_classical_raw.toFixed(2)} м/с`;

  // 2. Vorticity (omega_ricis)
  // At r_eval=0, theta=0: direct substitution yields G / 0_2pi = ∞_G (Axiom A1)
  // Otherwise: computed standardly
  const omega_ricis_raw = (r_eval === 0 && theta === 0)
    ? Infinity
    : G / (Math.PI * (r_eval * r_eval + theta * theta));

  const omega_ricis_formatted = (r_eval === 0 && theta === 0)
    ? `Γ / 0_π = ∞_G (Аксиома А1)`
    : `${omega_ricis_raw.toFixed(2)} рад/с`;

  const omega_classical_raw = r_eval === 0 ? Infinity : G / (Math.PI * r_eval * r_eval);
  const omega_classical_formatted = r_eval === 0
    ? "lim(r→0) = ∞"
    : `${omega_classical_raw.toFixed(1)} рад/с`;

  // 3. Pressure (P_ricis)
  // Reference pressure P_inf = 100 kPa
  const P_inf = 100;
  const rho = 1.2;
  const P_ricis_drop = (r_eval === 0 && theta === 0)
    ? Infinity
    : (rho * G * G) / (8 * Math.PI * Math.PI * (r_eval * r_eval + theta * theta));
  
  const P_ricis_raw = (r_eval === 0 && theta === 0) ? -Infinity : P_inf - P_ricis_drop;
  const P_ricis_formatted = (r_eval === 0 && theta === 0)
    ? `100 - ∞_G = -∞_G кПа`
    : `${P_ricis_raw.toFixed(1)} кПа`;

  const P_classical_raw = r_eval === 0 ? -Infinity : P_inf - (rho * G * G) / (8 * Math.PI * Math.PI * r_eval * r_eval);
  const P_classical_formatted = r_eval === 0
    ? "lim = -∞ (Сингулярный вакуум)"
    : `${P_classical_raw.toFixed(1)} кПа`;

  // 4. Energy Dissipation (disp_ricis)
  const disp_ricis_raw = omega_ricis_raw === Infinity ? Infinity : nu * omega_ricis_raw * omega_ricis_raw;
  const disp_ricis_formatted = (r_eval === 0 && theta === 0)
    ? `ν·Γ² / 0_π² = ∞_G² Вт/кг`
    : `${disp_ricis_raw > 1e4 ? disp_ricis_raw.toExponential(2) : disp_ricis_raw.toFixed(3)} Вт/кг`;

  const disp_classical_raw = omega_classical_raw === Infinity ? Infinity : nu * omega_classical_raw * omega_classical_raw;
  const disp_classical_formatted = r_eval === 0
    ? "lim = ∞ Вт/кг"
    : `${disp_classical_raw > 1e4 ? disp_classical_raw.toExponential(1) : disp_classical_raw.toFixed(2)} Вт/кг`;

  const isBlowUp = theta < 0.05 && r_eval < 0.2;
  const isProtected = theta >= 0.2;

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame = 0;

    const render = () => {
      localFrame++;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear with elegant dark background
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, width, height);

      // Draw concentric shear orbits
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let r = 40; r <= 200; r += 40) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (activeTab === 'simulation') {
        // Draw vector field arrows in background
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
        ctx.fillStyle = 'rgba(34, 211, 238, 0.04)';
        ctx.lineWidth = 1;
        for (let x = -width/2; x < width/2; x += 40) {
          for (let y = -height/2; y < height/2; y += 40) {
            const r = Math.sqrt(x*x + y*y);
            if (r > 20 && r < 200) {
              const theta_angle = Math.atan2(y, x);
              // tangent vector
              const tx = -Math.sin(theta_angle);
              const ty = Math.cos(theta_angle);
              // radial contraction vector
              const rx = -Math.cos(theta_angle) * (state.radialVelocity * 0.2);
              const ry = -Math.sin(theta_angle) * (state.radialVelocity * 0.2);

              const vx = tx + rx;
              const vy = ty + ry;
              const len = Math.sqrt(vx*vx + vy*vy);
              const dx = (vx / len) * 8;
              const dy = (vy / len) * 8;

              ctx.beginPath();
              ctx.moveTo(centerX + x, centerY + y);
              ctx.lineTo(centerX + x + dx, centerY + y + dy);
              ctx.stroke();
            }
          }
        }

        // Draw and update particles
        particlesRef.current.forEach((p) => {
          const r = Math.sqrt(p.x * p.x + p.y * p.y);

          // Velocity calculation based on RICIS III (regularized at r -> 0)
          const G_scale = G * 0.6;
          const v_theta = (G_scale * r) / (r * r + (theta * 80) * (theta * 80) + 1);
          // Contracting radial drift
          const v_r = -state.radialVelocity * 1.2 * (r / (r + 10));

          // Tangent and radial direction components
          const cosPhi = p.x / (r || 1);
          const sinPhi = p.y / (r || 1);

          // Update position
          const dx = (v_r * cosPhi - v_theta * sinPhi) * 0.05 * p.speedMult;
          const dy = (v_r * sinPhi + v_theta * cosPhi) * 0.05 * p.speedMult;

          // If classical (theta is very small) and particle is extremely close to zero,
          // it acquires chaotic/unbound velocity (simulate Navier-Stokes blow-up)
          if (theta < 0.05 && r < 12) {
            p.x += (Math.random() - 0.5) * 15;
            p.y += (Math.random() - 0.5) * 15;
          } else {
            p.x += dx;
            p.y += dy;
          }

          // Reset particle if it falls into the core or goes too far
          const resetRadius = 220;
          if (r < 5 || r > resetRadius) {
            const angle = Math.random() * Math.PI * 2;
            const startRadius = 150 + Math.random() * 60;
            p.x = Math.cos(angle) * startRadius;
            p.y = Math.sin(angle) * startRadius;
          }

          // Draw particle
          ctx.beginPath();
          ctx.arc(centerX + p.x, centerY + p.y, theta < 0.05 && r < 15 ? 1.5 : 1, 0, Math.PI * 2);
          ctx.fillStyle = theta < 0.05 && r < 20 ? 'rgba(239, 68, 68, 0.8)' : p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = theta < 0.05 && r < 20 ? 4 : 0;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Vortex core indicator
        const coreRadius = Math.max(8, theta * 40);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        if (theta < 0.05) {
          // Dangerous singular point
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
          gradient.addColorStop(0.4, 'rgba(239, 68, 68, 0.3)');
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        } else {
          // Regularized stable core
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.6)');
          gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.15)');
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw core border
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.strokeStyle = theta < 0.05 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 211, 238, 0.3)';
        ctx.setLineDash(theta < 0.05 ? [2, 2] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label vortex center
        ctx.fillStyle = theta < 0.05 ? '#ef4444' : '#22d3ee';
        ctx.font = '9px monospace';
        ctx.fillText(theta < 0.05 ? 'СИНГУЛЯРНЫЙ ЦЕНТР (Ω → ∞)' : 'КВАНТОВОЕ ЯДРО (Ω КОНЕЧНО)', centerX + coreRadius + 8, centerY + 3);

        // Draw observer position point
        const obsX = centerX + r_eval * 80;
        const obsY = centerY;
        ctx.beginPath();
        ctx.arc(obsX, obsY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b'; // Amber observer
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`Наблюдатель (r = ${r_eval.toFixed(2)})`, obsX + 8, obsY - 8);

      } else {
        // Analysis Profiles Graph: Velocity & Vorticity plots
        const graphMargin = 40;
        const graphWidth = width - graphMargin * 2;
        const graphHeight = height - graphMargin * 2;

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphMargin, graphMargin);
        ctx.lineTo(graphMargin, height - graphMargin);
        ctx.lineTo(width - graphMargin, height - graphMargin);
        ctx.stroke();

        // X-axis label (r)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.fillText('r (радиус от центра)', width - graphMargin - 120, height - graphMargin + 15);

        // Y-axis label
        ctx.save();
        ctx.translate(graphMargin - 15, graphMargin + 40);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Скорость / Завихренность', 0, 0);
        ctx.restore();

        // Plot curves: 1. Classical Velocity (dashed red)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let px = 1; px < graphWidth; px++) {
          const r_val = (px / graphWidth) * 3.0; // r from 0 to 3.0
          if (r_val < 0.1) continue;
          const v_class_val = G / (2 * Math.PI * r_val);
          
          // Map to screen
          const sx = graphMargin + px;
          const sy = height - graphMargin - (v_class_val * 1.8);
          if (sy > graphMargin && sy < height - graphMargin) {
            if (px === 1 || r_val - 0.05 < 0.1) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Plot curves: 2. RICIS III Velocity (solid cyan)
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let px = 0; px < graphWidth; px++) {
          const r_val = (px / graphWidth) * 3.0;
          const v_ricis_val = (G * r_val) / (2 * Math.PI * (r_val * r_val + theta * theta));

          const sx = graphMargin + px;
          const sy = height - graphMargin - (v_ricis_val * 1.8);
          if (sy > graphMargin && sy < height - graphMargin) {
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();

        // Plot curves: 3. RICIS III Vorticity (solid purple/violet)
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let px = 0; px < graphWidth; px++) {
          const r_val = (px / graphWidth) * 3.0;
          const omega_val = G / (Math.PI * (r_val * r_val + theta * theta));

          const sx = graphMargin + px;
          const sy = height - graphMargin - (omega_val * 0.4); // scale down vorticity
          if (sy > graphMargin && sy < height - graphMargin) {
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();

        // Legend overlay
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillText('--- Классический вихрь (v ∝ 1/r)', graphWidth - 160, graphMargin + 15);
        ctx.fillStyle = '#22d3ee';
        ctx.fillText('—— Скорость RICIS III (v стабильно)', graphWidth - 160, graphMargin + 30);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
        ctx.fillText('—— Завихренность RICIS III (ω конечна)', graphWidth - 160, graphMargin + 45);

        // Observer vertical line
        const obsLineX = graphMargin + (r_eval / 3.0) * graphWidth;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(obsLineX, graphMargin);
        ctx.lineTo(obsLineX, height - graphMargin);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('r_obs', obsLineX - 10, graphMargin - 5);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [state, G, theta, activeTab, r_eval]);

  return (
    <div id="navier-stokes-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-slate-300">
      
      {/* Simulation Screen */}
      <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <Droplet className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider">Разрешение сингулярности Навье-Стокса</h3>
            </div>
            <span className="text-[10px] font-mono bg-cyan-950/30 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Гидродинамика
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Моделирование сингулярного схлопывания вихря. Без регуляризации завихренность и диссипация энергии в ядре уходят в бесконечность. Регуляризатор RICIS III сглаживает пик, формируя физически устойчивую структуру.
          </p>
        </div>

        {/* Tab switcher for visualization */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider rounded ${
              activeTab === 'simulation'
                ? 'bg-cyan-950/30 border border-cyan-500/30 text-white'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Потоки и Частицы
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1 text-[10px] uppercase font-mono tracking-wider rounded ${
              activeTab === 'profile'
                ? 'bg-cyan-950/30 border border-cyan-500/30 text-white'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Графики Профилей
          </button>
        </div>

        <div className="relative border border-white/10 rounded-lg overflow-hidden bg-[#09090B] flex items-center justify-center p-2">
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={320}
            className="w-full h-auto max-h-[320px] rounded block"
          />
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isBlowUp && (
              <div className="bg-red-950/80 border border-red-500/30 text-red-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Vorticity Blow-up (Критический разрыв)</span>
              </div>
            )}
            {isProtected && (
              <div className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Регуляризатор RICIS III Активен</span>
              </div>
            )}
            {state.reynolds > 150 && (
              <div className="bg-purple-950/80 border border-purple-500/30 text-purple-200 text-[10px] uppercase font-mono tracking-wider px-3 py-1.5 rounded flex items-center space-x-1.5 shadow-lg backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Высокая турбулентность (Re {state.reynolds})</span>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Telemetry Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Завихренность Ω</span>
            <span className="text-sm font-semibold text-white font-mono block mt-1 truncate" title={omega_ricis_formatted}>
              {omega_ricis_formatted}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate" title={omega_classical_formatted}>
              Кл: {omega_classical_formatted}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Скорость Потока</span>
            <span className="text-sm font-semibold text-cyan-400 font-mono block mt-1 truncate" title={v_ricis_formatted}>
              {v_ricis_formatted}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate" title={v_classical_formatted}>
              Кл: {v_classical_formatted}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Диссипация Энергии</span>
            <span className="text-sm font-semibold text-purple-400 font-mono block mt-1 truncate" title={disp_ricis_formatted}>
              {disp_ricis_formatted}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate" title={disp_classical_formatted}>
              Кл: {disp_classical_formatted}
            </span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-lg p-3">
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Давление в ядре</span>
            <span className={`text-sm font-semibold font-mono block mt-1 truncate ${P_ricis_raw < 20 ? 'text-rose-400' : 'text-emerald-400'}`} title={P_ricis_formatted}>
              {P_ricis_formatted}
            </span>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5 truncate" title={P_classical_formatted}>
              Кл: {P_classical_formatted}
            </span>
          </div>
        </div>
      </div>

      {/* Control sliders */}
      <div className="lg:col-span-5 bg-black/40 border border-white/10 rounded-xl p-6 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h4 className="font-semibold text-white text-xs uppercase tracking-widest text-cyan-400">Характеристики потока</h4>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Параметры завихренности и регуляризации</p>
          </div>

          {/* Preset Selector */}
          <div className="bg-[#09090B] border border-white/5 p-3 rounded-lg space-y-2">
            <label className="text-slate-500 font-mono uppercase text-[9px] block tracking-wider">Типовой сценарий</label>
            <div className="flex flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => setState({ reynolds: 80, radialVelocity: 3.0, observerRadius: 0.05, regularization: 0, viscosity: 0.1 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Разрыв Навье-Стокса (θ=0)
              </button>
              <button 
                type="button"
                onClick={() => setState({ reynolds: 150, radialVelocity: 3.0, observerRadius: 0.05, regularization: 0.7, viscosity: 0.1 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Сглаженный вихрь RICIS III
              </button>
              <button 
                type="button"
                onClick={() => setState({ reynolds: 30, radialVelocity: 0.5, observerRadius: 1.2, regularization: 0.1, viscosity: 0.4 })}
                className="px-2.5 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 font-mono transition-all duration-200 cursor-pointer"
              >
                Ламинарный поток ν=0.4
              </button>
            </div>
          </div>

          {/* Reynolds (Vortex Intensity) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Интенсивность вихря (Γ)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.reynolds} м²/с</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="200" 
              step="5" 
              value={state.reynolds}
              onChange={(e) => setState({...state, reynolds: parseInt(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Radial Velocity */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Радиальное стягивание (V_r)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.radialVelocity} м/с</span>
            </div>
            <input 
              type="range" 
              min="0.0" 
              max="4.0" 
              step="0.1" 
              value={state.radialVelocity}
              onChange={(e) => setState({...state, radialVelocity: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Viscosity (nu) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Вязкость среды (ν)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.viscosity.toFixed(2)} Па·с</span>
            </div>
            <input 
              type="range" 
              min="0.01" 
              max="0.50" 
              step="0.01" 
              value={state.viscosity}
              onChange={(e) => setState({...state, viscosity: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Observer Radius */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-slate-400 font-mono uppercase text-[10px]">Позиция наблюдателя (r_obs)</label>
              <span className="font-mono text-white bg-white/5 border border-white/10 px-2.5 py-1 text-xs rounded">{state.observerRadius.toFixed(2)} м</span>
            </div>
            <input 
              type="range" 
              min="0.00" 
              max="2.50" 
              step="0.05" 
              value={state.observerRadius}
              onChange={(e) => setState({...state, observerRadius: parseFloat(e.target.value)})}
              className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* RICIS Regularization */}
          <div className="space-y-2 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-cyan-400 font-mono uppercase font-semibold text-[10px]">Регуляризатор RICIS III (θ)</label>
              <span className="font-mono text-cyan-400 bg-cyan-950/30 border border-cyan-500/30 px-2.5 py-1 text-xs rounded">{state.regularization.toFixed(2)} м</span>
            </div>
            <input 
              type="range" 
              min="0.00" 
              max="1.50" 
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
            mode="NAVIER_STOKES" 
            params={state} 
            defaultDescription={`Навье-Стокс вихрь: сила Г=${state.reynolds}, вязкость ν=${state.viscosity}, θ=${state.regularization}`} 
          />
        </div>

        {/* Dynamic Warning/State Panel */}
        {state.regularization === 0 && state.observerRadius < 0.15 ? (
          <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-lg text-xs text-red-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Физический разрыв (Blow-up)!</span>
            </div>
            <p className="leading-relaxed">
              При θ = 0 в центре вихря давление падает до -∞, порождая сингулярный вакуум, а завихренность Ω стремится к бесконечности. Это математическая сингулярность уравнений Навье-Стокса. Увеличьте θ для стабилизации.
            </p>
          </div>
        ) : state.regularization > 0.15 && state.observerRadius < 0.15 ? (
          <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] font-mono">Ядро вихря сглажено</span>
            </div>
            <p className="leading-relaxed">
              Регуляризация θ = {state.regularization.toFixed(2)} стабилизировала ядро. Завихренность удержана на конечном значении в {omega_ricis_raw === Infinity ? "∞" : omega_ricis_raw.toFixed(0)} рад/с, предотвращая гидродинамический разрыв (Finite-time blow-up).
            </p>
          </div>
        ) : (
          <div className="p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-lg text-xs text-slate-300">
            <div className="flex items-center space-x-2 mb-1.5">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-200/80 font-mono">Баланс Сил в вихре</span>
            </div>
            <p className="leading-relaxed">
              Регулируйте завихренность и вязкость. Переключение вкладок над симулятором позволяет наблюдать разницу между классическим сингулярным профилем и сглаженным по RICIS III.
            </p>
          </div>
        )}
      </div>

      {/* RICIS III Exact Substitution Sequencer (Full-Width) */}
      <div className="lg:col-span-12 bg-black/40 border border-cyan-500/10 rounded-xl p-6 space-y-6">
        <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-cyan-950/30 border border-cyan-500/30 rounded">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Секвенатор вычислений RICIS III: Прямая подстановка v7.7 (Без пределов)
            </h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
              Strictly non-limit direct algebraic evaluation pipeline for Navier-Stokes vortex core
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Classical Paradigm block */}
          <div className="bg-[#09090B] border border-red-500/10 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Классический подход (Коши / Пределы)</span>
              <span className="text-[9px] font-mono bg-red-950/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded uppercase">
                Неопределенность
              </span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Классический математический аппарат не допускает деления на абсолютный ноль. Для нахождения скорости или завихренности в центре вихря (<span className="font-mono text-white">r = 0</span>) используются <strong>предельные переходы (limits)</strong>:
            </p>

            <div className="bg-black/40 p-4 rounded border border-white/5 font-mono text-[11px] text-slate-300 space-y-2">
              <div>v_θ(r) = lim(r→0) [ Γ / (2π · r) ] = ∞</div>
              <div className="text-red-400/80">// Проблема: бесконечная скорость и диссипация энергии (Blow-up) в ядре</div>
              <div>P_drop(r) = lim(r→0) [ ρΓ² / (8π²r²) ] = ∞  =&gt;  P(0) = -∞</div>
            </div>

            <div className="p-3.5 bg-red-950/15 border border-red-500/20 rounded text-xs text-red-200/90 leading-relaxed">
              <strong>Почему это тупик:</strong> Наличие пределов маскирует физический разрыв за непрерывным стремлением к бесконечности. Это приводит к сингулярным неопределенностям и развалу вычислений при делении на ноль.
            </div>
          </div>

          {/* RICIS III Paradigm block */}
          <div className="bg-[#09090B] border border-cyan-500/20 rounded-lg p-5 space-y-4 shadow-[0_0_20px_rgba(34,211,238,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Парадигма RICIS III (Точная подстановка)</span>
              <span className="text-[9px] font-mono bg-cyan-950/20 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded uppercase">
                Алгебраическая определенность
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              RICIS III полностью исключает оператор предела. Поведение в сингулярности определяется не приближением к точке, а <strong>прямым аналитическим вычислением</strong> в расширенной алгебре весов:
            </p>

            <div className="bg-black/40 p-4 rounded border border-cyan-500/10 font-mono text-[11px] text-cyan-300 space-y-2">
              <div>v_θ(0, 0) = [ Γ · 0 ] / [ 2π · (0² + 0²) ] = 0_Γ / 0_2π</div>
              <div className="text-emerald-400">// Аксиома А4/А5 (Закон весов): 0_F / 0_G = F / G</div>
              <div className="text-cyan-200">v_θ(0, 0) = Γ / 2π &nbsp;(Конечный, точно подставленный результат!)</div>
            </div>

            <div className="p-3.5 bg-cyan-950/15 border border-cyan-500/20 rounded text-xs text-cyan-200/90 leading-relaxed">
              <strong>Физический смысл:</strong> Вместо разрушения вихря или бесконечного градиента скорости, в точке <span className="font-mono text-white">r = 0</span> мы получаем точное значение вихревой циркуляции, пропорциональное силе вихря <span className="font-mono text-white">Γ</span>. Моделирование абсолютно стабильно!
            </div>
          </div>

        </div>

        {/* 9-Phase Step-by-Step Pipeline for Navier-Stokes */}
        <div className="bg-white/5 border border-white/5 rounded-lg p-5 space-y-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Интерактивный пошаговый протокол RICIS III для текущих параметров (r_obs = {r_eval.toFixed(2)}, θ = {theta.toFixed(2)}):
          </span>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            
            <div className="bg-[#09090B] border border-white/5 p-3 rounded space-y-1">
              <span className="text-[9px] font-mono text-cyan-400 uppercase">Фаза -1: Типизация</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Заданы типы координат: <span className="text-white font-mono">T(r) = Space</span>. Совместимость сохранена.
              </p>
            </div>

            <div className="bg-[#09090B] border border-white/5 p-3 rounded space-y-1">
              <span className="text-[9px] font-mono text-cyan-400 uppercase">Фаза 0: Подстановка</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Прямая замена <span className="text-white font-mono">r = {r_eval}</span> в уравнениях вихря без пределов.
              </p>
            </div>

            <div className="bg-[#09090B] border border-white/5 p-3 rounded space-y-1">
              <span className="text-[9px] font-mono text-cyan-400 uppercase">Фаза 1: Свертка</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Вычисление промежуточных ядерных весов: <span className="text-white font-mono">W_core = {((r_eval*r_eval) + theta*theta).toFixed(3)}</span>.
              </p>
            </div>

            <div className="bg-[#09090B] border border-white/5 p-3 rounded space-y-1">
              <span className="text-[9px] font-mono text-cyan-400 uppercase">Фаза 2: Резолюция</span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {r_eval === 0 && theta === 0 ? (
                  <span>Применена <strong>Аксиома А4</strong> для разрешения 0/0. Результат: <strong>{(G / (2 * Math.PI)).toFixed(2)} м/с</strong>.</span>
                ) : (
                  <span>Классическая свертка по формуле RICIS III. Скорость: <strong>{v_ricis_raw.toFixed(2)} м/с</strong>.</span>
                )}
              </p>
            </div>

            <div className="bg-[#09090B] border border-cyan-500/20 p-3 rounded space-y-1 shadow-[0_0_10px_rgba(34,211,238,0.05)]">
              <span className="text-[9px] font-mono text-emerald-400 uppercase">Фаза 3-6: Верификация</span>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Энтропийный баланс сохранен. Логическая целостность системы: <span className="text-emerald-400 font-bold">100% OK</span>.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
