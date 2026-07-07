/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SingularityMode } from './types';
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
import { Orbit, Sparkles, Cpu, BookOpen, Infinity, ShieldCheck, Droplet, LineChart, Flame, Target, Globe, MessageSquare } from 'lucide-react';

export default function App() {
  const [activeMode, setActiveMode] = useState<SingularityMode>(SingularityMode.GRAVITATIONAL);

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
    }
    setActiveMode(mode);
  };

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
                Интерактивный вычислительный комплекс для решения и регуляризации гравитационных, комплексных и кинематических сингулярностей.
              </p>
            </div>
          </div>

          {/* Telemetry metrics from the design mockup */}
          <div className="flex flex-wrap gap-6 text-[10px] font-mono bg-black/40 border border-white/5 p-3 rounded-lg md:self-stretch items-center">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 text-[9px] tracking-wider">SYSTEM STATUS</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                STABLE / CORE OK
              </span>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 text-[9px] tracking-wider">ENTROPY BIAS</span>
              <span className="text-white font-semibold">0.000214%</span>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block" />
            <div className="flex flex-col items-start md:items-end">
              <span className="text-slate-500 text-[9px] tracking-wider">UPTIME HOURS</span>
              <span className="text-white font-semibold">128:44:02</span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-4">
          <button
            onClick={() => setActiveMode(SingularityMode.GRAVITATIONAL)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.GRAVITATIONAL
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Orbit className={`w-4 h-4 ${activeMode === SingularityMode.GRAVITATIONAL ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Гравитационные сингулярности</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.COMPLEX_ANALYSIS)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.COMPLEX_ANALYSIS
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeMode === SingularityMode.COMPLEX_ANALYSIS ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Комплексный анализ (Полюса)</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.KINEMATIC)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.KINEMATIC
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className={`w-4 h-4 ${activeMode === SingularityMode.KINEMATIC ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Кинематика манипуляторов</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.NAVIER_STOKES)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.NAVIER_STOKES
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Droplet className={`w-4 h-4 ${activeMode === SingularityMode.NAVIER_STOKES ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Уравнения Навье-Стокса</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.RIEMANN)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.RIEMANN
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LineChart className={`w-4 h-4 ${activeMode === SingularityMode.RIEMANN ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Дзета Римана (Полюс s=1)</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.YANG_MILLS)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.YANG_MILLS
                ? 'bg-purple-950/20 border-purple-500/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeMode === SingularityMode.YANG_MILLS ? 'text-purple-400' : 'text-gray-400'}`} />
            <span>Существование Янга-Миллса</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.P_VS_NP)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.P_VS_NP
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Target className={`w-4 h-4 ${activeMode === SingularityMode.P_VS_NP ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>P vs NP (Сложность)</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.HODGE)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.HODGE
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className={`w-4 h-4 ${activeMode === SingularityMode.HODGE ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Гипотеза Ходжа</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.BSD)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.BSD
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LineChart className={`w-4 h-4 ${activeMode === SingularityMode.BSD ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Гипотеза BSD</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.POINCARE)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.POINCARE
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className={`w-4 h-4 ${activeMode === SingularityMode.POINCARE ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Сфера Пуанкаре</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.THEORY)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.THEORY
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeMode === SingularityMode.THEORY ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Математическое обоснование</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.CASES_AND_SOLUTIONS)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.CASES_AND_SOLUTIONS
                ? 'bg-cyan-950/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeMode === SingularityMode.CASES_AND_SOLUTIONS ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span>Решенные проблемы (RICIS)</span>
          </button>

          <button
            onClick={() => setActiveMode(SingularityMode.RICIS_AGENT)}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-medium tracking-wide uppercase border transition duration-200 ${
              activeMode === SingularityMode.RICIS_AGENT
                ? 'bg-cyan-950/20 border-cyan-400/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                : 'bg-black/20 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className={`w-4 h-4 ${activeMode === SingularityMode.RICIS_AGENT ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span className="flex items-center gap-1.5">
              <span>ИИ Ассистент RICIS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </span>
          </button>
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
        </main>

        {/* Humble and Clean Scientific Footer */}
        <footer className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-600 font-mono uppercase tracking-wider">
          <div>
            <span>NODES ACTIVE: 1,402 | CLUSTER: HYPERION-9</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>SECURE ENCLAVE ACTIVE | ENCRYPTION: RICIS-RSA-4096</span>
            <span>2026 г.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
