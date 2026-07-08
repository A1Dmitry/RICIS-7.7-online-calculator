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
import { Orbit, Sparkles, Cpu, BookOpen, Infinity, ShieldCheck, Droplet, LineChart, Flame, Target, Globe, MessageSquare, Waves, MoreHorizontal, ChevronDown } from 'lucide-react';

const MODE_METADATA: Record<SingularityMode, { label: string, icon: React.ComponentType<any>, colorClass?: string }> = {
  [SingularityMode.GRAVITATIONAL]: { label: 'Гравитационные сингулярности', icon: Orbit, colorClass: 'text-cyan-400' },
  [SingularityMode.COMPLEX_ANALYSIS]: { label: 'Комплексный анализ (Полюса)', icon: Sparkles, colorClass: 'text-cyan-400' },
  [SingularityMode.KINEMATIC]: { label: 'Кинематика манипуляторов', icon: Cpu, colorClass: 'text-cyan-400' },
  [SingularityMode.NAVIER_STOKES]: { label: 'Уравнения Навье-Стокса', icon: Droplet, colorClass: 'text-cyan-400' },
  [SingularityMode.RIEMANN]: { label: 'Дзета Римана (Полюс s=1)', icon: LineChart, colorClass: 'text-cyan-400' },
  [SingularityMode.YANG_MILLS]: { label: 'Существование Янга-Миллса', icon: Flame, colorClass: 'text-purple-400' },
  [SingularityMode.P_VS_NP]: { label: 'P vs NP (Сложность)', icon: Target, colorClass: 'text-cyan-400' },
  [SingularityMode.HODGE]: { label: 'Гипотеза Ходжа', icon: Globe, colorClass: 'text-cyan-400' },
  [SingularityMode.BSD]: { label: 'Гипотеза BSD', icon: LineChart, colorClass: 'text-cyan-400' },
  [SingularityMode.POINCARE]: { label: 'Сфера Пуанкаре', icon: Globe, colorClass: 'text-cyan-400' },
  [SingularityMode.THEORY]: { label: 'Математическое обоснование', icon: BookOpen, colorClass: 'text-cyan-400' },
  [SingularityMode.CASES_AND_SOLUTIONS]: { label: 'Решенные проблемы (RICIS)', icon: ShieldCheck, colorClass: 'text-cyan-400' },
  [SingularityMode.CHLADNI]: { label: 'Фигуры Хладни', icon: Waves, colorClass: 'text-amber-400' },
  [SingularityMode.RICIS_AGENT]: { label: 'ИИ Ассистент RICIS', icon: MessageSquare, colorClass: 'text-cyan-400' }
};

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [activeMode, setActiveMode] = useState<SingularityMode>(SingularityMode.CASES_AND_SOLUTIONS);

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

  // Dynamic navigation optimization: track section visit counts
  const [visits, setVisits] = useState<Record<SingularityMode, number>>(() => {
    try {
      const stored = localStorage.getItem('ricis_tab_visits');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    const initial: Record<string, number> = {};
    Object.values(SingularityMode).forEach(mode => {
      initial[mode] = 0;
    });
    return initial as Record<SingularityMode, number>;
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  }, [activeMode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
        
        {/* Main Header styled to match Elegant Dark layout */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10 pb-6 bg-black/20 p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold bg-cyan-950/20 text-lg font-display shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              R3
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-widest text-white uppercase font-display">
                  RICIS III PARADIGM
                </h1>
                <span className="text-[9px] uppercase tracking-wider font-semibold font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                  v3.0.4-Alpha
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {t('Интерактивный вычислительный комплекс для решения и регуляризации гравитационных, комплексных и кинематических сингулярностей.')}
              </p>
            </div>
          </div>

          {/* Telemetry metrics from the design mockup */}
          <div className="flex flex-wrap gap-6 text-[10px] font-mono bg-black/40 border border-white/5 p-3 rounded-lg md:self-stretch items-center">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 text-[9px] tracking-wider">{t('SYSTEM STATUS')}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('STABLE / CORE OK')}
              </span>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 text-[9px] tracking-wider">{t('ENTROPY BIAS')}</span>
              <span className="text-white font-semibold">0.000214%</span>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 text-[9px] tracking-wider">{t('UPTIME HOURS')}</span>
              <span className="text-white font-semibold">128:44:02</span>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 text-[9px] tracking-wider">{t('LANGUAGE / ЯЗЫК', 'LANGUAGE')}</span>
              <div className="flex gap-1.5 mt-0.5">
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider transition ${
                    language === 'ru'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-300'
                  }`}
                >
                  RU
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider transition ${
                    language === 'en'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-transparent text-slate-500 border border-transparent hover:text-slate-300'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-4 items-center">
          {visibleModes.map((mode) => {
            const meta = MODE_METADATA[mode];
            const IconComp = meta.icon;
            const isActive = activeMode === mode;
            const weightPercent = totalVisits > 0 ? Math.round(((visits[mode] || 0) / totalVisits) * 100) : 0;

            let activeStyles = 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]';
            let iconColor = isActive ? 'text-cyan-400' : 'text-gray-400';
            
            if (mode === SingularityMode.YANG_MILLS) {
              activeStyles = 'bg-purple-950/20 border-purple-500/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]';
              iconColor = isActive ? 'text-purple-400' : 'text-gray-400';
            } else if (mode === SingularityMode.CHLADNI) {
              activeStyles = 'bg-amber-950/20 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.15)]';
              iconColor = isActive ? 'text-amber-400 animate-pulse' : 'text-gray-400';
            }

            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 cursor-pointer ${
                  isActive ? activeStyles : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <IconComp className={`w-4 h-4 ${iconColor}`} />
                <span className="flex items-center gap-1.5">
                  <span>{t(meta.label)}</span>
                  {mode === SingularityMode.RICIS_AGENT && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                  {weightPercent > 0 && (
                    <span className="text-[9px] font-mono opacity-60 bg-black/40 px-1 rounded text-cyan-300">
                      {weightPercent}%
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {/* Dropdown Menu for Hidden Tabs */}
          {hiddenModes.length > 0 && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 cursor-pointer ${
                  dropdownOpen
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={t("Показать скрытые разделы", "Show hidden sections")}
              >
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                <span>{t("Еще", "More")} ({hiddenModes.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-cyan-400' : 'text-slate-500'}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#09090b]/95 border border-white/10 rounded-lg shadow-[0_4px_25px_rgba(0,0,0,0.6)] z-50 overflow-hidden backdrop-blur-md">
                  <div className="p-1.5 max-h-[350px] overflow-y-auto custom-scrollbar space-y-0.5">
                    <div className="px-2.5 py-1 text-[9px] font-mono text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1 flex justify-between">
                      <span>{t("Раздел", "Section")}</span>
                      <span>{t("Вес", "Weight")}</span>
                    </div>
                    {hiddenModes.map((mode) => {
                      const meta = MODE_METADATA[mode];
                      const IconComp = meta.icon;
                      const modeWeight = totalVisits > 0 ? Math.round(((visits[mode] || 0) / totalVisits) * 100) : 0;
                      return (
                        <button
                          key={mode}
                          onClick={() => {
                            setActiveMode(mode);
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left text-slate-400 hover:text-white hover:bg-white/5 transition font-medium cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <IconComp className={`w-3.5 h-3.5 shrink-0 ${meta.colorClass || 'text-slate-400'}`} />
                            <span className="truncate">{t(meta.label)}</span>
                          </div>
                          <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded ml-2 shrink-0">
                            {modeWeight}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Mode Screen Rendering */}
        <main className="mb-12">
          {activeMode === SingularityMode.GRAVITATIONAL && <GravitationalSingularity preset={gravitationalPreset} />}
          {activeMode === SingularityMode.COMPLEX_ANALYSIS && <ComplexSingularity preset={complexPreset} />}
          {activeMode === SingularityMode.KINEMATIC && <KinematicSingularity preset={kinematicPreset} />}
          {activeMode === SingularityMode.NAVIER_STOKES && <NavierStokesSingularity preset={navierStokesPreset} />}
          {activeMode === SingularityMode.RIEMANN && <RiemannSingularity preset={riemannPreset} />}
          {activeMode === SingularityMode.YANG_MILLS && <YangMillsSingularity preset={yangMillsPreset} />}
          {activeMode === SingularityMode.P_VS_NP && <PVsNPSingularity preset={pVsNPPreset} />}
          {activeMode === SingularityMode.HODGE && <HodgeSingularity preset={hodgePreset} />}
          {activeMode === SingularityMode.BSD && <BSDSingularity preset={bsdPreset} />}
          {activeMode === SingularityMode.POINCARE && <PoincareSingularity preset={poincarePreset} />}
          {activeMode === SingularityMode.THEORY && <RicisTheory />}
          {activeMode === SingularityMode.CASES_AND_SOLUTIONS && <CasesAndSolutions onLoadPreset={handleLoadPreset} />}
          {activeMode === SingularityMode.RICIS_AGENT && <RicisAgent />}
          {activeMode === SingularityMode.CHLADNI && <ChladniSingularity preset={chladniPreset} />}
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
      </div>
    </div>
  );
}
