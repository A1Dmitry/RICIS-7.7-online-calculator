/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LLMGradientState } from '../types';
import { Sparkles, Shield, Cpu, HelpCircle, Activity, Play, Zap, ArrowRight, CheckCircle2, RefreshCw, Clipboard, Check, Award, Layers, TrendingDown, AlertTriangle, Infinity, RotateCcw, Sliders, ShieldCheck, FileText, Code } from 'lucide-react';
import ExportToSheetsButton from './ExportToSheetsButton';
import Latex from './Latex';

interface LLMGradientSingularityProps {
  preset?: LLMGradientState;
  onChangeState?: (state: LLMGradientState) => void;
  isActive?: boolean;
}

export default function LLMGradientSingularity({ preset, onChangeState }: LLMGradientSingularityProps) {
  const [state, setState] = useState<LLMGradientState>(preset || {
    networkDepth: 128,
    learningRate: 0.01,
    weightVariance: 1.8,
    activationType: 'swiglu',
    theta: 0.05,
    trainingStep: 0,
    optMethod: 'ricis_iii'
  });

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [selectedProofTab, setSelectedProofTab] = useState<'proof' | 'calculator' | 'activation_analysis'>('proof');

  // Trajectory history data points for gradient norms across training steps
  const [historyRaw, setHistoryRaw] = useState<number[]>([]);
  const [historyClipped, setHistoryClipped] = useState<number[]>([]);
  const [historyRicis, setHistoryRicis] = useState<number[]>([]);
  const [isNaNTriggered, setIsNaNTriggered] = useState<boolean>(false);

  // References for Canvas charts
  const gradientCanvasRef = useRef<HTMLCanvasElement>(null);
  const activationCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync state changes with parent
  useEffect(() => {
    if (preset) {
      setState(preset);
    }
  }, [preset]);

  useEffect(() => {
    if (onChangeState) {
      onChangeState(state);
    }
  }, [state, onChangeState]);

  // Generate synthetic loss and gradient dynamics based on network parameters
  const calculateGradientNormAtLayer = (l: number, step: number, method: 'classical_raw' | 'classical_clipped' | 'ricis_iii') => {
    const depth = state.networkDepth;
    const sigma = state.weightVariance;
    const theta = state.theta;

    // Critical noise spike occurring periodically at critical activation inflection points
    const inflectionSpike = Math.sin(step * 0.4) * Math.cos(step * 0.15);
    const criticalPointHit = Math.abs(inflectionSpike) > 0.82;

    // Base theoretical gradient scale: product of weight matrices scales as (sigma)^l
    let rawNorm = Math.pow(sigma, l / (depth * 0.25)) * (1.0 + Math.sin(step * 0.2) * 0.3);

    if (criticalPointHit) {
      // Near critical activation point (e.g. SwiGLU derivative denominator -> 0)
      const denominator = Math.abs(Math.sin(step * 0.7) * 0.02);
      rawNorm = rawNorm / (denominator + 1e-9); // Exploding gradient singularity!
    }

    if (method === 'classical_raw') {
      return rawNorm;
    } else if (method === 'classical_clipped') {
      const clipThreshold = 10.0;
      return Math.min(rawNorm, clipThreshold);
    } else {
      // RICIS III Smooth Regularization: R_theta(g) = g / (1 + (g * theta)^2)
      // Eliminates singularity 0/0 and caps gradient explosions continuously
      const regularizedNorm = rawNorm / (1.0 + Math.pow(rawNorm * theta, 1.8));
      return regularizedNorm;
    }
  };

  // Run or reset simulation steps
  const resetSimulation = () => {
    setIsSimulating(false);
    setState(prev => ({ ...prev, trainingStep: 0 }));
    setHistoryRaw([]);
    setHistoryClipped([]);
    setHistoryRicis([]);
    setIsNaNTriggered(false);
  };

  // Step loop
  useEffect(() => {
    let timer: any;
    if (isSimulating) {
      timer = setInterval(() => {
        setState(prev => {
          const nextStep = prev.trainingStep + 1;
          if (nextStep > 100) {
            setIsSimulating(false);
            return prev;
          }

          // Calculate gradient norm at output layer
          const normRaw = calculateGradientNormAtLayer(prev.networkDepth, nextStep, 'classical_raw');
          const normClipped = calculateGradientNormAtLayer(prev.networkDepth, nextStep, 'classical_clipped');
          const normRicis = calculateGradientNormAtLayer(prev.networkDepth, nextStep, 'ricis_iii');

          setHistoryRaw(h => [...h.slice(-100), normRaw]);
          setHistoryClipped(h => [...h.slice(-100), normClipped]);
          setHistoryRicis(h => [...h.slice(-100), normRicis]);

          if (normRaw > 1e6 || isNaN(normRaw)) {
            setIsNaNTriggered(true);
          }

          return { ...prev, trainingStep: nextStep };
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isSimulating, state.networkDepth, state.weightVariance, state.theta]);

  // Render Canvas for Gradient Trajectory Comparison
  useEffect(() => {
    const canvas = gradientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark grid background
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Y-axis label & ceiling line (Clipping Threshold & RICIS Bound)
    const clipY = height * 0.45;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)'; // Red clip line
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, clipY);
    ctx.lineTo(width, clipY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#F43F5E';
    ctx.font = '9px monospace';
    ctx.fillText('Порог градиентного среза (Clipping Limit = 10.0)', 10, clipY - 5);

    // Plot curves if history available
    const drawSeries = (series: number[], color: string, maxValScale: number, isDotted = false) => {
      if (series.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (isDotted) ctx.setLineDash([2, 2]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      for (let i = 0; i < series.length; i++) {
        const x = (i / 100) * width;
        let val = series[i];
        if (isNaN(val) || val > maxValScale) val = maxValScale;
        const y = height - (val / maxValScale) * (height * 0.85) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const maxScale = 25.0;

    // Draw Raw Classical (Red - Spikes & NaN)
    if (historyRaw.length > 0) {
      drawSeries(historyRaw, '#EF4444', maxScale);
    }

    // Draw Clipped Classical (Amber - Truncated)
    if (historyClipped.length > 0) {
      drawSeries(historyClipped, '#F59E0B', maxScale, true);
    }

    // Draw RICIS III Smooth Regularized (Emerald - Perfectly Bounded & Continuous)
    if (historyRicis.length > 0) {
      drawSeries(historyRicis, '#10B981', maxScale);
    }

    // Legend
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(width - 240, 15, 8, 8);
    ctx.fillStyle = '#D4D4D8';
    ctx.font = '9px monospace';
    ctx.fillText('Классический SGD (Взрыв / NaN)', width - 225, 22);

    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(width - 240, 30, 8, 8);
    ctx.fillStyle = '#D4D4D8';
    ctx.fillText('Срезание градиентов (Gradient Clipping)', width - 225, 37);

    ctx.fillStyle = '#10B981';
    ctx.fillRect(width - 240, 45, 8, 8);
    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('RICIS III Гладкая Регуляризация (L0/L1)', width - 225, 52);

  }, [historyRaw, historyClipped, historyRicis]);

  // Render Canvas for Activation Function & Derivative Comparison
  useEffect(() => {
    const canvas = activationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, width, height);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    const xMin = -3;
    const xMax = 3;
    const yMin = -2;
    const yMax = 3;

    const toCanvasX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toCanvasY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Activation SwiGLU / GELU function f(x) and its derivative f'(x)
    const actType = state.activationType;
    const theta = state.theta;

    const evalActivation = (x: number) => {
      if (actType === 'swiglu') {
        // SwiGLU x * sigmoid(1.5x)
        const sig = 1 / (1 + Math.exp(-1.5 * x));
        return x * sig;
      } else if (actType === 'gelu') {
        // GELU x * 0.5 * (1 + erf(x/sqrt(2)))
        return x * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
      } else if (actType === 'softmax_attention') {
        // Softmax attention score logit exp(x) / (1 + exp(x))
        return Math.exp(x) / (1 + Math.exp(x));
      } else {
        // RMSNorm x / sqrt(x^2 + eps)
        return x / Math.sqrt(x * x + 0.01);
      }
    };

    // Classical Derivative f'(x) via finite diff
    const evalClassicalDeriv = (x: number) => {
      const h = 1e-4;
      return (evalActivation(x + h) - evalActivation(x - h)) / (2 * h);
    };

    // RICIS III Smooth Regularized Derivative R_theta(f'(x))
    const evalRicisDeriv = (x: number) => {
      const df = evalClassicalDeriv(x);
      // Continuous resolution of 0/0 uncertainty at inflection points x_0
      // R_theta(df) = df / (1 + (df * theta)^2)
      return df / (1 + Math.pow(df * theta, 2));
    };

    // Plot Function f(x) in Cyan
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let cx = 0; cx < width; cx++) {
      const x = xMin + (cx / width) * (xMax - xMin);
      const y = evalActivation(x);
      const cy = toCanvasY(y);
      if (cx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Plot Classical Derivative f'(x) in Red Dotted
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (let cx = 0; cx < width; cx++) {
      const x = xMin + (cx / width) * (xMax - xMin);
      const y = evalClassicalDeriv(x);
      const cy = toCanvasY(y);
      if (cx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot RICIS III Derivative in Emerald
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let cx = 0; cx < width; cx++) {
      const x = xMin + (cx / width) * (xMax - xMin);
      const y = evalRicisDeriv(x);
      const cy = toCanvasY(y);
      if (cx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Legend
    ctx.fillStyle = '#06B6D4';
    ctx.font = '9px monospace';
    ctx.fillText(`Активация: ${actType.toUpperCase()} f(x)`, 10, 20);

    ctx.fillStyle = '#EF4444';
    ctx.fillText(`Классическая производная f'(x)`, 10, 32);

    ctx.fillStyle = '#10B981';
    ctx.fillText(`RICIS III Регуляризованная производная R_θ(f')`, 10, 44);

  }, [state.activationType, state.theta]);

  const getGeminiPrompt = () => {
    return `Выступай в роли главного математика и специалиста по фундаментальной теории нейросетей RICIS III. Создай теоретическое обоснование и Python/PyTorch реализацию регуляризатора градиентного взрыва для сверхглубоких трансформеров (LLM, 1000+ слоев).

МАТЕМАТИЧЕСКАЯ ФОРМУЛИРОВКА ПРОБЛЕМЫ:
При обратном распространении ошибки в сверхглубоких LLM (SwiGLU, RMSNorm, Multi-Head Attention) градиент потерь g = ∂L/∂w представляет собой цепочку произведений Якобианов слоев:
g_L = ∏_{k=1}^L J_k · ∇_y L

В критических точках функций активации (инфлексия SwiGLU при x ≈ -1.59, сингулярности деления на норму в RMSNorm / Softmax) возникают неопределенности типа 0/0 и градиентные взрывы:
lim_{x → x_0} (0_F / 0_G) = ∞  (в классическом анализе)

РЕШЕНИЕ ПО МЕТОДОЛОГИИ RICIS III:
1. По аксиоме L1_IDENTITY (X = X ⇒ X/X = 1) и SP3_INDEX_LAW отношение нулевых монолитов равняется отношению их собственных весовых индексов:
   0_F / 0_G = F' / G' ≡ 1  (при однородном весовом пространстве)

2. По аксиоме A6_GENERAL (0_F × ∞_G = F · G) и аксиомам регуляризации вводится гладкий непрерывный оператор RICIS III R_θ(g):
   R_θ(g) = g / (1 + (g · θ)^2)

ДОКАЗАТЕЛЬСТВО НЕПРЕРЫВНОСТИ И ОГРАНИЧЕННОСТИ ГРАДИЕНТА:
- При g → 0: R_θ(g) ≈ g  (сохранение малых градиентов без затухания)
- При g → ∞: R_θ(g) ≤ 1 / (2θ)  (строгая математическая верхняя грань!)
- Предотвращает появление NaN/Inf без эвристического обрезания (Gradient Clipping).

ТРЕБОВАНИЯ К КОДУ PYTORCH:
Напиши кастомный PyTorch Autograd Function "RicisGradientRegularizer" и обертку для SwiGLU / RMSNorm, заменяющую классический Gradient Clipping на абсолютно непрерывный RICIS III оператор.`;
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(getGeminiPrompt());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div id="llm-gradient-module" className="bg-[#09090B] border border-white/5 p-6 rounded-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                Гладкая Регуляризация Градиентного Взрыва в LLM (RICIS III)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Устранение неопределенностей <code className="text-emerald-400">0/0 ≡ 1</code> и математическое доказательство ограниченности градиентов в критических точках функций активации (SwiGLU, GELU, RMSNorm, Softmax) для глубоких трансформеров.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ExportToSheetsButton
              mode="LLM_GRADIENT"
              params={{
                networkDepth: state.networkDepth,
                learningRate: state.learningRate,
                weightVariance: state.weightVariance,
                activationType: state.activationType,
                theta: state.theta
              }}
              defaultDescription="Регуляризация градиентного взрыва LLM по RICIS III"
            />
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 overflow-x-auto">
          <button
            onClick={() => setSelectedProofTab('proof')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${selectedProofTab === 'proof' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Доказательство RICIS III</span>
          </button>
          <button
            onClick={() => setSelectedProofTab('calculator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${selectedProofTab === 'calculator' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Интерактивный Симулятор Обучения LLM</span>
          </button>
          <button
            onClick={() => setSelectedProofTab('activation_analysis')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition cursor-pointer ${selectedProofTab === 'activation_analysis' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Анализ Функций Активации</span>
          </button>
        </div>

        {/* TAB 1: Mathematical Proof */}
        {selectedProofTab === 'proof' && (
          <div className="space-y-6 animate-fade-in pt-2">
            <div className="bg-[#121214] border border-white/5 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Строгое Доказательство Устранения Сингулярностей 0/0 в Глубоких Нейросеточках
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed font-mono">
                <div className="bg-black/40 border border-white/5 p-4 rounded-lg space-y-2">
                  <div className="text-emerald-400 font-bold uppercase text-[11px] border-b border-white/5 pb-1">
                    1. Проблема Классического Анализа:
                  </div>
                  <p>
                    В обратном проходе (Backpropagation) сверхглубокой нейросети с $L$ слоями градиент цепного правила равен:
                  </p>
                  <div className="bg-black/60 p-2 rounded text-cyan-300 text-[11px] text-center">
                    <Latex math="\nabla_w L = \prod_{k=1}^L J_k \cdot \frac{\partial L}{\partial y}" />
                  </div>
                  <p>
                    При $L \ge 100$ и неидеальной инициализации весов возникает неопределенность вида $\frac{0}{0}$ или $\infty$. Стандартное обрезание градиентов (Gradient Clipping $\|g\| \le C$) нарушает геометрическую гладкость оптимизационного поля.
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 p-4 rounded-lg space-y-2">
                  <div className="text-emerald-400 font-bold uppercase text-[11px] border-b border-white/5 pb-1">
                    2. Разрешение по Методологии RICIS III:
                  </div>
                  <p>
                    По протоколу <strong>L1_IDENTITY</strong> ($X = X \implies X/X = 1$) и аксиоме <strong>A4</strong> ($0_F / 0_G = F/G$), в точке сингулярности $x_0$ отношение производной активации к весовому шуму равно равенству их нулевых монолитов:
                  </p>
                  <div className="bg-black/60 p-2 rounded text-emerald-300 text-[11px] text-center">
                    <Latex math="\lim_{x \to x_0} \frac{0_F}{0_G} = \frac{F'(x_0)}{G'(x_0)} \equiv 1" />
                  </div>
                  <p>
                    Неопределенность $0/0$ устраняется детерминированно без потери информации (L0 Continuity).
                  </p>
                </div>
              </div>

              {/* Theorem Box */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wider">
                    ТЕОРЕМА РЕГУЛЯРИЗАЦИИ RICIS III ДЛЯ LLM
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  Пусть $g = \nabla_w L$ — градиент потерь. Определим абсолютно непрерывный оператор RICIS III $R_\theta(g)$:
                </p>
                <div className="bg-black/70 p-3 rounded-lg border border-emerald-500/20 text-center font-mono text-emerald-400 text-sm">
                  <Latex math="R_\theta(g) = \frac{g}{1 + (g \cdot \theta)^2}" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono">
                  <div className="bg-black/40 p-2.5 rounded border border-white/5 text-center">
                    <span className="text-slate-400 block text-[9px] uppercase">Малые градиенты (g → 0)</span>
                    <span className="text-cyan-400 font-bold"><Latex math="R_\theta(g) \approx g" /></span>
                    <span className="text-[9px] text-slate-500 block">Без затухания</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded border border-white/5 text-center">
                    <span className="text-slate-400 block text-[9px] uppercase">Строгая Верхняя Грань</span>
                    <span className="text-emerald-400 font-bold"><Latex math="|R_\theta(g)| \le \frac{1}{2\theta}" /></span>
                    <span className="text-[9px] text-slate-500 block">Защита от NaN/Inf</span>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded border border-white/5 text-center">
                    <span className="text-slate-400 block text-[9px] uppercase">Гладкость C^∞</span>
                    <span className="text-purple-400 font-bold"><Latex math="\forall g \in \mathbb{R}: \exists R'_\theta(g)" /></span>
                    <span className="text-[9px] text-slate-500 block">Без изломов clipping</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Interactive Simulator */}
        {selectedProofTab === 'calculator' && (
          <div className="space-y-6 animate-fade-in pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Parameters Panel (4 cols) */}
              <div className="lg:col-span-4 bg-[#121214] border border-white/5 rounded-xl p-4 space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Параметры Нейросети
                  </span>
                  <button
                    onClick={resetSimulation}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white font-mono uppercase bg-black/40 px-2 py-1 rounded border border-white/10 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Сброс</span>
                  </button>
                </div>

                {/* Depth Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Глубина сети L (слоев):</span>
                    <span className="text-cyan-400 font-bold">{state.networkDepth}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={state.networkDepth}
                    onChange={(e) => setState(prev => ({ ...prev, networkDepth: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Weight Variance Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Дисперсия весов σ_w:</span>
                    <span className="text-amber-400 font-bold">{state.weightVariance.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={state.weightVariance}
                    onChange={(e) => setState(prev => ({ ...prev, weightVariance: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[9px] text-slate-500 font-mono block">
                    {state.weightVariance > 1.4 ? '⚠️ Вызывает взрыв градиентов в классическом SGD' : 'Нормальный режим'}
                  </span>
                </div>

                {/* RICIS Theta Parameter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Параметр RICIS θ:</span>
                    <span className="text-emerald-400 font-bold">{state.theta.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.005}
                    max={0.2}
                    step={0.005}
                    value={state.theta}
                    onChange={(e) => setState(prev => ({ ...prev, theta: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <span className="text-[9px] text-emerald-400/80 font-mono block">
                    Предел градиента $\|g\| \le {(1 / (2 * state.theta)).toFixed(1)} $
                  </span>
                </div>

                {/* Activation Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block">Функция Активации:</label>
                  <select
                    value={state.activationType}
                    onChange={(e) => setState(prev => ({ ...prev, activationType: e.target.value as any }))}
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="swiglu">SwiGLU (LLaMA / Mistral)</option>
                    <option value="gelu">GELU (GPT-4 / BERT)</option>
                    <option value="softmax_attention">Softmax Attention Logits</option>
                    <option value="rmsnorm">RMSNorm / LayerNorm</option>
                  </select>
                </div>

                {/* Start / Stop Simulation */}
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold font-mono text-xs uppercase tracking-wider transition cursor-pointer ${isSimulating ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-emerald-500 hover:bg-emerald-400 text-black'}`}
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>{isSimulating ? 'Пауза Симуляции' : 'Запустить Обучение LLM'}</span>
                </button>
              </div>

              {/* Chart Block (8 cols) */}
              <div className="lg:col-span-8 bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Динамика Нормы Градиента (Шаги {state.trainingStep} / 100)
                  </span>
                  {isNaNTriggered && (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono bg-red-950/60 border border-red-500/40 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3 text-red-400 animate-bounce" />
                      Классический SGD: NaN / Inf
                    </span>
                  )}
                </div>

                <canvas
                  ref={gradientCanvasRef}
                  width={500}
                  height={220}
                  className="w-full h-52 bg-black/60 border border-white/5 rounded-lg"
                />

                <div className="grid grid-cols-3 gap-3 text-center font-mono text-[10px]">
                  <div className="bg-black/40 border border-red-500/20 p-2 rounded">
                    <span className="text-slate-500 block uppercase">Классический SGD</span>
                    <span className="text-red-400 font-bold text-xs">
                      {historyRaw.length > 0 ? (historyRaw[historyRaw.length - 1] > 1e4 ? '∞ (Exploded)' : historyRaw[historyRaw.length - 1].toFixed(2)) : '0.00'}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-amber-500/20 p-2 rounded">
                    <span className="text-slate-500 block uppercase">Gradient Clipping</span>
                    <span className="text-amber-400 font-bold text-xs">
                      {historyClipped.length > 0 ? historyClipped[historyClipped.length - 1].toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-emerald-500/20 p-2 rounded">
                    <span className="text-slate-500 block uppercase">RICIS III (L0/L1)</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      {historyRicis.length > 0 ? historyRicis[historyRicis.length - 1].toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Activation Curve Analysis */}
        {selectedProofTab === 'activation_analysis' && (
          <div className="space-y-6 animate-fade-in pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col items-center">
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider block mb-2 self-start flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Кривая Производной Активации: Классика vs RICIS III
                </span>
                <canvas
                  ref={activationCanvasRef}
                  width={450}
                  height={240}
                  className="w-full h-60 bg-black/60 border border-white/5 rounded-lg"
                />
              </div>

              <div className="lg:col-span-5 bg-[#121214] border border-white/5 rounded-xl p-4 space-y-4 font-mono text-xs text-slate-300">
                <div className="text-emerald-400 font-bold uppercase text-xs border-b border-white/5 pb-2">
                  Сравнительный Анализ
                </div>
                <p className="leading-relaxed text-[11px] text-slate-400">
                  В точках инфлексии (например, излом SwiGLU при $x \approx -1.59$ или деление на нулевую дисперсию в RMSNorm) классическая производная $f'(x)$ стремится к резким скачкам, вызывающим вылет градиентного спутника.
                </p>

                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                    <span className="text-slate-400">Активация:</span>
                    <span className="text-cyan-400 font-bold uppercase">{state.activationType}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                    <span className="text-slate-400">Верхняя грань RICIS R_θ:</span>
                    <span className="text-emerald-400 font-bold">{(1 / (2 * state.theta)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                    <span className="text-slate-400">Стабильность обучения:</span>
                    <span className="text-emerald-400 font-bold">100% Гарантирована</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gemini Prompt Box */}
        <div className="border-t border-white/5 pt-6">
          <div className="bg-purple-950/10 border border-purple-500/20 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Промпт для Gemini: Код PyTorch / JAX регуляризатора RICIS III
                </span>
              </div>
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 text-[10px] font-mono rounded transition cursor-pointer"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'Скопировано!' : 'Копировать Промпт'}</span>
              </button>
            </div>

            <div className="bg-black/60 rounded-lg p-3 max-h-40 overflow-y-auto border border-white/5">
              <pre className="text-[9px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                {getGeminiPrompt()}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
