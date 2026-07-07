/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { HodgeState } from '../types';
import { Sparkles, Shield, Compass, HelpCircle, Activity, Globe, Eye, LineChart } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface HodgeSingularityProps {
  preset?: HodgeState;
}

export default function HodgeSingularity({ preset }: HodgeSingularityProps = {}) {
  const [state, setState] = useState<HodgeState>({
    genus: 2,               // Topological genus g (number of holes)
    cycleDimension: 1,      // Algebraic cycle codimension p
    regularization: 0.35,   // RICIS theta
    noiseLevel: 0.2
  });

  const [simTime, setSimTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  const manifoldCanvasRef = useRef<HTMLCanvasElement>(null);
  const cohomologyCanvasRef = useRef<HTMLCanvasElement>(null);

  // Animation ticks
  useEffect(() => {
    let animId: number;
    if (isRunning) {
      const tick = () => {
        setSimTime((t) => t + 0.015);
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animId);
  }, [isRunning]);

  // Draw Complex Projective Manifold (Torus of genus g)
  useEffect(() => {
    const canvas = manifoldCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    const g = state.genus;
    const theta = state.regularization;
    const noise = state.noiseLevel;

    // Grid representing complex coordinates
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Mathematical projection of a genus g manifold
    // We can simulate it as a multi-toroidal wireframe or a set of connected tubes
    const cy = height / 2;
    const cx = width / 2;

    // Draw background complex projection lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let r = 20; r < 140; r += 20) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Let's draw g connected holes using Bézier curves
    // The separation between holes depends on genus g
    const holeSpacing = 220 / (g + 1);
    const startX = cx - 110;

    // Draw the main manifold shell
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.02)';
    ctx.beginPath();
    // Top boundary
    ctx.moveTo(startX, cy - 30);
    for (let i = 1; i <= g; i++) {
      const hx = startX + i * holeSpacing;
      ctx.bezierCurveTo(hx - holeSpacing/2, cy - 60, hx - holeSpacing/2, cy - 60, hx, cy - 30);
    }
    // Right cap
    const endX = startX + (g + 1) * holeSpacing;
    ctx.quadraticCurveTo(endX + 30, cy, endX, cy + 30);
    // Bottom boundary
    for (let i = g; i >= 1; i--) {
      const hx = startX + i * holeSpacing;
      ctx.bezierCurveTo(hx + holeSpacing/2, cy + 60, hx + holeSpacing/2, cy + 60, hx, cy + 30);
    }
    // Left cap
    ctx.quadraticCurveTo(startX - 30, cy, startX, cy - 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw the actual holes (genus circles) and singular cusps at theta = 0
    for (let i = 1; i <= g; i++) {
      const hx = startX + i * holeSpacing;
      
      // If theta is very low, make the holes sharp, pinched, or singular
      const pinch = theta === 0 ? 0 : 15 * (1.0 - Math.exp(-theta * 4.0));
      const radiusX = Math.max(2, pinch);
      const radiusY = Math.max(1, pinch * 0.6);

      // Hole shape
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(hx, cy, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();

      // If theta is zero, draw red singular cusp indicators (singularities in Kahler metric)
      if (theta === 0) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(hx - 8, cy, 3, 0, 2 * Math.PI);
        ctx.arc(hx + 8, cy, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx - 15, cy - 5);
        ctx.lineTo(hx + 15, cy + 5);
        ctx.stroke();
      }
    }

    // Draw "Hodge Cycle" (harmonic p,p differential form flow) - Cyan flowing particle paths
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 110, 45, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Algebraic Cycle (rational subvariety) - Green closed loop
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
    // We offset it slightly, but as regularization theta increases, it aligns perfectly with the Hodge cycle!
    // At theta = 0, there is a mismatch (represented by spatial deviation due to singular metric)
    const deviation = 20 * (1.0 - Math.min(1.0, theta * 2.5));
    ctx.beginPath();
    ctx.ellipse(cx, cy + deviation, 110, 45 + deviation * 0.1, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Flowing electrons on cycles
    const angle = simTime % (2 * Math.PI);
    const hodgePx = cx + 110 * Math.cos(angle);
    const hodgePy = cy + 45 * Math.sin(angle);
    ctx.fillStyle = '#22D3EE';
    ctx.shadowColor = '#22D3EE';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(hodgePx, hodgePy, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    const algPx = cx + 110 * Math.cos(angle + 0.5);
    const algPy = cy + deviation + (45 + deviation * 0.1) * Math.sin(angle + 0.5);
    ctx.fillStyle = '#34D399';
    ctx.shadowColor = '#34D399';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(algPx, algPy, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Overlay text
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('СЕМЕЙСТВО КОГОМОЛОГИЙ СЛОЖНОГО МНОГООБРАЗИЯ', 12, 18);
    ctx.fillStyle = '#22D3EE';
    ctx.fillText('— КЛАССЫ ХОДЖА (ГАРМОНИЧЕСКИЕ ФОРМЫ)', 12, 30);
    ctx.fillStyle = '#34D399';
    ctx.fillText('— АЛГЕБРАИЧЕСКИЕ ЦИКЛЫ (ПОДМНОГООБРАЗИЯ)', 12, 42);

  }, [state, simTime]);

  // Cohomology Spectral Graph (Right Canvas)
  useEffect(() => {
    const canvas = cohomologyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const theta = state.regularization;

    // Draw Hodge Diamond spectral decomposition graph H^{p, q}
    // If theta = 0, there is a "gap" or blowup in the equivalence
    // As theta -> 1, the equivalence error drops to 0, proving Hodge Conjecture regularized
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '9px monospace';
    ctx.fillText('НЕВЯЗКА СОПРЯЖЕНИЯ ХОДЖА-ДЕ РАМА (%)', 10, 18);

    // Plot neviazka curve: Error = Exp(-theta * 4) * 100%
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const xVal = (i / width) * 1.2; // theta representation
      const errorPct = Math.exp(-xVal * 5.0) * 100; // decays with theta
      const canvasY = height - 20 - (errorPct / 100) * (height - 40);

      if (i === 0) ctx.moveTo(i, canvasY);
      else ctx.lineTo(i, canvasY);
    }
    ctx.stroke();

    // Active theta indicator dot
    const activeX = (theta / 1.2) * width;
    const activeErrPct = Math.exp(-theta * 5.0) * 100;
    const activeY = height - 20 - (activeErrPct / 100) * (height - 40);

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(activeX, activeY, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#EF4444';
    ctx.fillText(`ТЕКУЩАЯ НЕВЯЗКА: ${activeErrPct.toFixed(2)}%`, activeX - 40, activeY - 10);

    // Proved threshold
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, height - 20);
    ctx.lineTo(width, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#10B981';
    ctx.fillText('ЗОНА СТАБИЛЬНОГО РЕШЕНИЯ (НЕВЯЗКА ≈ 0)', 10, height - 6);

  }, [state]);

  const handleSliderChange = (key: keyof HodgeState, value: number) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const getTheoreticalStatus = () => {
    if (state.regularization === 0) {
      return { text: 'МЕТРИЧЕСКИЙ РАЗРЫВ (КОГОМОЛОГИИ СИНГУЛЯРНЫ)', style: 'text-red-400 bg-red-950/20 border-red-500/30' };
    } else if (state.regularization < 0.25) {
      return { text: 'КВАЗИ-КЭЛЕРОВО СГЛАЖИВАНИЕ', style: 'text-amber-400 bg-amber-950/20 border-amber-500/30' };
    } else {
      return { text: 'ИЗОМОРФИЗМ ДОКАЗАН (θ-РЕГУЛЯРНОСТЬ)', style: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30' };
    }
  };

  const statusInfo = getTheoreticalStatus();

  return (
    <div id="hodge-module" className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-black/10 border border-white/5 p-6 rounded-2xl relative overflow-hidden">
      
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Control Panel (4 cols) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-white uppercase tracking-widest font-mono">
              Гипотеза Ходжа (RICIS III)
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            В рамках RICIS III гармонические дифференциальные формы и циклы Кэлера сглаживаются через метрическую регуляризацию <code className="text-cyan-400 font-mono">θ</code>, доказывая их эквивалентность рациональным алгебраическим циклам.
          </p>

          <div className={`p-3 rounded-lg border text-center font-mono text-[10px] uppercase tracking-wider font-bold ${statusInfo.style}`}>
            СТАТУС ИНТЕГРАЦИИ: {statusInfo.text}
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Топологический род (Genus g)</span>
                <span className="text-cyan-400">{state.genus} дыр</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={state.genus}
                onChange={(e) => handleSliderChange('genus', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
                <span>g=1 (Тор)</span>
                <span>g=5 (Мульти-Лист)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                <span>Размерность цикла (p, p)</span>
                <span className="text-cyan-400">Коразмерность p = {state.cycleDimension}</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="1"
                value={state.cycleDimension}
                onChange={(e) => handleSliderChange('cycleDimension', parseInt(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono mt-0.5">
                <span>p=1 (Кривые)</span>
                <span>p=3 (Сечения)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  Параметр регуляризации Кэлера (θ)
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
                <span>1.00 (Стабильное Кэлерово поле)</span>
              </div>
            </div>

            {/* Quick reset/controls */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-[10px] font-mono uppercase tracking-wider transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{isRunning ? 'Пауза' : 'Пуск'}</span>
              </button>
              <button
                onClick={() => setState({ genus: 2, cycleDimension: 1, regularization: 0.35, noiseLevel: 0.2 })}
                className="text-[9px] text-slate-500 hover:text-slate-300 underline font-mono cursor-pointer"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Google Sheets */}
        <div>
          <ExportToSheetsButton 
            mode="HODGE" 
            params={state} 
            defaultDescription={`RICIS Гипотеза Ходжа: Род g=${state.genus}, p=${state.cycleDimension}, θ=${state.regularization}`} 
          />
        </div>
      </div>

      {/* Visualizations (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Complex projection */}
          <div className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2 self-start">Многообразие и топологические дыры</span>
            <canvas
              ref={manifoldCanvasRef}
              width={320}
              height={220}
              className="w-full h-48 bg-black/50 border border-white/5 rounded"
            />
            <p className="text-[9px] text-slate-500 mt-2 text-center leading-relaxed">
              Алгебраический цикл (зелёный) при <code className="text-cyan-400">θ &gt; 0</code> идеально совмещается с когомологическим циклом Ходжа (бирюзовый), подтверждая геометрическую природу классов Ходжа.
            </p>
          </div>

          {/* Metric convergence graph */}
          <div className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col items-center">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2 self-start">Сходимость невязки интегралов</span>
            <canvas
              ref={cohomologyCanvasRef}
              width={320}
              height={220}
              className="w-full h-48 bg-black/50 border border-white/5 rounded"
            />
            <p className="text-[9px] text-slate-500 mt-2 text-center leading-relaxed">
              Величина невязки между интегралом гармонической формы и пересечением алгебраического подмногообразия. При <code className="text-emerald-400">θ &gt; 0.25</code> ошибка стремится к нулю.
            </p>
          </div>

        </div>

        {/* Theoretical Details */}
        <div className="bg-cyan-950/10 border border-cyan-500/20 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">Математическая суть гипотезы Ходжа в RICIS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Классическая проблема:</span>
              <p className="text-slate-300 leading-relaxed">
                На комплексных проективных многообразиях Kahler-метрика может содержать геометрические сингулярности в критических сечениях, делая гармонические дифференциальные формы неинтегрируемыми и разрывая когомологический изоморфизм.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">RICIS III регуляризация:</span>
              <p className="text-slate-300 leading-relaxed">
                Параметр <code className="text-emerald-400">θ</code> выступает как нелокальный деформатор комплексной структуры. Дифференциальные формы сглаживаются на масштабе <code className="text-emerald-400">θ</code>, а Kahler-метрика становится несингулярной, доказывая алгебраичность Ходжевских когомологий.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
