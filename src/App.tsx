/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SingularityMode } from './types';
import { useLanguage, setLanguage } from './lib/i18n';
import GravitationalSingularity from './components/GravitationalSingularity';
import ComplexSingularity from './components/ComplexSingularity';
import KinematicSingularity from './components/KinematicSingularity';
import RicisTheory from './components/RicisTheory';
import NavierStokesSingularity from './components/NavierStokesSingularity';
import RiemannSingularity from './components/RiemannSingularity';
import YangMillsSingularity from './components/YangMillsSingularity';
import PVsNPSingularity from './components/PVsNPSingularity';
import HodgeSingularity from './components/HodgeSingularity';
import BSDSingularity from './components/BSDSingularity';
import PoincareSingularity from './components/PoincareSingularity';
import CasesAndSolutions from './components/CasesAndSolutions';
import RicisAgent from './components/RicisAgent';
import ChladniSingularity from './components/ChladniSingularity';
import MandelbrotSingularity from './components/MandelbrotSingularity';
import CDCCSingularity from './components/CDCCSingularity';
import LLMGradientSingularity from './components/LLMGradientSingularity';
import { Orbit, Sparkles, Cpu, BookOpen, Infinity, ShieldCheck, Droplet, LineChart, Flame, Target, Globe, MessageSquare, Waves, MoreHorizontal, ChevronDown, ChevronUp, Share2, Check, Menu, X, HelpCircle, Info, ExternalLink, Award, MapPin, Mail, User } from 'lucide-react';
import Latex from './components/Latex';

const MODE_METADATA: Record<SingularityMode, { label: string, icon: React.ComponentType<any>, colorClass?: string }> = {
  [SingularityMode.GRAVITATIONAL]: { label: 'Гравитационные сингулярности', icon: Orbit, colorClass: 'text-cyan-400' },
  [SingularityMode.COMPLEX_ANALYSIS]: { label: 'Комплексный анализ (Полюса)', icon: Sparkles, colorClass: 'text-cyan-400' },
  [SingularityMode.KINEMATIC]: { label: 'Кинематика манипуляторов', icon: Cpu, colorClass: 'text-cyan-400' },
  [SingularityMode.NAVIER_STOKES]: { label: 'Уравнения Навье-Стокса', icon: Droplet, colorClass: 'text-cyan-400' },
  [SingularityMode.RIEMANN]: { label: 'Дзета Римана (Полюс s=1)', icon: LineChart, colorClass: 'text-cyan-400' },
  [SingularityMode.YANG_MILLS]: { label: 'Существование Янга-Миллса', icon: Flame, colorClass: 'text-purple-400' },
  [SingularityMode.P_VS_NP]: { label: 'P vs NP (Сложность)', icon: Target, colorClass: 'text-cyan-400' },
  [SingularityMode.LLM_GRADIENT]: { label: 'Градиентный Взрыв в LLM', icon: ShieldCheck, colorClass: 'text-emerald-400' },
  [SingularityMode.HODGE]: { label: 'Гипотеза Ходжа', icon: Globe, colorClass: 'text-cyan-400' },
  [SingularityMode.BSD]: { label: 'Гипотеза BSD', icon: LineChart, colorClass: 'text-cyan-400' },
  [SingularityMode.POINCARE]: { label: 'Сфера Пуанкаре', icon: Globe, colorClass: 'text-cyan-400' },
  [SingularityMode.THEORY]: { label: 'Математическое обоснование', icon: BookOpen, colorClass: 'text-cyan-400' },
  [SingularityMode.CASES_AND_SOLUTIONS]: { label: 'Решенные проблемы (RICIS)', icon: ShieldCheck, colorClass: 'text-cyan-400' },
  [SingularityMode.CHLADNI]: { label: 'Фигуры Хладни', icon: Waves, colorClass: 'text-amber-400' },
  [SingularityMode.MANDELBROT]: { label: 'Сингулярности Мандельброта', icon: Infinity, colorClass: 'text-cyan-400' },
  [SingularityMode.RICIS_AGENT]: { label: 'ИИ Ассистент RICIS', icon: MessageSquare, colorClass: 'text-cyan-400' },
  [SingularityMode.CDCC]: { label: 'Континуум-гипотеза Кантора (CDCC)', icon: Infinity, colorClass: 'text-emerald-400' }
};

const ALL_PRESETS = [
  {
    id: 'gravitational',
    name: 'Гравитационный коллапс (r → 0)',
    nameEn: 'Gravitational Collapse (r → 0)',
    mode: SingularityMode.GRAVITATIONAL,
    params: { mass: 5, spin: 0.0, charge: 0.0, radius: 0.1, regularization: 0.8 }
  },
  {
    id: 'complex',
    name: 'Существенная сингулярность exp(1/z)',
    nameEn: 'Essential Singularity exp(1/z)',
    mode: SingularityMode.COMPLEX_ANALYSIS,
    params: { funcType: 'essential', singularityX: 0.0, singularityY: 0.0, zoom: 1.5, blowUp: 0.25, cursorX: 0.1, cursorY: 0.1 }
  },
  {
    id: 'kinematic',
    name: 'Сингулярность Якобиана робота',
    nameEn: 'Robot Jacobian Singularity',
    mode: SingularityMode.KINEMATIC,
    params: { angle1: 0, angle2: 180, length1: 100, length2: 80, targetVx: 30, targetVy: 20, damping: 0.2 }
  },
  {
    id: 'navier',
    name: 'Ударная волна Навье-Стокса',
    nameEn: 'Navier-Stokes Shockwave',
    mode: SingularityMode.NAVIER_STOKES,
    params: { reynolds: 150, radialVelocity: 3.0, observerRadius: 0.05, regularization: 0.7, viscosity: 0.1 }
  },
  {
    id: 'riemann',
    name: 'Дзета Римана (Полюс s=1)',
    nameEn: 'Riemann Zeta (Pole s=1)',
    mode: SingularityMode.RIEMANN,
    params: { sigma: 1.0, t: 0.0, regularization: 0.4, zoom: 3.5 }
  },
  {
    id: 'yangmills',
    name: 'Конфайнмент Янга-Миллса',
    nameEn: 'Yang-Mills Confinement',
    mode: SingularityMode.YANG_MILLS,
    params: { coupling: 1.5, distance: 0.02, regularization: 0.5, energyScale: 0.4 }
  },
  {
    id: 'chladni_node',
    name: 'Резонанс Хладни (2.2 kHz)',
    nameEn: 'Chladni Resonance (2.2 kHz)',
    mode: SingularityMode.CHLADNI,
    params: { activePackage: 3, frequency: 800, regularization: 0.12, damping: 0.02, plateType: 'circle', sandType: 'colored' }
  },
  {
    id: 'mandelbrot_cusp',
    name: 'Сингулярность Мандельброта (Cusp)',
    nameEn: 'Mandelbrot Singularity Cusp',
    mode: SingularityMode.MANDELBROT,
    params: { centerX: 0.25, centerY: 0.0, zoom: 4.0, ricisTheta: 0.15, juliaMode: false }
  },
  {
    id: 'cdcc_diagonal',
    name: 'Континуум-гипотеза Кантора (CDCC)',
    nameEn: "Cantor's Diagonal Continuum Conjecture",
    mode: SingularityMode.CDCC,
    params: { gridSize: 8, theta: 0.0, animationSpeed: 1.5, showMissingNumber: true }
  }
];

const SIMPLE_EXAMPLES = [
  { id: 'L0', name: 'Базовая сингулярность', nameEn: 'Base Singularity', formula: '10 / (x - 2)' },
  { id: 'L1', name: 'Устранимый разрыв', nameEn: 'Removable Discontinuity', formula: '(x² - 25) / (x - 5)' },
  { id: 'L3', name: 'Квадратичный знаменатель', nameEn: 'Quadratic Denominator', formula: '1 / (x² - 4)' },
  { id: 'L6', name: 'Замечательный предел', nameEn: 'Notable Limit (Sinc)', formula: 'sin(x) / x' },
  { id: 'L10', name: 'Экспоненциальный разрыв', nameEn: 'Exponential Discontinuity', formula: '(e^x - 1) / x' },
  { id: 'A4', name: 'Неопределенность 0/0', nameEn: 'Indeterminacy 0/0', formula: '0_F / 0_G = F/G' },
  { id: 'A5', name: 'Неопределенность ∞/∞', nameEn: 'Indeterminacy ∞/∞', formula: '∞_F / ∞_G = F/G' },
  { id: 'A6', name: 'Произведение 0 × ∞', nameEn: 'Product of 0 and ∞', formula: '0_F × ∞_G = F·G' },
  { id: 'A7', name: 'Разность бесконечностей', nameEn: 'Difference of Infinities', formula: '∞_F - ∞_G = ∞_{F-G}' },
];

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [activeMode, setActiveMode] = useState<SingularityMode>(SingularityMode.CASES_AND_SOLUTIONS);
  const [activeState, setActiveState] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Shared preset states to feed into simulator modules
  const [gravitationalPreset, setGravitationalPreset] = useState<any>(undefined);
  const [complexPreset, setComplexPreset] = useState<any>(undefined);
  const [kinematicPreset, setKinematicPreset] = useState<any>(undefined);
  const [navierStokesPreset, setNavierStokesPreset] = useState<any>(undefined);
  const [riemannPreset, setRiemannPreset] = useState<any>(undefined);
  const [yangMillsPreset, setYangMillsPreset] = useState<any>(undefined);
  const [pVsNPPreset, setPVsNPPreset] = useState<any>(undefined);
  const [hodgePreset, setHodgePreset] = useState<any>(undefined);
  const [bsdPreset, setBsdPreset] = useState<any>(undefined);
  const [poincarePreset, setPoincarePreset] = useState<any>(undefined);
  const [chladniPreset, setChladniPreset] = useState<any>(undefined);
  const [mandelbrotPreset, setMandelbrotPreset] = useState<any>(undefined);
  const [cdccPreset, setCdccPreset] = useState<any>(undefined);
  const [llmGradientPreset, setLlmGradientPreset] = useState<any>(undefined);

  // Dynamic navigation optimization: track section visit counts
  const [visits, setVisits] = useState<Record<SingularityMode, number>>(() => {
    const initial: Record<SingularityMode, number> = {} as any;
    Object.values(SingularityMode).forEach(mode => {
      initial[mode] = 0;
    });
    try {
      const stored = localStorage.getItem('ricis_tab_visits');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          Object.values(SingularityMode).forEach(mode => {
            if (typeof parsed[mode] === 'number') {
              initial[mode] = parsed[mode];
            }
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initial;
  });

  const [headerExpanded, setHeaderExpanded] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showAuthorModal, setShowAuthorModal] = useState<boolean>(false);
  const [selectedStressTest, setSelectedStressTest] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (menuId: string) => {
    setActiveDropdown(prev => prev === menuId ? null : menuId);
  };

  const closeAllDropdowns = () => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    setVisits(prev => {
      const updated = {
        ...prev,
        [activeMode]: (prev[activeMode] || 0) + 1
      };
      try {
        localStorage.setItem('ricis_tab_visits', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // Synchronize active mode with URL query parameter for SEO and direct links
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode')?.toUpperCase() !== activeMode) {
        params.set('mode', activeMode);
        // Clean up state parameter if moving to a different tab, to avoid mixing states
        if (params.has('state')) {
          params.delete('state');
        }
        window.history.pushState(null, '', `?${params.toString()}`);
      }
    } catch (err) {
      console.error('Error updating URL with mode:', err);
    }
  }, [activeMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Shareable link logic: copy to clipboard
  const handleCopyShareLink = () => {
    try {
      const baseUrl = window.location.origin + window.location.pathname;
      const stateStr = activeState ? encodeURIComponent(JSON.stringify(activeState)) : '';
      const url = `${baseUrl}?mode=${activeMode}${stateStr ? `&state=${stateStr}` : ''}`;
      
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // URL State Resolution on Mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      const stateParam = params.get('state');

      if (modeParam) {
        let uppercaseMode = modeParam.toUpperCase();
        if (uppercaseMode === 'MALDENBROT') {
          uppercaseMode = 'MANDELBROT';
        }
        if (Object.values(SingularityMode).includes(uppercaseMode as SingularityMode)) {
          const mode = uppercaseMode as SingularityMode;
          
          if (stateParam) {
            const parsedState = JSON.parse(decodeURIComponent(stateParam));
            if (parsedState && typeof parsedState === 'object') {
              handleLoadPreset(mode, parsedState);
              return;
            }
          }
          setActiveMode(mode);
        }
      }
    } catch (e) {
      console.error("Error parsing shared state from URL:", e);
    }
  }, []);

  const handleLoadPreset = (mode: SingularityMode, params: any) => {
    if (mode === SingularityMode.GRAVITATIONAL) {
      setGravitationalPreset(params);
    } else if (mode === SingularityMode.COMPLEX_ANALYSIS) {
      setComplexPreset(params);
    } else if (mode === SingularityMode.KINEMATIC) {
      setKinematicPreset(params);
    } else if (mode === SingularityMode.NAVIER_STOKES) {
      setNavierStokesPreset(params);
    } else if (mode === SingularityMode.RIEMANN) {
      setRiemannPreset(params);
    } else if (mode === SingularityMode.YANG_MILLS) {
      setYangMillsPreset(params);
    } else if (mode === SingularityMode.P_VS_NP) {
      setPVsNPPreset(params);
    } else if (mode === SingularityMode.HODGE) {
      setHodgePreset(params);
    } else if (mode === SingularityMode.BSD) {
      setBsdPreset(params);
    } else if (mode === SingularityMode.POINCARE) {
      setPoincarePreset(params);
    } else if (mode === SingularityMode.CHLADNI) {
      setChladniPreset(params);
    } else if (mode === SingularityMode.MANDELBROT) {
      setMandelbrotPreset(params);
    } else if (mode === SingularityMode.CDCC) {
      setCdccPreset(params);
    }
    setActiveMode(mode);
  };

  const visitCounts = Object.values(visits) as number[];
  const totalVisits = visitCounts.reduce((sum, count) => sum + count, 0);
  const hasVisits = visitCounts.some(v => v > 0);

  // Default fallback sections representing solved problems, assistant, and theory
  const defaultModes = [
    SingularityMode.CASES_AND_SOLUTIONS,
    SingularityMode.RICIS_AGENT,
    SingularityMode.THEORY
  ];

  let visibleModes: SingularityMode[] = [];

  if (!hasVisits) {
    visibleModes = [...defaultModes];
    if (!visibleModes.includes(activeMode)) {
      visibleModes.push(activeMode);
    }
  } else {
    // Sort all modes by visit count descending
    const sortedModes = (Object.values(SingularityMode) as SingularityMode[])
      .sort((a, b) => (visits[b] || 0) - (visits[a] || 0));

    // Limit to 4 most visited modes initially
    const limit = 4;
    visibleModes = sortedModes.slice(0, limit);

    // If activeMode is not in visible list, we MUST include it (to keep current active tab visible)
    if (!visibleModes.includes(activeMode)) {
      visibleModes.push(activeMode);
    } else {
      // If it is already in top 4, we can expand to top 5 most visited
      visibleModes = sortedModes.slice(0, 5);
    }
  }

  // Hidden modes are all modes that are not in visibleModes
  const hiddenModes = (Object.values(SingularityMode) as SingularityMode[])
    .filter(mode => !visibleModes.includes(mode));

  return (
    <div id="app-root" className="min-h-screen bg-[#09090B] text-slate-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Upper ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Primary Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Top Status Bar (Narrow / Expandable) */}
        {!headerExpanded ? (
          <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-[10px] font-mono mb-6 text-slate-400 select-none backdrop-blur-sm shadow-md animate-fade-in">
            <div className="flex items-center gap-3.5">
              <span className="text-white font-bold tracking-widest uppercase">{t('RICIS III PARADIGM')}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold">
                v3.0.4-Alpha
              </span>
              <div className="w-px h-3 bg-white/10 hidden sm:block" />
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('STABLE')}
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-slate-500 hidden md:flex items-center gap-1">
                <span>{t('ENTROPY:')}</span>
                <span className="text-slate-300 font-semibold">0.000214%</span>
              </div>
              <div className="w-px h-3 bg-white/10 hidden md:block" />
              <div className="text-slate-500 hidden md:flex items-center gap-1">
                <span>{t('UPTIME:')}</span>
                <span className="text-slate-300 font-semibold">128:44:02</span>
              </div>
              <div className="w-px h-3 bg-white/10 hidden md:block" />
              <button 
                onClick={() => setHeaderExpanded(true)}
                className="flex items-center gap-1 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500/20 text-[9px] font-bold tracking-wider cursor-pointer transition uppercase"
                title={t('Развернуть полный баннер', 'Expand full banner')}
              >
                <span>{t('ИНФО', 'INFO')}</span>
                <ChevronDown className="w-3 h-3 text-cyan-400" />
              </button>
            </div>
          </div>
        ) : (
          <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10 pb-6 bg-black/20 p-6 rounded-xl border border-white/5 relative animate-fade-in">
            {/* Collapse Arrow Button */}
            <button 
              onClick={() => setHeaderExpanded(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-cyan-400 transition cursor-pointer p-1.5 rounded-md hover:bg-white/5"
              title={t('Свернуть в статус-бар', 'Collapse to status bar')}
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold bg-cyan-950/20 text-lg font-display shadow-[0_0_15px_rgba(34,211,238,0.2)] select-none">
                R3
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold tracking-widest text-white uppercase font-display select-none">
                    RICIS III PARADIGM
                  </h1>
                  <span className="text-[9px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 select-none">
                    v3.0.4-Alpha
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {t('Интерактивный вычислительный комплекс для решения и регуляризации гравитационных, комплексных и кинематических сингулярностей.')}
                </p>
              </div>
            </div>

            {/* Telemetry Metrics */}
            <div className="flex flex-wrap gap-6 text-[10px] font-mono bg-black/40 border border-white/5 p-3 rounded-lg md:self-stretch items-center">
              <div className="flex flex-col items-start md:items-end">
                <span className="text-slate-500 text-[9px] tracking-wider uppercase">{t('SYSTEM STATUS')}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t('STABLE / CORE OK')}
                </span>
              </div>
              <div className="w-px h-6 bg-white/10 hidden sm:block" />
              <div className="flex flex-col items-start md:items-end">
                <span className="text-slate-500 text-[9px] tracking-wider uppercase">{t('ENTROPY BIAS')}</span>
                <span className="text-white font-semibold">0.000214%</span>
              </div>
              <div className="w-px h-6 bg-white/10 hidden sm:block" />
              <div className="flex flex-col items-start md:items-end">
                <span className="text-slate-500 text-[9px] tracking-wider uppercase">{t('UPTIME HOURS')}</span>
                <span className="text-white font-semibold">128:44:02</span>
              </div>
              <div className="w-px h-6 bg-white/10 hidden sm:block" />
              <div className="flex flex-col items-start md:items-end">
                <span className="text-slate-500 text-[9px] tracking-wider uppercase">{t('SHARE / ССЫЛКА', 'SHARE')}</span>
                <button
                  onClick={handleCopyShareLink}
                  className="mt-1 px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wider transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center gap-1 cursor-pointer select-none"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{t('COPIED!', 'СКОПИРОВАНО!')}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3 text-cyan-400" />
                      <span>{t('COPY LINK', 'СКОПИРОВАТЬ')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>
        )}

        {/* MS Office 2000 Style Navigation Bar */}
        <div ref={dropdownRef} className="relative z-50 mb-8 select-none">
          {/* Desktop Toolbar */}
          <nav className="hidden md:flex items-center justify-between bg-[#111113] border border-white/10 rounded-lg px-2 h-11 text-xs font-mono shadow-xl relative">
            <div className="flex items-center space-x-1.5">
              {/* File Menu */}
              <div className="relative">
                <button 
                  onClick={() => toggleDropdown('file')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1 font-bold transition cursor-pointer select-none ${activeDropdown === 'file' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  <span>{t('ФАЙЛ', 'FILE')}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === 'file' && (
                  <div className="absolute left-0 mt-2.5 w-60 bg-[#09090b] border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-fade-in">
                    <button 
                      onClick={() => { setActiveMode(SingularityMode.CASES_AND_SOLUTIONS); closeAllDropdowns(); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 ${activeMode === SingularityMode.CASES_AND_SOLUTIONS ? 'bg-cyan-950/20 text-cyan-300 font-semibold' : ''}`}
                    >
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('Решенные проблемы', 'Solved Problems')}</span>
                    </button>
                    <button 
                      onClick={() => { setActiveMode(SingularityMode.THEORY); closeAllDropdowns(); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 ${activeMode === SingularityMode.THEORY ? 'bg-cyan-950/20 text-cyan-300 font-semibold' : ''}`}
                    >
                      <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('Математическая теория', 'Mathematical Theory')}</span>
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <button 
                      onClick={() => { handleCopyShareLink(); closeAllDropdowns(); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5"
                    >
                      <Share2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('Скопировать ссылку', 'Copy Share Link')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Singularities Menu */}
              <div className="relative">
                <button 
                  onClick={() => toggleDropdown('singularities')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1 font-bold transition cursor-pointer select-none ${activeDropdown === 'singularities' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  <span>{t('СИНГУЛЯРНОСТИ', 'SINGULARITIES')}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === 'singularities' && (
                  <div className="absolute left-0 mt-2.5 w-72 bg-[#09090b] border border-white/10 rounded-lg shadow-2xl py-1.5 z-50 max-h-[420px] overflow-y-auto custom-scrollbar animate-fade-in">
                    <div className="px-4 py-1 text-[9px] text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1.5">
                      {t('Регуляризация RICIS III:', 'RICIS III Regularization:')}
                    </div>
                    {[
                      { mode: SingularityMode.GRAVITATIONAL, label: 'Гравитационные сингулярности', icon: Orbit },
                      { mode: SingularityMode.COMPLEX_ANALYSIS, label: 'Комплексный анализ (Полюса)', icon: Sparkles },
                      { mode: SingularityMode.KINEMATIC, label: 'Кинематика манипуляторов', icon: Cpu },
                      { mode: SingularityMode.NAVIER_STOKES, label: 'Уравнения Навье-Стокса', icon: Droplet },
                      { mode: SingularityMode.RIEMANN, label: 'Дзета Римана (Полюс s=1)', icon: LineChart },
                      { mode: SingularityMode.YANG_MILLS, label: 'Существование Янга-Миллса', icon: Flame },
                      { mode: SingularityMode.P_VS_NP, label: 'P vs NP (Сложность)', icon: Target },
                      { mode: SingularityMode.LLM_GRADIENT, label: 'Градиентный Взрыв в LLM', icon: ShieldCheck, colorClass: 'text-emerald-400' },
                      { mode: SingularityMode.CHLADNI, label: 'Фигуры Хладни', icon: Waves, colorClass: 'text-amber-400' },
                      { mode: SingularityMode.MANDELBROT, label: 'Множество Мандельброта', icon: Infinity, colorClass: 'text-cyan-400' },
                      { mode: SingularityMode.CDCC, label: 'Континуум-гипотеза (CDCC)', icon: Infinity, colorClass: 'text-emerald-400' },
                      { mode: SingularityMode.POINCARE, label: 'Сфера Пуанкаре', icon: Globe },
                      { mode: SingularityMode.HODGE, label: 'Гипотеза Ходжа', icon: Globe },
                      { mode: SingularityMode.BSD, label: 'Гипотеза BSD', icon: LineChart }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = activeMode === item.mode;
                      return (
                        <button 
                          key={item.mode}
                          onClick={() => { setActiveMode(item.mode); closeAllDropdowns(); }}
                          className={`w-full text-left px-4 py-2 hover:bg-white/5 text-slate-300 hover:text-white flex items-center justify-between ${isActive ? 'bg-cyan-950/20 text-cyan-300 font-semibold border-l-2 border-cyan-500' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${item.colorClass ? item.colorClass : (isActive ? 'text-cyan-400' : 'text-slate-500')}`} />
                            <span className="truncate">{t(item.label)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Model Examples (Типовые примеры) Menu */}
              <div className="relative">
                <button 
                  onClick={() => toggleDropdown('simpleExamples')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1 font-bold transition cursor-pointer select-none ${activeDropdown === 'simpleExamples' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                >
                  <span>{t('ТИПОВЫЕ ПРИМЕРЫ', 'MODEL EXAMPLES')}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === 'simpleExamples' && (
                  <div className="absolute left-0 mt-2.5 w-80 bg-[#09090b] border border-white/10 rounded-lg shadow-2xl py-1.5 z-50 max-h-[380px] overflow-y-auto custom-scrollbar animate-fade-in">
                    <div className="px-4 py-1 text-[9px] text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1.5">
                      {t('Простые аналитические сингулярности:', 'Simple analytical singularities:')}
                    </div>
                    {SIMPLE_EXAMPLES.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => { setSelectedStressTest(item.id); setActiveMode(SingularityMode.CASES_AND_SOLUTIONS); closeAllDropdowns(); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex flex-col gap-0.5 border-b border-white/5 last:border-0 transition"
                      >
                        <span className="font-bold text-xs text-cyan-400">{language === 'ru' ? item.name : item.nameEn}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-semibold">{item.formula}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Help Menu */}
              <div className="relative">
                <button 
                  onClick={() => toggleDropdown('help')}
                  className={`px-3 py-1.5 rounded flex items-center gap-1 font-bold transition cursor-pointer select-none border ${activeDropdown === 'help' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'}`}
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" />
                  <span>{t('СПРАВКА', 'HELP')}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === 'help' && (
                  <div className="absolute right-0 mt-2.5 w-64 bg-[#09090b] border border-white/10 rounded-lg shadow-2xl py-1 z-50 animate-fade-in">
                    <button 
                      onClick={() => { setShowAboutModal(true); closeAllDropdowns(); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 border-b border-white/5"
                    >
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('О проекте', 'About')}</span>
                    </button>
                    <button 
                      onClick={() => { setShowAuthorModal(true); closeAllDropdowns(); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 border-b border-white/5"
                    >
                      <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('Об авторе', 'About Author')}</span>
                    </button>
                    <button 
                      onClick={() => { setActiveMode(SingularityMode.RICIS_AGENT); closeAllDropdowns(); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 border-b border-white/5 ${activeMode === SingularityMode.RICIS_AGENT ? 'bg-cyan-950/20 text-cyan-300 font-semibold' : ''}`}
                    >
                      <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('ИИ сервис', 'AI Service')}</span>
                    </button>
                    <button 
                      onClick={() => { setActiveMode(SingularityMode.THEORY); closeAllDropdowns(); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 border-b border-white/5 ${activeMode === SingularityMode.THEORY ? 'bg-cyan-950/20 text-cyan-300 font-semibold' : ''}`}
                    >
                      <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('Описание концепта', 'Concept Description')}</span>
                    </button>
                    <button 
                      onClick={() => { setActiveMode(SingularityMode.CASES_AND_SOLUTIONS); closeAllDropdowns(); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2.5 ${activeMode === SingularityMode.CASES_AND_SOLUTIONS ? 'bg-cyan-950/20 text-cyan-300 font-semibold' : ''}`}
                    >
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{t('Примеры простых сингулярностей', 'Simple Singularities Examples')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex items-center space-x-1 pr-1">
              <span className="text-slate-600 text-[10px] uppercase font-bold mr-1">{t('Язык:', 'LANG:')}</span>
              <button
                onClick={() => { setLanguage('ru'); closeAllDropdowns(); }}
                className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider transition cursor-pointer ${language === 'ru' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
              >
                RU
              </button>
              <button
                onClick={() => { setLanguage('en'); closeAllDropdowns(); }}
                className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider transition cursor-pointer ${language === 'en' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
              >
                EN
              </button>
            </div>
          </nav>

          {/* Mobile Navigation (Hamburger + Header) */}
          <div className="md:hidden">
            <div className="flex items-center justify-between bg-[#111113] border border-white/10 rounded-lg px-4 h-11 text-xs font-mono shadow-xl relative z-40">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 flex items-center gap-2 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5 text-cyan-400" />}
                <span className="font-bold tracking-wider uppercase">{t('МЕНЮ', 'MENU')}</span>
              </button>
              
              <span className="text-cyan-400 font-bold text-[11px] truncate max-w-[140px] uppercase">
                {t(MODE_METADATA[activeMode].label)}
              </span>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${language === 'ru' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500'}`}
                >
                  RU
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${language === 'en' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500'}`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Mobile Dropdown Panel */}
            {mobileMenuOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-[#09090b]/95 border border-white/10 rounded-lg shadow-2xl z-50 p-3 backdrop-blur-md max-h-[450px] overflow-y-auto custom-scrollbar animate-fade-in space-y-4">
                {/* File */}
                <div className="space-y-1">
                  <div className="px-2 py-0.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold border-b border-white/5">{t('Файл', 'File')}</div>
                  <button 
                    onClick={() => { setActiveMode(SingularityMode.CASES_AND_SOLUTIONS); closeAllDropdowns(); }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 flex items-center gap-2 ${activeMode === SingularityMode.CASES_AND_SOLUTIONS ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-300'}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t('Решенные проблемы', 'Solved Problems')}</span>
                  </button>
                  <button 
                    onClick={() => { setActiveMode(SingularityMode.THEORY); closeAllDropdowns(); }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 flex items-center gap-2 ${activeMode === SingularityMode.THEORY ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-300'}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t('Математическая теория', 'Theory')}</span>
                  </button>
                  <button 
                    onClick={() => { handleCopyShareLink(); closeAllDropdowns(); }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 text-slate-300 flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t('Поделиться ссылкой', 'Copy Share Link')}</span>
                  </button>
                </div>

                {/* Singularities */}
                <div className="space-y-1">
                  <div className="px-2 py-0.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold border-b border-white/5">{t('Сингулярности', 'Singularities')}</div>
                  {[
                    { mode: SingularityMode.GRAVITATIONAL, label: 'Гравитационные сингулярности', icon: Orbit },
                    { mode: SingularityMode.COMPLEX_ANALYSIS, label: 'Комплексный анализ', icon: Sparkles },
                    { mode: SingularityMode.KINEMATIC, label: 'Кинематика манипуляторов', icon: Cpu },
                    { mode: SingularityMode.NAVIER_STOKES, label: 'Навье-Стокс', icon: Droplet },
                    { mode: SingularityMode.RIEMANN, label: 'Дзета Римана', icon: LineChart },
                    { mode: SingularityMode.YANG_MILLS, label: 'Существование Янга-Миллса', icon: Flame },
                    { mode: SingularityMode.P_VS_NP, label: 'P vs NP (Сложность)', icon: Target },
                    { mode: SingularityMode.LLM_GRADIENT, label: 'Градиентный Взрыв в LLM', icon: ShieldCheck },
                    { mode: SingularityMode.CHLADNI, label: 'Фигуры Хладни', icon: Waves },
                    { mode: SingularityMode.MANDELBROT, label: 'Множество Мандельброта', icon: Infinity },
                    { mode: SingularityMode.CDCC, label: 'Континуум-гипотеза (CDCC)', icon: Infinity },
                    { mode: SingularityMode.POINCARE, label: 'Сфера Пуанкаре', icon: Globe },
                    { mode: SingularityMode.HODGE, label: 'Гипотеза Ходжа', icon: Globe },
                    { mode: SingularityMode.BSD, label: 'Гипотеза BSD', icon: LineChart }
                  ].map((item) => (
                    <button 
                      key={item.mode}
                      onClick={() => { setActiveMode(item.mode); closeAllDropdowns(); }}
                      className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 flex items-center gap-2 ${activeMode === item.mode ? 'text-cyan-400 bg-cyan-950/20 font-bold' : 'text-slate-300'}`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      <span>{t(item.label)}</span>
                    </button>
                  ))}
                </div>

                {/* Model Examples */}
                <div className="space-y-1">
                  <div className="px-2 py-0.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold border-b border-white/5">{t('Типовые примеры', 'Model Examples')}</div>
                  {SIMPLE_EXAMPLES.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => { setSelectedStressTest(item.id); setActiveMode(SingularityMode.CASES_AND_SOLUTIONS); closeAllDropdowns(); }}
                      className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 text-slate-300 flex flex-col items-start gap-0.5"
                    >
                      <span className="font-bold text-cyan-400 text-[11px]">{language === 'ru' ? item.name : item.nameEn}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{item.formula}</span>
                    </button>
                  ))}
                </div>

                {/* Help Section */}
                <div className="space-y-1">
                  <div className="px-2 py-0.5 text-[9px] text-slate-500 uppercase tracking-widest font-bold border-b border-white/5">{t('Справка / Помощь', 'Help / About')}</div>
                  <button 
                    onClick={() => { setShowAboutModal(true); closeAllDropdowns(); }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 text-slate-300 flex items-center gap-2"
                  >
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('О проекте', 'About')}</span>
                  </button>
                  <button 
                    onClick={() => { setShowAuthorModal(true); closeAllDropdowns(); }}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 text-slate-300 flex items-center gap-2"
                  >
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('Об авторе', 'About Author')}</span>
                  </button>
                  <button 
                    onClick={() => { setActiveMode(SingularityMode.RICIS_AGENT); closeAllDropdowns(); }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 flex items-center gap-2 ${activeMode === SingularityMode.RICIS_AGENT ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-300'}`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('ИИ сервис', 'AI Service')}</span>
                  </button>
                  <button 
                    onClick={() => { setActiveMode(SingularityMode.THEORY); closeAllDropdowns(); }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 flex items-center gap-2 ${activeMode === SingularityMode.THEORY ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-300'}`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('Описание концепта', 'Concept Description')}</span>
                  </button>
                  <button 
                    onClick={() => { setActiveMode(SingularityMode.CASES_AND_SOLUTIONS); closeAllDropdowns(); }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-white/5 flex items-center gap-2 ${activeMode === SingularityMode.CASES_AND_SOLUTIONS ? 'text-cyan-400 bg-cyan-950/20' : 'text-slate-300'}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('Примеры простых сингулярностей', 'Simple Singularities Examples')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Mode Screen Rendering with State-Preservation */}
        <main className="mb-12">
          <div className={activeMode === SingularityMode.GRAVITATIONAL ? "" : "hidden"}>
            <GravitationalSingularity preset={gravitationalPreset} onChangeState={activeMode === SingularityMode.GRAVITATIONAL ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.COMPLEX_ANALYSIS ? "" : "hidden"}>
            <ComplexSingularity preset={complexPreset} onChangeState={activeMode === SingularityMode.COMPLEX_ANALYSIS ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.KINEMATIC ? "" : "hidden"}>
            <KinematicSingularity preset={kinematicPreset} onChangeState={activeMode === SingularityMode.KINEMATIC ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.NAVIER_STOKES ? "" : "hidden"}>
            <NavierStokesSingularity preset={navierStokesPreset} onChangeState={activeMode === SingularityMode.NAVIER_STOKES ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.RIEMANN ? "" : "hidden"}>
            <RiemannSingularity preset={riemannPreset} onChangeState={activeMode === SingularityMode.RIEMANN ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.YANG_MILLS ? "" : "hidden"}>
            <YangMillsSingularity preset={yangMillsPreset} onChangeState={activeMode === SingularityMode.YANG_MILLS ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.P_VS_NP ? "" : "hidden"}>
            <PVsNPSingularity preset={pVsNPPreset} onChangeState={activeMode === SingularityMode.P_VS_NP ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.LLM_GRADIENT ? "" : "hidden"}>
            <LLMGradientSingularity preset={llmGradientPreset} onChangeState={activeMode === SingularityMode.LLM_GRADIENT ? setActiveState : undefined} isActive={activeMode === SingularityMode.LLM_GRADIENT} />
          </div>
          <div className={activeMode === SingularityMode.HODGE ? "" : "hidden"}>
            <HodgeSingularity preset={hodgePreset} onChangeState={activeMode === SingularityMode.HODGE ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.BSD ? "" : "hidden"}>
            <BSDSingularity preset={bsdPreset} onChangeState={activeMode === SingularityMode.BSD ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.POINCARE ? "" : "hidden"}>
            <PoincareSingularity preset={poincarePreset} onChangeState={activeMode === SingularityMode.POINCARE ? setActiveState : undefined} />
          </div>
          <div className={activeMode === SingularityMode.THEORY ? "" : "hidden"}>
            <RicisTheory />
          </div>
          <div className={activeMode === SingularityMode.CASES_AND_SOLUTIONS ? "" : "hidden"}>
            <CasesAndSolutions 
              onLoadPreset={handleLoadPreset} 
              initialSelectedTestId={selectedStressTest}
              onClearSelectedTest={() => setSelectedStressTest(null)}
            />
          </div>
          <div className={activeMode === SingularityMode.RICIS_AGENT ? "" : "hidden"}>
            <RicisAgent />
          </div>
          <div className={activeMode === SingularityMode.CHLADNI ? "" : "hidden"}>
            <ChladniSingularity preset={chladniPreset} onChangeState={activeMode === SingularityMode.CHLADNI ? setActiveState : undefined} isActive={activeMode === SingularityMode.CHLADNI} />
          </div>
          <div className={activeMode === SingularityMode.MANDELBROT ? "" : "hidden"}>
            <MandelbrotSingularity preset={mandelbrotPreset} onChangeState={activeMode === SingularityMode.MANDELBROT ? setActiveState : undefined} isActive={activeMode === SingularityMode.MANDELBROT} />
          </div>
          <div className={activeMode === SingularityMode.CDCC ? "" : "hidden"}>
            <CDCCSingularity preset={cdccPreset} onChangeState={activeMode === SingularityMode.CDCC ? setActiveState : undefined} />
          </div>
        </main>

        {/* Humble and Clean Scientific Footer */}
        <footer className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-600 font-mono uppercase tracking-wider">
          <div>
            <span>{t('NODES ACTIVE', 'NODES ACTIVE')}: 1,402 | {t('CLUSTER', 'CLUSTER')}: HYPERION-9</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>{t('SECURE ENCLAVE ACTIVE', 'SECURE ENCLAVE ACTIVE')} | {t('ENCRYPTION', 'ENCRYPTION')}: RICIS-RSA-4096</span>
            <span>{t('2026 г.', '2026')}</span>
          </div>
        </footer>

        {/* About Project Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-fade-in">
            <div className="bg-[#09090B] border border-cyan-500/20 max-w-2xl w-full rounded-xl overflow-hidden shadow-2xl relative my-8 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span className="font-mono text-xs text-cyan-400 font-bold tracking-widest uppercase">
                    {t('RICIS III PARADIGM — О ПРОЕКТЕ', 'RICIS III PARADIGM — ABOUT PROJECT')}
                  </span>
                </div>
                <button 
                  onClick={() => setShowAboutModal(false)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition cursor-pointer"
                  title={t('Закрыть', 'Close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed custom-scrollbar">
                
                {/* Visual Identity Hero */}
                <div className="space-y-2 border-b border-white/5 pb-4">
                  <div className="text-white text-lg font-bold tracking-tight">
                    {t('Регуляризованный Инвариант Комплексного Изменения Систем III', 'Regularized Invariant of Complex System Changes III')}
                  </div>
                  <p className="text-xs text-slate-400">
                    {t(
                      'Интерактивный научно-вычислительный комплекс, реализующий математический аппарат теории RICIS III для регуляризации физических, математических и семантических сингулярностей.',
                      'Interactive scientific computing suite implementing the mathematical framework of RICIS III theory to regularize physical, mathematical, and semantic singularities.'
                    )}
                  </p>
                </div>

                {/* Citation */}
                <div className="bg-cyan-950/20 border border-cyan-500/25 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    <BookOpen className="w-4 h-4" />
                    <span>{t('Научная публикация & Идентификатор', 'Scientific Publication & Identifier')}</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {t(
                      'Основные положения парадигмы и методы регуляризации задокументированы в официальном реестре:',
                      'The key paradigm concepts and regularization methods are registered in the official repository:'
                    )}
                  </div>
                  <a 
                    href="https://doi.org/10.5281/zenodo.17872755" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-xs font-mono text-white hover:text-cyan-400 bg-black/60 p-2.5 rounded border border-white/5 transition break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>DOI: 10.5281/zenodo.17872755</span>
                  </a>
                </div>

                {/* Fundamental Logical Foundations */}
                <div className="space-y-4">
                  <div className="font-mono text-xs text-slate-400 uppercase tracking-wider font-bold border-b border-white/5 pb-1">
                    {t('Фундаментальные логические основы (RICIS III)', 'Fundamental Logical Foundations (RICIS III)')}
                  </div>

                  {/* L0 & L1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/40 p-3.5 rounded-lg border border-white/5 space-y-1">
                      <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">L0_ABSOLUTE_CONTINUITY</div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {t(
                          'Никакой уровень рекурсии не допускает разрывов непрерывности или потери идентичности.',
                          'No level of recursion permits discontinuity or identity loss.'
                        )}
                      </p>
                    </div>

                    <div className="bg-zinc-900/40 p-3.5 rounded-lg border border-white/5 space-y-1">
                      <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">L1_IDENTITY</div>
                      <div className="text-xs font-mono text-white">
                        <Latex math="X = X \implies X/X = 1" />
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {t(
                          'Абсолютный онтологический корень. Операции не могут изменять типы без соответствующего морфизма.',
                          'The absolute ontological root. Operations cannot mutate types without explicit morphism.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Safety Protocols */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
                      {t('Протоколы безопасности (Safety Protocols)', 'Safety Protocols')}
                    </div>
                    <div className="space-y-2">
                      <div className="bg-[#09090B] p-3 rounded border border-white/5 text-xs space-y-1">
                        <div className="font-semibold text-white">SP1: No Total Amnesia ({t('Локальность', 'Locality')})</div>
                        <p className="text-slate-400">
                          {t(
                            'При делении 0/0 замена на 1 применяется исключительно к идентичным нуль-факторам.',
                            'When 0/0 occurs, identity applies only to identical zero-factors, keeping the rest active.'
                          )}
                        </p>
                      </div>

                      <div className="bg-[#09090B] p-3 rounded border border-white/5 text-xs space-y-1">
                        <div className="font-semibold text-white">SP2: Clean First ({t('Редукция приоритета', 'Reduction Priority')})</div>
                        <p className="text-slate-400">
                          {t(
                            'Алгебраическое сокращение идентичных членов выполняется строго ДО применения аксиом сингулярности RICIS.',
                            'Algebraic simplification must be performed BEFORE applying RICIS singularity axioms.'
                          )}
                        </p>
                      </div>

                      <div className="bg-[#09090B] p-3 rounded border border-white/5 text-xs space-y-1">
                        <div className="font-semibold text-white">SP3: Weight of Zero ({t('Индексы сингулярности', 'Index Law')})</div>
                        <p className="text-slate-400">
                          <Latex math="0_F / 0_G = F / G" />. {t('Запрещено трактовать индексированные нули как обычные скалярные нули.', 'Indexed zeros must not be treated as generic scalar zeros.')}
                        </p>
                      </div>

                      <div className="bg-[#09090B] p-3 rounded border border-white/5 text-xs space-y-1">
                        <div className="font-semibold text-white">SP4: Semantic Priority ({t('Индексирование по выражению', 'Index by Expression')})</div>
                        <p className="text-slate-400">
                          {t(
                            'Индексация сингулярностей происходит по исходной форме выражения, а не по его конечному вычисленному значению. Это гарантирует сходимость всех вычислительных путей.',
                            'Singularities are indexed by their expression structure, not by their numerical evaluation value. This guarantees path invariance.'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Axioms of Indeterminate Forms */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
                      {t('Ключевые аксиомы неопределенностей', 'Key Indeterminate Axioms')}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-zinc-950 p-2.5 rounded border border-white/5 text-center flex flex-col justify-center">
                        <span className="text-slate-500 text-[10px]">A1_INDEXING</span>
                        <div className="text-cyan-300 mt-1"><Latex math="F / 0 \to \infty_F" /></div>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded border border-white/5 text-center flex flex-col justify-center">
                        <span className="text-slate-500 text-[10px]">A4_0DIV0</span>
                        <div className="text-cyan-300 mt-1"><Latex math="0_F / 0_G = F/G" /></div>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded border border-white/5 text-center flex flex-col justify-center">
                        <span className="text-slate-500 text-[10px]">A5_INFDIVINF</span>
                        <div className="text-cyan-300 mt-1"><Latex math="\infty_F / \infty_G = F/G" /></div>
                      </div>
                      <div className="bg-zinc-950 p-2.5 rounded border border-white/5 text-center flex flex-col justify-center">
                        <span className="text-slate-500 text-[10px]">A6_GENERAL</span>
                        <div className="text-cyan-300 mt-1"><Latex math="0_F \times \infty_G = F \cdot G" /></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary / Mission */}
                <div className="text-xs text-slate-500 border-t border-white/5 pt-4">
                  {t(
                    'Данный программный комплекс служит практическим подтверждением логической полноты парадигмы RICIS III, демонстрируя визуальные, кинематические и алгебраические решения там, где классические теории терпят разрыв.',
                    'This software suite serves as a practical validation of the logical completeness of the RICIS III paradigm, demonstrating visual, kinematic, and algebraic solutions where classical theories experience breakdown.'
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end bg-zinc-950 gap-2">
                <button 
                  onClick={() => setShowAboutModal(false)}
                  className="px-4 py-2 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold tracking-wider rounded uppercase transition cursor-pointer"
                >
                  {t('Понятно', 'Understood')}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* About Author Modal */}
        {showAuthorModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-fade-in">
            <div className="bg-[#09090B] border border-cyan-500/20 max-w-xl w-full rounded-xl overflow-hidden shadow-2xl relative my-8 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <span className="font-mono text-xs text-cyan-400 font-bold tracking-widest uppercase">
                    {t('RICIS III PARADIGM — ОБ АВТОРЕ', 'RICIS III PARADIGM — ABOUT AUTHOR')}
                  </span>
                </div>
                <button 
                  onClick={() => setShowAuthorModal(false)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded transition cursor-pointer"
                  title={t('Закрыть', 'Close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed custom-scrollbar">
                
                {/* Author Info */}
                <div className="border-b border-white/5 pb-4 space-y-2">
                  <div className="text-white text-lg font-bold tracking-tight">
                    {t('Алейников Дмитрий Владимирович', 'Aleynikov Dmitry Vladimirovich')}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{t('г. Минск, Республика Беларусь', 'Minsk, Republic of Belarus')}</span>
                  </div>
                </div>

                {/* Focus / Specialization */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    {t('Специализация и научные интересы', 'Specialization & Scientific Interests')}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {t(
                      'Абсолютно непрерывная логика, регуляризация гравитационных и квантовых особенностей, решение неопределенностей без классических предельных переходов. Разработчик и исследователь теоретического концепта RICIS III (Regularized Indeterminate Forms and Singularities).',
                      'Absolutely continuous logic, regularization of gravitational and quantum singularities, resolution of uncertainties without classical limit transitions. Developer and researcher of the RICIS III (Regularized Indeterminate Forms and Singularities) theoretical concept.'
                    )}
                  </p>
                </div>

                {/* Publications */}
                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">
                    {t('Научные публикации & Ресурсы', 'Scientific Publications & Resources')}
                  </div>
                  
                  <div className="space-y-2 font-mono text-xs">
                    <a 
                      href="https://doi.org/10.5281/zenodo.21309650" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-zinc-900/60 border border-white/5 rounded hover:border-cyan-500/30 text-slate-300 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">DOI: 10.5281/zenodo.21309650</div>
                        <div className="text-[10px] text-slate-500">RICIS III Core Theory</div>
                      </div>
                    </a>

                    <a 
                      href="https://doi.org/10.5281/zenodo.18116204" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-zinc-900/60 border border-white/5 rounded hover:border-cyan-500/30 text-slate-300 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">DOI: 10.5281/zenodo.18116204</div>
                        <div className="text-[10px] text-slate-500">RICIS Analytical Work</div>
                      </div>
                    </a>

                    <a 
                      href="https://zenodo.org/records/17872755" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-zinc-900/60 border border-white/5 rounded hover:border-cyan-500/30 text-slate-300 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Zenodo: records/17872755</div>
                        <div className="text-[10px] text-slate-500">RICIS Paradigm Registry</div>
                      </div>
                    </a>

                    <a 
                      href="https://dzen.ru/a/aJYMMYwpLDzBCcQN" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-zinc-900/60 border border-white/5 rounded hover:border-cyan-500/30 text-slate-300 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">{t('Статья на Дзен', 'Dzen Article')}</div>
                        <div className="text-[10px] text-slate-500">Popular Science Overview</div>
                      </div>
                    </a>

                    <a 
                      href="https://www.linkedin.com/in/dmitry-aleinikov" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-zinc-900/60 border border-white/5 rounded hover:border-cyan-500/30 text-slate-300 hover:text-white transition"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">LinkedIn: Dmitry Aleinikov</div>
                        <div className="text-[10px] text-slate-500">Professional Profile</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Contact Email */}
                <div className="bg-cyan-950/20 border border-cyan-500/25 rounded-lg p-4 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono text-slate-400">{t('Электронная почта для связи:', 'Contact Email:')}</div>
                    <a href="mailto:dima.aley@gmail.com" className="text-sm font-mono text-white hover:text-cyan-400 transition font-bold">
                      dima.aley@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end bg-zinc-950 gap-2">
                <button 
                  onClick={() => setShowAuthorModal(false)}
                  className="px-4 py-2 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold tracking-wider rounded uppercase transition cursor-pointer"
                >
                  {t('Закрыть', 'Close')}
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
