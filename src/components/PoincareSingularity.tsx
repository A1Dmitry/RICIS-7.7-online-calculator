/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PoincareState } from '../types';
import { Sparkles, Shield, Compass, HelpCircle, Activity, Globe, Disc, Loader2 } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface PoincareSingularityProps {
  preset?: PoincareState;
  onChangeState?: (state: PoincareState) => void;
}

export default function PoincareSingularity({ preset, onChangeState }: PoincareSingularityProps = {}) {
  const [state, setState] = useState<PoincareState>({
    neckRadius: 0.3,         // Bottleneck neck size
    flowTime: 0.2,           // Ricci flow evolution t
    regularization: 0.25,    // RICIS theta parameter
    mode: 'neckpinch'
  });

  const [simTime, setSimTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (preset) {
      setState(prev => ({ ...prev, ...preset }));
    }
  }, [preset]);

  const lastSentStateRef = useRef<string>('');

  useEffect(() => {
    const serialized = JSON.stringify(state);
    if (serialized !== lastSentStateRef.current) {
      lastSentStateRef.current = serialized;
      onChangeState?.(state);
    }
  }, [state, onChangeState]);

  const manifoldCanvasRef = useRef<HTMLCanvasElement>(null);
  const curvatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-evolution loop
  useEffect(() => {
    let animId: number;
    if (isRunning) {
      const tick = () => {
        // Evolve flowTime smoothly to show the dynamics
        setState((prev) => {
          let nextTime = prev.flowTime + 0.003;
          if (nextTime > 1.5) nextTime = 0.0; // Loop back
          return { ...prev, flowTime: nextTime };
        });
        setSimTime((t) => t + 0.02);
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animId);
  }, [isRunning]);

  // Draw Manifold under Ricci Flow (Left Canvas)
  useEffect(() => {
    const canvas = manifoldCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const cx = width / 2;
    const cy = height / 2;
    const t = state.flowTime;
    const theta = state.regularization;
    const initialNeck = state.neckRadius;

    // We draw a 3D-like shaded dumbbell that evolves into a sphere
    // Radius along x-axis r(x) = baseRadius * (1 - exp(-(x^2 / s))) or similar dumbbell formula
    const getRadiusAtX = (x: number) => {
      // x goes from -150 to 150
      const normX = x / 150;
      
      // Initial shape of dumbbell: thin neck in the middle
      const dumbbellFactor = 0.35 + 0.65 * normX * normX; 

      // Classical Ricci flow contracts the neck: r_t = sqrt(r_0^2 - 2t)
      // RICIS Ricci flow: r_t_ricis = sqrt(r_0^2 - 2t + theta^2)
      const baseTerm = initialNeck * initialNeck - 2.0 * t * 0.1;
      
      let neckRadiusCurrent = 0;
      if (theta === 0) {
        // Classical: collapses to 0 and becomes imaginary/singular
        neckRadiusCurrent = baseTerm <= 0 ? 0 : Math.sqrt(baseTerm);
      } else {
        // RICIS: bottleneck is bounded from below by theta
        neckRadiusCurrent = Math.sqrt(Math.max(0.001, baseTerm + theta * theta));
      }

      // Smooth interpolation from dumbbell to sphere as t -> 1.5
      const sphereFactor = Math.min(1.0, t / 1.2);
      const targetSphereRadius = Math.sqrt(1.0 - normX * normX);

      const dumbbellRadius = 70 * (normX * normX * 0.8 + neckRadiusCurrent);
      const sphereRadius = 75 * (normX * normX <= 1.0 ? targetSphereRadius : 0);

      const finalRadius = dumbbellRadius * (1.0 - sphereFactor) + sphereRadius * sphereFactor;

      return Math.max(1, finalRadius);
    };

    // Draw the shaded 3D mesh
    ctx.lineWidth = 1.5;
    
    // Draw horizontal slices
    for (let x = -130; x <= 130; x += 6) {
      const rx = getRadiusAtX(x);
      const px = cx + x;

      // Draw ellipse slice
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.15 + (1.0 - Math.abs(x)/130) * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(px, cy, 3, rx, 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw boundary outline with gradient
    const boundaryGrad = ctx.createLinearGradient(cx - 130, 0, cx + 130, 0);
    boundaryGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    boundaryGrad.addColorStop(0.5, theta === 0 && t > 0.45 ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.8)');
    boundaryGrad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');

    ctx.strokeStyle = boundaryGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Top boundary
    for (let x = -130; x <= 130; x++) {
      const rx = getRadiusAtX(x);
      if (x === -130) ctx.moveTo(cx + x, cy - rx);
      else ctx.lineTo(cx + x, cy - rx);
    }
    // Bottom boundary
    for (let x = 130; x >= -130; x--) {
      const rx = getRadiusAtX(x);
      ctx.lineTo(cx + x, cy + rx);
    }
    ctx.closePath();
    ctx.stroke();

    // Fill background of the manifold
    ctx.fillStyle = 'rgba(6, 182, 212, 0.03)';
    ctx.fill();

    // If classical flow collapses neck entirely, draw a BIG RED singularity bolt
    const neckSizeNow = getRadiusAtX(0);
    if (theta === 0 && neckSizeNow <= 1) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.beginPath();
      ctx.arc(cx, cy, 25 + Math.sin(simTime * 6) * 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#EF4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('СИНГУЛЯРНОСТЬ NECHPINCH (МЕТРИЧЕСКИЙ КРАХ)', cx - 110, cy - 35);
      ctx.fillText('ТРЕБУЕТСЯ ХИРУРГИЯ ПЕРЕЛЬМАНА', cx - 75, cy + 45);
    } else {
      ctx.fillStyle = '#10B981';
      ctx.font = '9px monospace';
      ctx.fillText(`РАДИУС ПЕРЕШЕЙКА: ${neckSizeNow.toFixed(1)} px`, cx - 55, cy + 45);
    }

    // Descriptive overlay
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('ПОТОК РИЧЧИ ТРЁХМЕРНОГО МНОГООБРАЗИЯ', 12, 18);
    ctx.fillText(`ВРЕМЯ ЭВОЛЮЦИИ t = ${t.toFixed(3)}`, 12, 30);

  }, [state, simTime]);

  // Draw Curvature K along x-axis (Right Canvas)
  useEffect(() => {
    const canvas = curvatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const t = state.flowTime;
    const theta = state.regularization;
    const initialNeck = state.neckRadius;

    // Curvature K ~ 1 / r^2
    // Classical: K = 1 / (r_0^2 - 2t)
    // RICIS: K = 1 / (r_0^2 - 2t + theta^2)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();

    const cx = width / 2;
    const cy = height - 15;

    // Classical curvature plot (dashed red)
    for (let px = 0; px < width; px++) {
      const dx = (px - cx) / 25;
      const baseTerm = initialNeck * initialNeck - 2.0 * t * 0.1 + dx * dx * 0.1;
      let kVal = 0;
      if (baseTerm <= 0.001) {
        kVal = 500; // Infinity clamp
      } else {
        kVal = 1.0 / baseTerm;
      }

      const py = cy - kVal * 8;
      if (px === 0) ctx.moveTo(px, py >= 0 ? py : 0);
      else ctx.lineTo(px, py >= 0 ? py : 0);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // RICIS curvature plot (solid green)
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let px = 0; px < width; px++) {
      const dx = (px - cx) / 25;
      const baseTerm = initialNeck * initialNeck - 2.0 * t * 0.1 + dx * dx * 0.1 + theta * theta;
      const kVal = 1.0 / Math.max(0.005, baseTerm);

      const py = cy - kVal * 8;
      if (px === 0) ctx.moveTo(px, py >= 0 ? py : 0);
      else ctx.lineTo(px, py >= 0 ? py : 0);
    }
    ctx.stroke();

    // Central curvature point text
    const midBase = initialNeck * initialNeck - 2.0 * t * 0.1 + theta * theta;
    const centralCurvature = 1.0 / Math.max(0.005, midBase);

    ctx.fillStyle = '#10B981';
    ctx.font = '9px monospace';
    ctx.fillText(`ЦЕНТРАЛЬНАЯ КРИВИЗНА K: ${centralCurvature.toFixed(2)}`, 12, 18);
    ctx.fillStyle = '#EF4444';
    ctx.fillText('КЛАССИЧЕСКАЯ K (БЕЗ ХИРУРГИИ) -> ∞', 12, 30);

  }, [state]);

  const handleSliderChange = (key: keyof PoincareState, value: number) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const getTheoreticalStatus = () => {
    if (state.regularization === 0) {
      return { text: 'МЕТРИЧЕСКИЙ РАЗРЫВ (ТРЕБУЕТСЯ ХИРУРГИЯ)', style: 'text-red-400 bg-red-950/20 border-red-500/30' };
    } else if (state.regularization < 0.2) {
      return { text: 'КВАЗИ-ПИНЧ ЭВОЛЮЦИЯ', style: 'text-amber-400 bg-amber-950/20 border-amber-500/30' };
    } else {
      return { text: 'ГЛАДКАЯ ГОМЕОМОРФНАЯ ДЕФОРМАЦИЯ', style: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30' };
    }
  };

  const statusInfo = getTheoreticalStatus();

  return (
    <div id="poincare-module" className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-black/10 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
      
      {/* Decorative backdrop */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Control Panel (4 cols) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">
              Потоки Риччи и Сфера Пуанкаре
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            В RICIS III поток Риччи, деформирующий трёхмерное многообразие, защищается от разрывов перешейка (neckpinch) регуляризатором <code className="text-cyan-400 font-mono">θ</code>. Сингулярность не образуется, и хирургия не требуется.
          </p>

          <div className={`p-3 rounded-lg border text-center font-mono text-[10px] uppercase tracking-wider font-bold ${statusInfo.style}`}>
            СТАТУС ТОПОЛОГИИ: {statusInfo.text}
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Радиус перешейка r_0</span>
                <span className="text-cyan-400">{state.neckRadius.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={state.neckRadius}
                onChange={(e) => handleSliderChange('neckRadius', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Время эволюции (t)</span>
                <span className="text-cyan-400">t = {state.flowTime.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.01"
                value={state.flowTime}
                onChange={(e) => handleSliderChange('flowTime', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  Масштаб деформации (θ)
                  {state.regularization === 0 && <span className="text-[8px] bg-red-950 text-red-400 px-1 py-0.2 rounded border border-red-500/20 uppercase">Singular</span>}
                </span>
                <span className="text-emerald-400 font-bold">θ = {state.regularization.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={state.regularization}
                onChange={(e) => handleSliderChange('regularization', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
                <span>0 (Крах метрики)</span>
                <span>1.00 (Гладкая сфера)</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isRunning ? 'Пауза' : 'Пуск'}</span>
              </button>
              <button
                onClick={() => setState({ neckRadius: 0.3, flowTime: 0.2, regularization: 0.25, mode: 'neckpinch' })}
                className="text-[9px] text-slate-500 hover:text-slate-300 underline font-mono cursor-pointer"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Google Sheets export button */}
        <div>
          <ExportToSheetsButton 
            mode="POINCARE" 
            params={state} 
            defaultDescription={`RICIS Поток Риччи: Радиус=${state.neckRadius}, t=${state.flowTime}, θ=${state.regularization}`} 
          />
        </div>
      </div>

      {/* Visualizations (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left plot: Dumbbell manifold */}
          <div className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2 self-start">Геометрическая структура многообразия</span>
            <canvas
              ref={manifoldCanvasRef}
              width={320}
              height={220}
              className="w-full h-48 bg-black/50 border border-white/5 rounded"
            />
            <p className="text-[9px] text-slate-500 mt-2 text-center leading-relaxed">
              3D сечение многообразия в процессе потока Риччи. При <code className="text-emerald-400">θ &gt; 0</code> перешеек сужается плавно и округляется, переходя в сферу без разрывов.
            </p>
          </div>

          {/* Right plot: Curvature along axis */}
          <div className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2 self-start">Распределение кривизны K вдоль оси</span>
            <canvas
              ref={curvatureCanvasRef}
              width={320}
              height={220}
              className="w-full h-48 bg-black/50 border border-white/5 rounded"
            />
            <p className="text-[9px] text-slate-500 mt-2 text-center leading-relaxed">
              Кривизна перешейка. Красный пунктир (классика) уходит в бесконечность при <code className="text-red-400">t &gt; 0.45</code>. Зелёная кривая (RICIS) остаётся гладкой и ограниченной.
            </p>
          </div>

        </div>

        {/* Informational Panel */}
        <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Сущность Ricci Flow без хирургии в RICIS III</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Классический neckpinch:</span>
              <p className="text-slate-300 leading-relaxed">
                Поток Риччи ∂_t g_ij = -2 R_ij стягивает горловины быстрее, чем остальную часть сферы, порождая сингулярности бесконечной плотности кривизны, что требует разрезания (хирургии Перельмана).
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">RICIS регуляризация:</span>
              <p className="text-slate-300 leading-relaxed">
                Добавление в метрику масштаба натяжения <code className="text-emerald-400">θ</code> даёт несингулярную эволюцию. Перешеек никогда не схлопывается до нуля. Многообразие гладко разглаживается в идеальную трёхмерную сферу.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
