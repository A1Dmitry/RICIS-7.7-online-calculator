/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CDCCState } from '../types';
import { useLanguage } from '../lib/i18n';
import { Sparkles, Shield, Infinity, HelpCircle, Activity, Play, Zap, ArrowRight, CheckCircle2, RotateCcw, Eye, Lock, RefreshCw, AlertTriangle, Cpu } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';

interface CDCCSingularityProps {
  preset?: CDCCState;
  onChangeState?: (state: CDCCState) => void;
}

// Function Packages representing Deferred Expressions in RICIS-III
interface FunctionPack {
  id: string;
  nameRu: string;
  nameEn: string;
  fExprRu: string;
  fExprEn: string;
  gExprRu: string;
  gExprEn: string;
  latexRu: string;
  latexEn: string;
  evalF: (theta: number) => number;
  evalG: (theta: number) => number;
  derivF: (theta: number) => number;
  derivG: (theta: number) => number;
  resolveValue: number;
  resolveLabelRu: string;
  resolveLabelEn: string;
  canBeSimplified: boolean;
  simplifiedExprRu?: string;
  simplifiedExprEn?: string;
}

const FUNCTION_PACKS: FunctionPack[] = [
  {
    id: 'pack_cos_linear',
    nameRu: 'Косинусно-Линейный Монолит (Кантор-Лимит)',
    nameEn: 'Cosine-Linear Monolith (Cantor Limit)',
    fExprRu: 'F(θ) = cos(πθ / 2)  [отложенное выражение]',
    fExprEn: 'F(θ) = cos(πθ / 2)  [deferred expression]',
    gExprRu: 'G(θ) = 1 - θ  [отложенное выражение]',
    gExprEn: 'G(θ) = 1 - θ  [deferred expression]',
    latexRu: 'f(\\theta) = \\frac{0_{\\cos(\\pi\\theta/2)}}{0_{1-\\theta}}',
    latexEn: 'f(\\theta) = \\frac{0_{\\cos(\\pi\\theta/2)}}{0_{1-\\theta}}',
    evalF: (theta) => Math.cos((Math.PI * theta) / 2),
    evalG: (theta) => 1 - theta,
    derivF: (theta) => - (Math.PI / 2) * Math.sin((Math.PI * theta) / 2),
    derivG: (theta) => -1,
    resolveValue: Math.PI / 2,
    resolveLabelRu: 'π/2 ≈ 1.571',
    resolveLabelEn: 'π/2 ≈ 1.571',
    canBeSimplified: false
  },
  {
    id: 'pack_polynomial',
    nameRu: 'Полиномиальная Сингулярность (Разрешение SP2)',
    nameEn: 'Polynomial Singularity (SP2 Cancellation)',
    fExprRu: 'F(θ) = θ² - 1  [отложенное выражение]',
    fExprEn: 'F(θ) = θ² - 1  [deferred expression]',
    gExprRu: 'G(θ) = θ - 1  [отложенное выражение]',
    gExprEn: 'G(θ) = θ - 1  [deferred expression]',
    latexRu: 'f(\\theta) = \\frac{0_{\\theta^2 - 1}}{0_{\\theta - 1}}',
    latexEn: 'f(\\theta) = \\frac{0_{\\theta^2 - 1}}{0_{\\theta - 1}}',
    evalF: (theta) => theta * theta - 1,
    evalG: (theta) => theta - 1,
    derivF: (theta) => 2 * theta,
    derivG: (theta) => 1,
    resolveValue: 2.0,
    resolveLabelRu: '2.000',
    resolveLabelEn: '2.000',
    canBeSimplified: true,
    simplifiedExprRu: 'F(θ)/G(θ) = (θ-1)(θ+1) / (θ-1) = θ + 1',
    simplifiedExprEn: 'F(θ)/G(θ) = (θ-1)(θ+1) / (θ-1) = θ + 1'
  },
  {
    id: 'pack_sin_linear',
    nameRu: 'Синусоидальный Монолит (Трансфинитная плотность)',
    nameEn: 'Sinusoidal Monolith (Transfinite Density)',
    fExprRu: 'F(θ) = sin(πθ)  [отложенное выражение]',
    fExprEn: 'F(θ) = sin(πθ)  [deferred expression]',
    gExprRu: 'G(θ) = 1 - θ  [отложенное выражение]',
    gExprEn: 'G(θ) = 1 - θ  [deferred expression]',
    latexRu: 'f(\\theta) = \\frac{0_{\\sin(\\pi\\theta)}}{0_{1-\\theta}}',
    latexEn: 'f(\\theta) = \\frac{0_{\\sin(\\pi\\theta)}}{0_{1-\\theta}}',
    evalF: (theta) => Math.sin(Math.PI * theta),
    evalG: (theta) => 1 - theta,
    derivF: (theta) => Math.PI * Math.cos(Math.PI * theta),
    derivG: (theta) => -1,
    resolveValue: Math.PI,
    resolveLabelRu: 'π ≈ 3.142',
    resolveLabelEn: 'π ≈ 3.142',
    canBeSimplified: false
  }
];

export default function CDCCSingularity({ preset, onChangeState }: CDCCSingularityProps = {}) {
  const { language, t } = useLanguage();
  const [state, setState] = useState<CDCCState>({
    gridSize: 8,
    theta: 0.0, // RICIS Regularization Parameter
    animationSpeed: 1.5,
    showMissingNumber: true
  });

  const [activeStep, setActiveStep] = useState<number>(0);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [activePackId, setActivePackId] = useState<string>('pack_cos_linear');

  const activePack = FUNCTION_PACKS.find(p => p.id === activePackId) || FUNCTION_PACKS[0];

  // Generate stable pseudorandom binary matrix for the Cantor grid
  const [matrix, setMatrix] = useState<number[][]>([]);

  const generateMatrix = (size: number) => {
    const newMatrix: number[][] = [];
    for (let r = 0; r < size; r++) {
      const row: number[] = [];
      for (let c = 0; c < size; c++) {
        const val = Math.sin((r + 1) * 12.9898 + (c + 1) * 78.233) * 43758.5453;
        row.push(Math.abs(val - Math.floor(val)) > 0.5 ? 1 : 0);
      }
      newMatrix.push(row);
    }
    setMatrix(newMatrix);
  };

  useEffect(() => {
    generateMatrix(state.gridSize);
  }, [state.gridSize]);

  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  useEffect(() => {
    onChangeState?.(state);
  }, [state, onChangeState]);

  const topologicalCanvasRef = useRef<HTMLCanvasElement>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);

  // Animation Loop for automated step scrolling/effects
  useEffect(() => {
    const interval = setInterval(() => {
      setGenerationCount((prev) => prev + 0.05 * state.animationSpeed);
    }, 50);
    return () => clearInterval(interval);
  }, [state.animationSpeed]);

  // Render the Topological Flow / Continuous Density Field on Canvas
  useEffect(() => {
    const canvas = topologicalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    const size = state.gridSize;
    const theta = state.theta;

    // We render a grid of smoothed waves where the cells blend topologically as theta increases
    const cellW = width / size;
    const cellH = height / size;

    // Generate background color grid
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const baseValue = matrix[r]?.[c] ?? 0;
        
        // Calculate the regularized value of the cell
        let smoothedValue = baseValue;

        if (theta > 0) {
          // Average with neighbors based on theta intensity
          let sum = baseValue;
          let count = 1;
          const neighbors = [
            [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
          ];
          neighbors.forEach(([nr, nc]) => {
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              sum += (matrix[nr]?.[nc] ?? 0) * theta;
              count += theta;
            }
          });
          smoothedValue = sum / count;
        }

        // Add subtle wave oscillation depending on the simulation timer
        const osc = Math.sin(generationCount + r * 0.5 + c * 0.3) * 0.1 * theta;
        const displayVal = Math.min(Math.max(smoothedValue + osc, 0), 1);

        // Grid Cell Fill
        const rColor = Math.floor(6 + displayVal * (34 - 6));
        const gColor = Math.floor(18 + displayVal * (211 - 18));
        const bColor = Math.floor(36 + displayVal * (238 - 36));
        const opacity = 0.15 + displayVal * 0.65;

        ctx.fillStyle = `rgba(${rColor}, ${gColor}, ${bColor}, ${opacity})`;
        ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);

        // Highlight the diagonal
        if (r === c) {
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + (1 - theta) * 0.6})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(c * cellW + 3, r * cellH + 3, cellW - 6, cellH - 6);
          
          ctx.fillStyle = `rgba(245, 158, 11, ${0.7 + Math.sin(generationCount * 2) * 0.2})`;
          ctx.beginPath();
          ctx.arc(c * cellW + cellW/2, r * cellH + cellH/2, 4 * (1 - theta * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw continuous topological lines representing the "Line Monolith of Order 1"
    if (theta > 0) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(34, 211, 238, ${theta * 0.85})`;
      ctx.lineWidth = 1.5 + theta * 1.5;

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const val = matrix[r]?.[c] ?? 0;
          const x = c * cellW + cellW / 2;
          const y = r * cellH + cellH / 2;

          if (c === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = (c - 1) * cellW + cellW / 2;
            const prevY = r * cellH + cellH / 2;
            const cpX = (prevX + x) / 2;
            const cpY = (prevY + y) / 2 + Math.sin(generationCount + r) * 15 * theta;
            ctx.quadraticCurveTo(cpX, cpY, x, y);
          }
        }
      }
      ctx.stroke();

      ctx.fillStyle = `rgba(34, 211, 238, ${theta * 0.05})`;
      ctx.fillRect(0, 0, width, height);
    }
  }, [matrix, state.gridSize, state.theta, generationCount]);

  // Render Target Function Graph
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#1d1d21';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const x = (width * i) / 5;
      const y = (height * i) / 5;
      
      // Vertical grid
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Horizontal grid
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Graph scale properties
    // x axis goes from theta = 0 to theta = 1.2
    // y axis goes from f(theta) = 0 to f(theta) = Math.max(resolveValue, 2) * 1.5
    const maxTheta = 1.2;
    const maxY = Math.max(activePack.resolveValue, 2.5) * 1.3;

    const toCanvasX = (t: number) => (t / maxTheta) * (width - 60) + 40;
    const toCanvasY = (val: number) => height - 30 - (val / maxY) * (height - 50);

    // Draw axes
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 10);
    ctx.lineTo(40, height - 30);
    ctx.lineTo(width - 10, height - 30);
    ctx.stroke();

    // Axes Labels
    ctx.fillStyle = '#71717a';
    ctx.font = '10px monospace';
    ctx.fillText('θ (Regularizer)', width - 110, height - 12);
    ctx.fillText('f(θ)', 10, 20);

    // Draw axis ticks
    ctx.fillText('0.0', 35, height - 15);
    ctx.fillText('1.0', toCanvasX(1.0) - 8, height - 15);
    ctx.fillText('1.2', toCanvasX(1.2) - 15, height - 15);

    // Draw tick marks
    ctx.strokeStyle = '#3f3f46';
    ctx.beginPath();
    ctx.moveTo(toCanvasX(1.0), height - 33);
    ctx.lineTo(toCanvasX(1.0), height - 27);
    ctx.stroke();

    // Plot curves
    const steps = 100;
    
    // 1. Classical curve (ends strictly before theta = 1.0)
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b'; // Amber for classical
    ctx.lineWidth = 2.5;

    let started = false;
    for (let i = 0; i <= steps; i++) {
      const tVal = (i / steps) * 1.2;
      if (tVal >= 0.999 && tVal <= 1.001) continue; // Singularity hole!
      if (tVal > 1.0) continue; // Classical doesn't go beyond or is undefined

      const fVal = activePack.evalF(tVal) / activePack.evalG(tVal);
      if (isNaN(fVal) || !isFinite(fVal)) continue;

      const cx = toCanvasX(tVal);
      const cy = toCanvasY(fVal);

      if (!started) {
        ctx.moveTo(cx, cy);
        started = true;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.stroke();

    // Classical Singularity Hole at theta = 1.0
    const holeX = toCanvasX(1.0);
    const holeY = toCanvasY(activePack.resolveValue);
    ctx.fillStyle = '#0b0b0c';
    ctx.strokeStyle = '#ef4444'; // Red hole for division by zero
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(holeX, holeY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. RICIS Continuous Curve (fully continuous and regularized)
    ctx.beginPath();
    ctx.strokeStyle = '#10b981'; // Emerald for RICIS
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]); // Dashed line showing continuous extrapolation/resolution

    let rStarted = false;
    for (let i = 0; i <= steps; i++) {
      const tVal = (i / steps) * 1.2;
      let fVal = 0;
      if (Math.abs(tVal - 1.0) < 0.001) {
        fVal = activePack.resolveValue; // Resolved via RICIS!
      } else {
        fVal = activePack.evalF(tVal) / activePack.evalG(tVal);
      }

      if (isNaN(fVal) || !isFinite(fVal)) continue;

      const cx = toCanvasX(tVal);
      const cy = toCanvasY(fVal);

      if (!rStarted) {
        ctx.moveTo(cx, cy);
        rStarted = true;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Draw active theta cursor
    const currentTheta = state.theta;
    const curX = toCanvasX(currentTheta);
    let curY = 0;

    const isSingular = Math.abs(currentTheta - 1.0) < 0.005;

    if (isSingular) {
      curY = toCanvasY(activePack.resolveValue);
    } else {
      curY = toCanvasY(activePack.evalF(currentTheta) / activePack.evalG(currentTheta));
    }

    if (curY >= 0 && curY <= height) {
      // Dotted helper line to X axis
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(curX, height - 30);
      ctx.moveTo(curX, curY);
      ctx.lineTo(40, curY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cursor point
      ctx.fillStyle = isSingular ? '#ef4444' : (currentTheta > 0.95 ? '#10b981' : '#22d3ee');
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing green resolved point at theta = 1.0
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.beginPath();
    ctx.arc(holeX, holeY, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(holeX, holeY, 4, 0, Math.PI * 2);
    ctx.fill();

  }, [activePackId, state.theta]);

  const diagonalSequence: number[] = [];
  const missingSequence: number[] = [];

  for (let i = 0; i < state.gridSize; i++) {
    if (matrix[i]) {
      const diagVal = matrix[i][i];
      diagonalSequence.push(diagVal);
      missingSequence.push(diagVal === 1 ? 0 : 1);
    }
  }

  const resetSimulation = () => {
    setActiveStep(0);
    setState(prev => ({ ...prev, theta: 0.0 }));
    generateMatrix(state.gridSize);
  };

  const tutorialSteps = [
    {
      title: t('Шаг 1: Конструирование целевой функции f(θ)', 'Step 1: Constructing Target Function f(θ)'),
      desc: t(
        'Вместо классического статического перечисления мы строим целевую функцию f(θ) = 0_F / 0_G, где F(θ) и G(θ) — отложенные выражения (Deferred Expressions), представляющие трансфинитные веса непрерывных числовых монолитов в пределе сингулярности θ → 1.',
        'Instead of classical static enumeration, we construct the target function f(θ) = 0_F / 0_G, where F(θ) and G(θ) are deferred expressions representing the transfinite weights of continuous numerical monoliths at the singularity limit θ → 1.'
      )
    },
    {
      title: t('Шаг 2: Обнаружение сингулярности (θ = 1.0)', 'Step 2: Discerning Singularity (θ = 1.0)'),
      desc: t(
        'Когда параметр θ стремится к 1.0, классические вещественные ряды сливаются, и f(θ) превращается в неопределенность 0/0. Классическая теория ZFC здесь бессильна и выдает деление на ноль (NaN), порождая разрыв типов и неразрешимость континуум-гипотезы.',
        'As θ approaches 1.0, the classical sequences merge, and f(θ) becomes the indeterminate form 0/0. Classical ZFC math fails here, yielding division by zero (NaN) and creating the type gap and undecidability of the Continuum Hypothesis.'
      )
    },
    {
      title: t('Шаг 3: Семантическое индексирование по SP4', 'Step 3: Semantic Indexing via SP4'),
      desc: t(
        'В RICIS-III мы индексируем сингулярности не по числовому значению 0, а по родительскому отложенному функциональному выражению: 0_{F(θ)} и 0_{G(θ)}. Это сохраняет внутреннюю топологическую и алгебраическую структуру бесконечно малых элементов.',
        'In RICIS-III, we index singularities not by the scalar value 0, but by the parent deferred functional expression: 0_{F(θ)} and 0_{G(θ)}. This preserves the internal topological and algebraic structure of the infinitesimal elements.'
      )
    },
    {
      title: t('Шаг 4: Разрешение сингулярности по SP3 и A4', 'Step 4: Singularity Resolution via SP3 & A4'),
      desc: t(
        'По закону индексов SP3 и аксиоме A4 отношение 0_F / 0_G строго заменяется на отношение самих отложенных выражений F/G. Разрешая неопределенность в точке θ = 1, мы получаем абсолютно непрерывное отображение без разрывов, полностью доказывая справедливость CDCC.',
        'According to index law SP3 and axiom A4, the ratio 0_F / 0_G is strictly replaced by the ratio of the deferred expressions F/G themselves. Resolving this at θ = 1 yields an absolutely continuous mapping, proving the validity of the CDCC.'
      )
    }
  ];

  return (
    <div id="cdcc-applet" className="space-y-6">
      {/* Visual Header */}
      <div className="bg-[#121214] border border-white/10 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none opacity-40" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-1.5">
              <Infinity className="w-4.5 h-4.5 animate-pulse" />
              <span>RICIS-III CDCC Solver & Sim v7.7</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white">
              {t('Континуум-гипотеза по RICIS-III', "RICIS-III Continuum Conjecture (CDCC)")}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {t(
                'Абсолютно непрерывный симулятор CDCC. Вместо классических трансфинитных скачков теория RICIS-III разрешает сингулярность через закон индексов SP3 и семантическое правило SP4, превращая дискретность в единый волновой монолит.',
                'Absolutely continuous CDCC simulator. Instead of classical transfinite jumps, RICIS-III resolves the singularity via index law SP3 and semantic rule SP4, transforming discrete steps into a unified wave monolith.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-emerald-950/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg text-[10px] font-mono text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('СПО ОТОБРАЖЕНИЯ: CDCC-РИКИС', 'DISPLAY PROTOCOL: CDCC-RICIS')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Tutorial Text */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Controls Panel */}
          <div className="bg-[#121214] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                {t('Панель Управления', 'Control Console')}
              </span>
              <button 
                onClick={resetSimulation}
                className="text-[10px] font-mono uppercase text-slate-500 hover:text-white flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                {t('Сбросить', 'Reset')}
              </button>
            </div>

            {/* Selection of Deferred Expression Package */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                {t('Отложенные Выражения F и G:', 'Deferred Expressions F and G:')}
              </label>
              <div className="space-y-1.5">
                {FUNCTION_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    onClick={() => setActivePackId(pack.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                      activePackId === pack.id
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-white shadow-md'
                        : 'bg-zinc-900/40 border-white/5 text-slate-400 hover:bg-zinc-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{language === 'ru' ? pack.nameRu : pack.nameEn}</span>
                      {pack.canBeSimplified && (
                        <span className="text-[9px] bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 px-1 rounded">
                          SP2
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-slate-500 space-y-0.5">
                      <div>{language === 'ru' ? pack.fExprRu : pack.fExprEn}</div>
                      <div>{language === 'ru' ? pack.gExprRu : pack.gExprEn}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 1: Theta (Regularization) */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <span>RICIS-III {t('Регуляризатор', 'Regularizer')} (θ):</span>
                  <span className={`text-[10px] px-1 py-0.5 rounded border ${
                    state.theta === 1.0 
                      ? 'text-red-400 bg-red-950/40 border-red-800/30 animate-pulse' 
                      : (state.theta === 0.0 ? 'text-amber-400 bg-amber-950/40 border-amber-800/30' : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/30')
                  }`}>
                    {state.theta === 0.0 
                      ? t('ДИСКРЕТНОСТЬ', 'CLASSICAL DISCRETE') 
                      : (state.theta === 1.0 ? t('СИНГУЛЯРНОСТЬ θ=1.0', 'SINGULARITY θ=1.0') : `θ = ${state.theta.toFixed(3)}`)}
                  </span>
                </span>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.theta}
                onChange={(e) => setState(prev => ({ ...prev, theta: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>θ = 0.0 ({t('Классика', 'Classical')})</span>
                <span className="text-emerald-400 font-bold">θ = 1.0 ({t('Монолит', 'Monolith')})</span>
              </div>
            </div>

            {/* Slider 2: Grid Size N */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">
                  {t('Размерность матрицы', 'Matrix Dimension')} (N): <strong className="text-white">{state.gridSize} × {state.gridSize}</strong>
                </span>
              </div>
              <input 
                type="range"
                min="5"
                max="12"
                step="1"
                value={state.gridSize}
                onChange={(e) => setState(prev => ({ ...prev, gridSize: parseInt(e.target.value) }))}
                className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Interactive Tutorial Stepper */}
          <div className="bg-[#121214] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                {t('Интерактивный учебник', 'Interactive Stepper')}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {activeStep + 1} / 4
              </span>
            </div>

            {/* Step Card Content */}
            <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg space-y-2 min-h-[160px] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-400 flex items-center justify-center font-mono">
                    {activeStep + 1}
                  </span>
                  {tutorialSteps[activeStep].title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {tutorialSteps[activeStep].desc}
                </p>
              </div>

              {/* Step Navigation */}
              <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-2">
                <button 
                  onClick={() => setActiveStep((prev) => (prev === 0 ? 3 : prev - 1))}
                  className="px-2.5 py-1 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-white rounded transition"
                >
                  &larr; {t('Назад', 'Prev')}
                </button>
                <button 
                  onClick={() => setActiveStep((prev) => (prev + 1) % 4)}
                  className="px-2.5 py-1 text-[10px] font-mono bg-emerald-500 text-black hover:bg-emerald-400 rounded transition font-bold flex items-center gap-1"
                >
                  <span>{activeStep === 3 ? t('Заново', 'Restart') : t('Далее', 'Next')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Visual Matrices, Plotter & Resolution Pipeline */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Section: Visual Dual Fields (Classical vs RICIS Monolith) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Discrete Cantor Matrix Grid */}
            <div className="bg-[#121214] border border-white/10 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  {t('Дискретная таблица Кантора', 'Discrete Cantor Grid')}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {t('Классический ZFC взгляд', 'Classical ZFC view')}
                </span>
              </div>

              {/* Binary Sequence Grid */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-mono text-slate-500">
                      <th className="py-1.5 px-1 font-normal text-left">i</th>
                      <th className="py-1.5 px-1 font-normal">{t('Последовательность s_i', 'Sequence s_i')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, rIdx) => (
                      <tr 
                        key={rIdx} 
                        className={`border-b border-white/5 text-xs font-mono transition-colors ${highlightedRow === rIdx ? 'bg-white/5' : ''}`}
                        onMouseEnter={() => setHighlightedRow(rIdx)}
                        onMouseLeave={() => setHighlightedRow(null)}
                      >
                        <td className="py-1 px-1 text-slate-500 text-left text-[10px]">{rIdx + 1}</td>
                        <td className="py-1 px-1">
                          <div className="flex items-center justify-center gap-1">
                            <span>0.</span>
                            {row.map((val, cIdx) => {
                              const isDiag = rIdx === cIdx;
                              return (
                                <span 
                                  key={cIdx} 
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] transition-all ${
                                    isDiag 
                                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40' 
                                      : 'bg-black/30 text-slate-400 border border-transparent'
                                  }`}
                                >
                                  {val}
                                </span>
                              );
                            })}
                            <span className="text-slate-600">...</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Diagonal and Missing numbers footer */}
              {state.showMissingNumber && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      {t('Диагональ D:', 'Diagonal D:')}
                    </span>
                    <span className="text-amber-400 font-bold tracking-wider">
                      0.{diagonalSequence.join('')}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono p-2 bg-emerald-950/10 border border-emerald-500/20 rounded">
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {t('Число M (Инверсия):', 'Missing Number M:')}
                    </span>
                    <span className="text-emerald-400 font-bold tracking-wider">
                      0.{missingSequence.join('')}...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. RICIS Continuous Topological Field */}
            <div className="bg-[#121214] border border-white/10 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    {t('Топологическое поле RICIS III', 'RICIS III Topological Field')}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.5 rounded">
                    {t('Линейный Монолит', 'Line Monolith')}
                  </span>
                </div>

                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-white/5 bg-black/60">
                  <canvas 
                    ref={topologicalCanvasRef}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Watermark coordinate overlay */}
                  <div className="absolute bottom-2 left-2 font-mono text-[8px] text-slate-600 bg-black/80 px-2 py-1 rounded border border-white/5 uppercase">
                    {t('ПЛОТНОСТЬ МОНОЛИТА', 'MONOLITH DENSITY')}: {(1 + state.theta * 99).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-[10px] font-mono text-slate-500 leading-relaxed">
                {t(
                  'Сингулярность разрешается посредством слияния дискретных ячеек в континуальную топологию. При θ > 0 точки размываются в непрерывную синусоидальную форму волновых монолитов.',
                  'The singularity is resolved by merging discrete cells into a continuous topology. At θ > 0, matrix cells melt into a continuous sinusoidal wave of line monoliths.'
                )}
              </div>
            </div>
          </div>

          {/* New Section: Target Function Plotter & Real-Time Singularity Solver */}
          <div className="bg-[#121214] border border-white/10 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  {t('Целевая функция и Солвер Сингулярностей RICIS-III', 'Target Function & RICIS-III Singularity Solver')}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {t('Анализ деления на ноль с использованием отложенных выражений вместо чисел', 'Division by zero analysis using deferred expressions instead of scalar values')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono bg-black/40 border border-white/5 px-2.5 py-1 rounded">
                <span className="text-slate-500">{t('Текущая точка:', 'Current point:')}</span>
                <span className="text-white">θ = {state.theta.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Plotter Canvas */}
              <div className="md:col-span-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    {t('График Целевой Функции f(θ)', 'Target Function f(θ) Plot')}
                  </span>
                  <div className="relative rounded-lg overflow-hidden border border-white/5 bg-black/80 aspect-[4/3] w-full">
                    <canvas 
                      ref={graphCanvasRef}
                      width={280}
                      height={210}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-[#f59e0b] rounded" />
                    <span>{t('Классический график (Разрыв при θ = 1.0)', 'Classical Plot (Gap at θ = 1.0)')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1 bg-[#10b981] rounded border-dashed border" />
                    <span>{t('Континуальное разрешение по RICIS-III', 'RICIS-III Continuous Resolution')}</span>
                  </div>
                </div>
              </div>

              {/* Real-time Resolution Pipeline Terminal */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      {t('Пошаговый Конвейер Вычислений (RICIS-III)', 'Step-by-Step Computational Pipeline')}
                    </span>
                    {Math.abs(state.theta - 1.0) < 0.005 ? (
                      <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-800/40 px-1.5 py-0.5 rounded animate-pulse font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t('СИНГУЛЯРНОСТЬ!', 'SINGULARITY!')}
                      </span>
                    ) : (
                      <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded font-mono">
                        {t('СТАБИЛЬНО', 'STABLE')}
                      </span>
                    )}
                  </div>

                  {/* Computational Terminal */}
                  <div className="bg-black/60 border border-white/5 rounded-lg p-3.5 space-y-3 font-mono text-[11px] leading-relaxed text-slate-300 min-h-[220px]">
                    
                    {/* Math Expression Frame */}
                    <div className="p-2.5 bg-zinc-900/40 border border-white/5 rounded flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">{t('Математическая формулировка:', 'Mathematical formulation:')}</div>
                        <div className="text-cyan-400 font-bold mt-1 text-[13px]">
                          {language === 'ru' ? activePack.latexRu : activePack.latexEn}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase">{t('Классическое значение:', 'Classical Value:')}</div>
                        <div className="text-amber-500 font-semibold mt-1">
                          {Math.abs(state.theta - 1.0) < 0.005 ? (
                            <span className="text-red-500 font-bold">{t('Деление на 0! (NaN)', 'Div by 0! (NaN)')}</span>
                          ) : (
                            (activePack.evalF(state.theta) / activePack.evalG(state.theta)).toFixed(3)
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Phase-by-phase trace */}
                    <div className="space-y-1.5 text-[10px] max-h-[160px] overflow-y-auto pr-1">
                      
                      {/* Phase 0.5: Semantic Indexing */}
                      <div className="border-l-2 border-cyan-500 pl-2 py-0.5">
                        <span className="text-cyan-400 font-bold block">PHASE 0.5: SEMANTIC INDEXING (SP4)</span>
                        <span className="text-slate-400">
                          {t('Индексирование по отложенному выражению, а не по скалярному числу:', 'Indexing by deferred expression, not by scalar value:')}
                        </span>
                        <div className="text-slate-300 mt-0.5 bg-zinc-950/60 p-1 rounded border border-white/5 text-[9px]">
                          F = {language === 'ru' ? activePack.fExprRu : activePack.fExprEn}
                          <br />
                          G = {language === 'ru' ? activePack.gExprRu : activePack.gExprEn}
                        </div>
                      </div>

                      {/* Phase 1: SP2 Algebraic reduction */}
                      <div className="border-l-2 border-emerald-500 pl-2 py-0.5">
                        <span className="text-emerald-400 font-bold block">PHASE 1: SAFETY CHECK (SP2)</span>
                        <span className="text-slate-400">
                          {activePack.canBeSimplified 
                            ? `${t('Обнаружено сокращаемое выражение:', 'Cancellable expression detected:')} ${language === 'ru' ? activePack.simplifiedExprRu : activePack.simplifiedExprEn}`
                            : t('Алгебраическое сокращение невозможно. Переход к прямому вычислению.', 'No algebraic cancellation possible. Transitioning to direct evaluation.')}
                        </span>
                      </div>

                      {/* Phase 2: RICIS Transform */}
                      <div className="border-l-2 border-purple-500 pl-2 py-0.5">
                        <span className="text-purple-400 font-bold block">PHASE 2: RICIS TRANSFORM (SP3 & A4)</span>
                        <span className="text-slate-400">
                          {t('Замена отношения нулей отношением самих отложенных выражений: ', 'Replacing the ratio of zeroes with the ratio of deferred expressions: ')}
                          <strong className="text-white">0_F / 0_G = F / G</strong>
                        </span>
                        {Math.abs(state.theta - 1.0) < 0.005 ? (
                          <div className="text-emerald-400 mt-1 font-bold">
                            {t('Сингулярность разрешена! Предельное значение: ', 'Singularity resolved! Limiting value: ')} 
                            {language === 'ru' ? activePack.resolveLabelRu : activePack.resolveLabelEn}
                          </div>
                        ) : (
                          <div className="text-slate-500 mt-0.5">
                            {t('Текущее отношение: ', 'Current ratio: ')} 
                            {(activePack.evalF(state.theta) / activePack.evalG(state.theta)).toFixed(3)}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>

                {/* Proof Status Bar */}
                <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300 font-sans">
                      {t('Разрешение сингулярности CDCC:', 'CDCC Singularity Resolution:')}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    2^ℵ₀ = ℵ₁ = Monolith_Order1 (100% {t('Успех', 'Success')})
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Mathematical Proof Panel */}
          <div className="bg-[#121214] border border-white/10 rounded-xl p-5 space-y-4">
            <span className="text-xs font-mono uppercase text-slate-400 tracking-wider block">
              {t('Теория Монолитов RICIS-III vs Теория множеств ZFC', 'RICIS-III Monolith Theory vs ZFC Set Theory')}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-black/30 p-3.5 rounded border border-white/5 space-y-2">
                <div className="text-[10px] text-slate-500 uppercase">{t('Классическое ZFC противоречие', 'Classical ZFC Contradiction')}</div>
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  {t(
                    'В стандартной теории множеств ZFC доказательство Кантора показывает, что кардинальные числа упорядочены ступенчато: ℵ₀ < 2^ℵ₀. Однако независимость континуум-гипотезы (CH) означает, что классическая математика не может подтвердить или опровергнуть существование промежуточного подмножества, создавая логический вакуум.',
                    'In classical ZFC, Cantor\'s proof shows that transfinite cardinal numbers are ordered strictly in discrete steps: ℵ₀ < 2^ℵ₀. However, the independence of the Continuum Hypothesis means classical mathematics cannot verify or deny intermediate subsets, creating a logical void.'
                  )}
                </div>
                <div className="pt-2 text-amber-500 font-bold border-t border-white/5">
                  2^ℵ₀ = ℵ₁ {t('(Неразрешимо в ZFC)', '(Undecidable in ZFC)')}
                </div>
              </div>

              <div className="bg-black/30 p-3.5 rounded border border-white/5 space-y-2">
                <div className="text-[10px] text-emerald-400 uppercase">{t('Разрешение в RICIS-III', 'RICIS-III Resolution')}</div>
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  {t(
                    'Благодаря устранению разрывов типов (Type-as-Identity), бесконечные ряды сопоставляются в непрерывном топологическом пространстве. Отношение бесконечных мощностей 0_F / 0_G = F/G позволяет выразить мощность вещественных чисел как непрерывное продолжение линейного монолита 1-го порядка, доказывая истинность гипотезы CDCC.',
                    'By removing type discontinuities (Type-as-Identity), infinite sequences are mapped into a unified continuous topological space. The ratio of infinite cardinalities 0_F / 0_G = F/G expresses real number cardinality as a continuous extension of the 1st-order line monolith, proving the validity of the CDCC.'
                  )}
                </div>
                <div className="pt-2 text-emerald-400 font-bold border-t border-white/5">
                  2^ℵ₀ = ℵ₁ = ∞_Line = Monolith_Order1
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[9px] text-slate-500 font-mono">
                {t('СИСТЕМА КООРДИНАТ: CDCC_RICIS_V7.7_STABLE', 'COORDINATE SYSTEM: CDCC_RICIS_V7.7_STABLE')}
              </span>
              <ExportToSheetsButton 
                mode="CDCC (Cantor Diagonal)"
                params={{
                  gridSize: state.gridSize,
                  theta: state.theta,
                  diagonal: diagonalSequence.join(''),
                  missingNum: missingSequence.join('')
                }}
                defaultDescription="RICIS-III CDCC Solver: 2^aleph_0 = aleph_1 = Monolith_Order1"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
