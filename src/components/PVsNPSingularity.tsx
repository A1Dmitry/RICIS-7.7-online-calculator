/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { PVsNPState } from '../types';
import { Sparkles, Shield, Cpu, HelpCircle, Activity, Play, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface PVsNPSingularityProps {
  preset?: PVsNPState;
  onChangeState?: (state: PVsNPState) => void;
}

export default function PVsNPSingularity({ preset, onChangeState }: PVsNPSingularityProps = {}) {
  const [state, setState] = useState<PVsNPState>({
    dimension: 40,           // Problem size N
    ruggedness: 0.6,         // Landscape sharp minima
    regularization: 0.35,    // RICIS theta
    algorithmSpeed: 1.0
  });

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simTime, setSimTime] = useState<number>(0);

  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  useEffect(() => {
    onChangeState?.(state);
  }, [state, onChangeState]);

  const landscapeCanvasRef = useRef<HTMLCanvasElement>(null);
  const scalingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Animation Loop
  useEffect(() => {
    let animId: number;
    if (isRunning) {
      const update = () => {
        setSimTime((prev) => prev + 0.02 * state.algorithmSpeed);
        animId = requestAnimationFrame(update);
      };
      animId = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animId);
  }, [isRunning, state.algorithmSpeed]);

  // Render Landscape and Path Finding Animation
  useEffect(() => {
    const canvas = landscapeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    const N = state.dimension;
    const rugged = state.ruggedness;
    const theta = state.regularization;

    // Drawing Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Generate the rugged NP discrete landscape curve vs the regularized P continuous curve
    // f(x) = sin(4x) * rugged * sin(15x) + quadratic potential
    const getLandscapeY = (xVal: number, isRicis: boolean) => {
      const normX = (xVal - width / 2) / 100; // -2 to 2 range
      const baseBasin = 0.08 * normX * normX; // Quadratic global basin
      
      // Local minima (ruggedness)
      let localMin = 0;
      if (isRicis) {
        // Under RICIS, local minima are regularized: the amplitude of oscillations is suppressed by theta
        // effectively smoothing out sharp sub-optimal basins
        const smoothingFactor = 1 / (1 + (theta * 10.0));
        localMin = rugged * 0.3 * Math.sin(3 * normX) * Math.sin(12 * normX) * smoothingFactor;
      } else {
        // Pure unregularized discrete rugged landscape (sharp and non-convex)
        localMin = rugged * 0.3 * Math.sin(3 * normX) * Math.sin(12 * normX);
      }

      const rawVal = baseBasin + localMin; // -1 to 1 approx
      // Map to canvas coordinates
      return height / 2 + rawVal * 160;
    };

    // Draw unregularized discrete landscape (Red dashed line / dark red shading)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y = getLandscapeY(x, false);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw regularized RICIS continuous landscape (Green/Cyan gradient)
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.8)');
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.9)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.8)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const y = getLandscapeY(x, true);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw global optimum indicator
    const globalOptX = width / 2;
    const globalOptY = getLandscapeY(globalOptX, true);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.beginPath();
    ctx.arc(globalOptX, globalOptY, 15 + Math.sin(simTime * 5) * 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw Local Minima Trap indicators (where classical NP solver gets stuck)
    const trapX1 = width / 2 - 120;
    const trapY1 = getLandscapeY(trapX1, false);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.beginPath();
    ctx.arc(trapX1, trapY1, 8, 0, 2 * Math.PI);
    ctx.stroke();

    // Animate Classical Algorithm Particle (Red)
    // It starts at some point and rolls down, getting trapped in local minimum
    const classStartX = width / 2 - 190;
    const classRangeX = 70; // gets stuck at trapX1
    const classProgress = Math.min(1.0, (simTime % 4) / 2.5);
    const classX = classStartX + classProgress * classRangeX;
    const classY = getLandscapeY(classX, false);

    ctx.fillStyle = '#EF4444';
    ctx.shadowColor = '#EF4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(classX, classY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label for Classical Particle
    ctx.fillStyle = '#F87171';
    ctx.font = '9px monospace';
    ctx.fillText('CLASSICAL (TRAIL TRAPPED: NP)', classX - 50, classY - 12);

    // Animate RICIS Regularized Particle (Cyan)
    // Thanks to theta-regularization, it smoothly bypasses the local traps and converges to the Global Optimum!
    const ricisStartX = width / 2 - 190;
    const ricisRangeX = 190; // goes all the way to globalOptX
    const ricisProgress = Math.min(1.0, (simTime % 4) / 3.0);
    const ricisX = ricisStartX + ricisProgress * ricisRangeX;
    const ricisY = getLandscapeY(ricisX, true);

    ctx.fillStyle = '#06B6D4';
    ctx.shadowColor = '#06B6D4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ricisX, ricisY, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label for RICIS Particle
    ctx.fillStyle = '#22D3EE';
    ctx.font = '9px monospace';
    ctx.fillText('RICIS FLOW (CONVEX P-PATH)', ricisX - 50, ricisY - 14);

    // Title overlays
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('МНОГОМЕРНЫЙ ЛАНДШАФТ СЛОЖНОСТИ (NP-ЛАНДШАФТ)', 12, 18);
    ctx.fillText(`СГЛАЖИВАНИЕ θ = ${theta.toFixed(3)}`, 12, 30);

  }, [state, simTime]);

  // Render Complexity Scaling Graph
  useEffect(() => {
    const canvas = scalingCanvasRef.current;
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
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const maxN = 100;
    const theta = state.regularization;

    // Plot curves: 
    // 1. Classical Exponential Complexity: Time = 2^(N/10)
    // 2. RICIS Polynomial Complexity: Time = N^2 / (1 + theta*5)
    
    // Draw Classical Exponential (Red)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const N_val = (i / width) * maxN;
      const complexity = Math.pow(2, N_val / 12); // exponential scaling
      const canvasY = height - 15 - (complexity / 250) * (height - 30);
      
      if (i === 0) ctx.moveTo(i, canvasY);
      else if (canvasY >= 0) ctx.lineTo(i, canvasY);
    }
    ctx.stroke();

    // Draw RICIS Polynomial (Emerald)
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const N_val = (i / width) * maxN;
      // regularized polynomial time complexity: O(N^k) where k effectively shrinks with larger theta
      const k = 2.0 / (1.0 + theta * 1.5);
      const complexity = Math.pow(N_val, k) * 0.8;
      const canvasY = height - 15 - (complexity / 250) * (height - 30);

      if (i === 0) ctx.moveTo(i, canvasY);
      else ctx.lineTo(i, canvasY);
    }
    ctx.stroke();

    // Draw active dimension line
    const activeX = (state.dimension / maxN) * width;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(activeX, 0);
    ctx.lineTo(activeX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve Labels
    ctx.fillStyle = '#EF4444';
    ctx.font = '8px monospace';
    ctx.fillText('ЭКСПОНЕНТА O(2^N)', 10, 40);

    ctx.fillStyle = '#10B981';
    ctx.fillText(`RICIS ПОЛИНОМ O(N^${(2.0 / (1.0 + theta * 1.5)).toFixed(2)})`, 10, 60);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('ВРЕМЯ ВЫЧИСЛЕНИЙ vs РАЗМЕР ЗАДАЧИ N', 10, 18);

  }, [state]);

  const handleSliderChange = (key: keyof PVsNPState, value: number) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const getTheoreticalStatus = () => {
    if (state.regularization === 0) {
      return { text: 'СИНГУЛЯРНЫЙ БАРЬЕР (P ≠ NP)', style: 'text-red-400 bg-red-950/20 border-red-500/30' };
    } else if (state.regularization < 0.2) {
      return { text: 'КВАЗИ-СИНГУЛЯРНЫЙ ПЕРЕХОД', style: 'text-amber-400 bg-amber-950/20 border-amber-500/30' };
    } else {
      return { text: 'ПОЛИНОМИАЛЬНЫЙ СИНТЕЗ (P = NP)', style: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30' };
    }
  };

  const statusInfo = getTheoreticalStatus();

  return (
    <div id="p-vs-np-module" className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-black/10 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
      
      {/* Visual Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Control Panel (4 cols) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">
              Класс сложности P vs NP (RICIS-резолюция)
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Проблема P vs NP решается в RICIS III переносом дискретной NP-задачи комбинаторного поиска в непрерывное гладкое фазовое многообразие с параметром регуляризации <code className="text-cyan-400 font-mono">θ</code>.
          </p>

          <div className={`p-3 rounded-lg border text-center font-mono text-[10px] uppercase tracking-wider font-bold ${statusInfo.style}`}>
            Статус решения: {statusInfo.text}
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Размер задачи (N)</span>
                <span className="text-cyan-400">{state.dimension} переменных</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={state.dimension}
                onChange={(e) => handleSliderChange('dimension', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
                <span>10 (Быстро)</span>
                <span>100 (Критично)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Зашумленность ландшафта</span>
                <span className="text-cyan-400">{(state.ruggedness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={state.ruggedness}
                onChange={(e) => handleSliderChange('ruggedness', parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
                <span>Слабая</span>
                <span>Сильная (Ловушки)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  Регуляризатор RICIS (θ)
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
                <span>0 (Дискретно, NP)</span>
                <span>1.00 (Сверхгладко, P)</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isRunning ? 'Пауза' : 'Пуск'}</span>
              </button>
              <button
                onClick={() => setState({ dimension: 40, ruggedness: 0.6, regularization: 0.35, algorithmSpeed: 1.0 })}
                className="text-[9px] text-slate-500 hover:text-slate-300 underline font-mono cursor-pointer"
              >
                Сбросить параметры
              </button>
            </div>
          </div>
        </div>

        {/* Google Sheets integration */}
        <div>
          <ExportToSheetsButton 
            mode="P_VS_NP" 
            params={state} 
            defaultDescription={`RICIS P vs NP Резолюция: N=${state.dimension}, Шум=${state.ruggedness}, θ=${state.regularization}`} 
          />
        </div>
      </div>

      {/* Visualizations (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Plot: Multi-dimensional landscape */}
          <div className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2 self-start">Фазовая симуляция траектории</span>
            <canvas
              ref={landscapeCanvasRef}
              width={320}
              height={220}
              className="w-full h-48 bg-black/50 border border-white/5 rounded"
            />
            <p className="text-[9px] text-slate-500 mt-2 text-center leading-relaxed">
              Красная сфера (классика) застревает в первой же локальной яме. Бирюзовая сфера (RICIS flow) легко преодолевает барьеры за счет деформации ландшафта и находит глобальный минимум.
            </p>
          </div>

          {/* Right Plot: Scaling Curve */}
          <div className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2 self-start">Оценка временной сложности</span>
            <canvas
              ref={scalingCanvasRef}
              width={320}
              height={220}
              className="w-full h-48 bg-black/50 border border-white/5 rounded"
            />
            <p className="text-[9px] text-slate-500 mt-2 text-center leading-relaxed">
              Зависимость времени вычисления от количества переменных <code className="text-slate-300">N</code>. При <code className="text-emerald-400">θ &gt; 0</code> экспонента подавляется в пользу полинома.
            </p>
          </div>

        </div>

        {/* Informational Panel */}
        <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Математический Аппарат RICIS P = NP</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Классический тупик:</span>
              <p className="text-slate-300 leading-relaxed">
                Дискретные графы и булевы формулы не подлежат дифференцированию. Дискретный ландшафт содержит локальные экстремумы, преодоление которых в худшем случае требует полного перебора:
                <code className="block bg-black/40 text-red-400 p-1 rounded font-mono text-[10px] mt-1 text-center">T(N) = O(2^N)</code>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Резолюция RICIS III:</span>
              <p className="text-slate-300 leading-relaxed">
                Дискретные состояния заменяются непрерывными плотностями вероятности. Динамическая система ОДУ с гамильтонианом, возмущенным на <code className="text-emerald-400">θ</code>, сходится строго полиномиально:
                <code className="block bg-black/40 text-emerald-400 p-1 rounded font-mono text-[10px] mt-1 text-center">T_RICIS(N) = O(N^(2 / (1+1.5θ)))</code>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
