/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SingularityMode } from '../types';
import { VisitStatsData, fetchGlobalVisitStats, resetVisitStats } from '../utils/visitTracker';
import { useLanguage } from '../lib/i18n';
import GeoReportPanel from './GeoReportPanel';
import SeoAndIndexingPanel from './SeoAndIndexingPanel';
import { 
  Users, Eye, BarChart3, TrendingUp, X, Search, ArrowUpDown, 
  Download, RefreshCw, ShieldCheck, Orbit, Sparkles, Cpu, 
  Droplet, LineChart, Flame, Target, Globe, Infinity, Waves,
  Check, ExternalLink, GraduationCap, Network, Zap
} from 'lucide-react';

interface VisitStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  statsData: VisitStatsData;
  onSelectMode: (mode: SingularityMode) => void;
  onStatsUpdated: (newStats: VisitStatsData) => void;
  initialTab?: 'applets' | 'geo_report' | 'seo_indexing';
}

const APPLET_ICONS: Record<SingularityMode, any> = {
  [SingularityMode.CASES_AND_SOLUTIONS]: ShieldCheck,
  [SingularityMode.THEORY]: LineChart,
  [SingularityMode.RICIS_AGENT]: Sparkles,
  [SingularityMode.GRAVITATIONAL]: Orbit,
  [SingularityMode.COMPLEX_ANALYSIS]: Sparkles,
  [SingularityMode.KINEMATIC]: Cpu,
  [SingularityMode.NAVIER_STOKES]: Droplet,
  [SingularityMode.RIEMANN]: LineChart,
  [SingularityMode.YANG_MILLS]: Flame,
  [SingularityMode.P_VS_NP]: Target,
  [SingularityMode.LLM_GRADIENT]: ShieldCheck,
  [SingularityMode.CHLADNI]: Waves,
  [SingularityMode.MANDELBROT]: Infinity,
  [SingularityMode.CDCC]: Infinity,
  [SingularityMode.POINCARE]: Globe,
  [SingularityMode.HODGE]: Globe,
  [SingularityMode.BSD]: LineChart,
};

const APPLET_LABELS: Record<SingularityMode, { ru: string; en: string }> = {
  [SingularityMode.CASES_AND_SOLUTIONS]: { ru: 'Решенные проблемы и решения', en: 'Solved Problems & Solutions' },
  [SingularityMode.THEORY]: { ru: 'Математическая теория RICIS III', en: 'RICIS III Mathematical Theory' },
  [SingularityMode.RICIS_AGENT]: { ru: 'Интеллектуальный Агент RICIS', en: 'RICIS AI Agent Assistant' },
  [SingularityMode.GRAVITATIONAL]: { ru: 'Гравитационные сингулярности', en: 'Gravitational Singularities' },
  [SingularityMode.COMPLEX_ANALYSIS]: { ru: 'Комплексный анализ (Полюса)', en: 'Complex Analysis (Poles)' },
  [SingularityMode.KINEMATIC]: { ru: 'Кинематика манипуляторов', en: 'Manipulator Kinematics' },
  [SingularityMode.NAVIER_STOKES]: { ru: 'Уравнения Навье-Стокса', en: 'Navier-Stokes Equations' },
  [SingularityMode.RIEMANN]: { ru: 'Дзета Римана (Полюс s=1)', en: 'Riemann Zeta (Pole s=1)' },
  [SingularityMode.YANG_MILLS]: { ru: 'Существование Янга-Миллса', en: 'Yang-Mills Existence' },
  [SingularityMode.P_VS_NP]: { ru: 'P vs NP (Сложность)', en: 'P vs NP (Complexity)' },
  [SingularityMode.LLM_GRADIENT]: { ru: 'Градиентный Взрыв в LLM', en: 'LLM Gradient Explosion' },
  [SingularityMode.CHLADNI]: { ru: 'Фигуры Хладни', en: 'Chladni Figures' },
  [SingularityMode.MANDELBROT]: { ru: 'Множество Мандельброта', en: 'Mandelbrot Set' },
  [SingularityMode.CDCC]: { ru: 'Континуум-гипотеза (CDCC)', en: 'Continuum Hypothesis (CDCC)' },
  [SingularityMode.POINCARE]: { ru: 'Сфера Пуанкаре', en: 'Poincaré Sphere' },
  [SingularityMode.HODGE]: { ru: 'Гипотеза Ходжа', en: 'Hodge Conjecture' },
  [SingularityMode.BSD]: { ru: 'Гипотеза BSD', en: 'BSD Conjecture' },
};

export const VisitStatsModal: React.FC<VisitStatsModalProps> = ({
  isOpen,
  onClose,
  statsData,
  onSelectMode,
  onStatsUpdated,
  initialTab = 'applets'
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'applets' | 'geo_report' | 'seo_indexing'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'unique' | 'name'>('total');
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncStats = async () => {
    setIsSyncing(true);
    try {
      const fresh = await fetchGlobalVisitStats();
      onStatsUpdated(fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  const modesList = Object.values(SingularityMode);

  // Compute top applet
  let topMode = modesList[0];
  let maxVisits = 0;
  modesList.forEach(m => {
    const total = statsData.appletStats[m]?.total || 0;
    if (total > maxVisits) {
      maxVisits = total;
      topMode = m;
    }
  });

  const filteredModes = modesList.filter(mode => {
    const labelObj = APPLET_LABELS[mode];
    const name = language === 'ru' ? labelObj.ru : labelObj.en;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  filteredModes.sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = language === 'ru' ? APPLET_LABELS[a].ru : APPLET_LABELS[a].en;
      const nameB = language === 'ru' ? APPLET_LABELS[b].ru : APPLET_LABELS[b].en;
      return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    } else if (sortBy === 'unique') {
      const uA = statsData.appletStats[a]?.unique || 0;
      const uB = statsData.appletStats[b]?.unique || 0;
      return sortAsc ? uA - uB : uB - uA;
    } else {
      const tA = statsData.appletStats[a]?.total || 0;
      const tB = statsData.appletStats[b]?.total || 0;
      return sortAsc ? tA - tB : tB - tA;
    }
  });

  const handleExportCSV = () => {
    const headers = 'Applet ID,Applet Name,Total Visits,Unique Visitors,Traffic Share %\n';
    const rows = modesList.map(m => {
      const name = (language === 'ru' ? APPLET_LABELS[m].ru : APPLET_LABELS[m].en).replace(/,/g, ' ');
      const total = statsData.appletStats[m]?.total || 0;
      const unique = statsData.appletStats[m]?.unique || 0;
      const share = statsData.totalGlobalVisits > 0 ? ((total / statsData.totalGlobalVisits) * 100).toFixed(1) : '0';
      return `${m},"${name}",${total},${unique},${share}%`;
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `RICIS_Visits_Analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm(language === 'ru' 
      ? 'Вы уверены, что хотите сбросить пользовательские счетчики посещений?' 
      : 'Are you sure you want to reset user visit counters?')) {
      const fresh = resetVisitStats();
      onStatsUpdated(fresh);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#0f1117] border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.15)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-display">
                {language === 'ru' ? 'Аналитика и Гео-Отчет Посещений' : 'Visit & Geo Analytics'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'ru' 
                  ? 'Мониторинг заходов по модулям, IP, регионам и научным заведениям' 
                  : 'Monitoring visits by applets, IP addresses, regions, and research institutions'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('applets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'applets' 
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'ru' ? 'Апплеты' : 'Applets'}</span>
            </button>

            <button
              onClick={() => setActiveTab('geo_report')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'geo_report' 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{language === 'ru' ? 'Отчет IP & ВУЗы' : 'IP & Geo Report'}</span>
            </button>

            <button
              onClick={() => setActiveTab('seo_indexing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'seo_indexing' 
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ru' ? 'SEO & IndexNow' : 'SEO & Indexing'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer absolute sm:static top-4 right-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {activeTab === 'seo_indexing' ? (
            <SeoAndIndexingPanel />
          ) : activeTab === 'geo_report' ? (
            <GeoReportPanel />
          ) : (
            <>
              {/* Top Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1: Total Visits */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">
                  {language === 'ru' ? 'Всего Посещений' : 'Total Visits'}
                </span>
                <Eye className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {statsData.totalGlobalVisits.toLocaleString()}
              </div>
              <div className="mt-2 text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{language === 'ru' ? 'Суммарные переходы' : 'Cumulative visits'}</span>
              </div>
            </div>

            {/* Metric 2: Unique Visitors */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">
                  {language === 'ru' ? 'Уникальных Визитов' : 'Unique Visitors'}
                </span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                {statsData.uniqueGlobalVisits.toLocaleString()}
              </div>
              <div className="mt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span>
                  {statsData.totalGlobalVisits > 0 
                    ? `~${((statsData.uniqueGlobalVisits / statsData.totalGlobalVisits) * 100).toFixed(1)}% ${language === 'ru' ? 'уникальная доля' : 'unique ratio'}` 
                    : '100%'}
                </span>
              </div>
            </div>

            {/* Metric 3: Active Modules */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">
                  {language === 'ru' ? 'Модулей / Апплетов' : 'Active Applets'}
                </span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-300 font-mono tracking-tight">
                {modesList.length}
              </div>
              <div className="mt-2 text-[10px] text-purple-400 font-mono">
                {language === 'ru' ? 'Интерактивных сингулярностей' : 'Interactive modules'}
              </div>
            </div>

            {/* Metric 4: Top Applet */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-mono font-medium uppercase tracking-wider">
                  {language === 'ru' ? 'Лидер Просмотров' : 'Most Popular'}
                </span>
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-bold text-amber-300 font-mono truncate">
                {language === 'ru' ? APPLET_LABELS[topMode].ru : APPLET_LABELS[topMode].en}
              </div>
              <div className="mt-2 text-[10px] text-amber-400 font-mono flex items-center justify-between">
                <span>{maxVisits} {language === 'ru' ? 'визитов' : 'visits'}</span>
                <span>{((maxVisits / (statsData.totalGlobalVisits || 1)) * 100).toFixed(1)}%</span>
              </div>
            </div>

          </div>

          {/* Search and Table Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ru' ? 'Поиск по апплетам...' : 'Filter applets...'}
                className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 font-mono">{language === 'ru' ? 'Сортировка:' : 'Sort by:'}</span>
              <button
                onClick={() => {
                  if (sortBy === 'total') setSortAsc(!sortAsc);
                  else { setSortBy('total'); setSortAsc(false); }
                }}
                className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1 border transition ${sortBy === 'total' ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'}`}
              >
                <span>{language === 'ru' ? 'Всего' : 'Total'}</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>

              <button
                onClick={() => {
                  if (sortBy === 'unique') setSortAsc(!sortAsc);
                  else { setSortBy('unique'); setSortAsc(false); }
                }}
                className={`px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1 border transition ${sortBy === 'unique' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'}`}
              >
                <span>{language === 'ru' ? 'Уникальные' : 'Unique'}</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>

              <button
                onClick={handleSyncStats}
                disabled={isSyncing}
                title={language === 'ru' ? 'Обновить данные из глобальной БД' : 'Refresh live data from server DB'}
                className="px-2.5 py-1.5 rounded text-xs font-mono flex items-center gap-1.5 border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/80 transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{language === 'ru' ? 'Обновить' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Detailed Applets Breakdown List */}
          <div className="border border-white/10 rounded-xl bg-black/30 overflow-hidden divide-y divide-white/5">
            {filteredModes.map((mode) => {
              const Icon = APPLET_ICONS[mode] || BarChart3;
              const labelObj = APPLET_LABELS[mode];
              const name = language === 'ru' ? labelObj.ru : labelObj.en;
              const stat = statsData.appletStats[mode] || { total: 0, unique: 0 };
              const sharePercent = statsData.totalGlobalVisits > 0 
                ? ((stat.total / statsData.totalGlobalVisits) * 100) 
                : 0;

              return (
                <div key={mode} className="p-3.5 hover:bg-white/[0.03] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Icon & Title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-cyan-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                        <span>{name}</span>
                      </div>
                      
                      {/* Visual progress bar */}
                      <div className="flex items-center gap-2 mt-1.5 w-full max-w-md">
                        <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(2, sharePercent * 2.5))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {sharePercent.toFixed(1)}% {language === 'ru' ? 'трафика' : 'share'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Visits breakdown numbers & Navigate button */}
                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[9px] text-slate-500 uppercase">{language === 'ru' ? 'Всего' : 'Total'}</span>
                        <span className="text-cyan-300 font-bold">{stat.total.toLocaleString()}</span>
                      </div>
                      <div className="w-px h-6 bg-white/10" />
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[9px] text-slate-500 uppercase">{language === 'ru' ? 'Уникальных' : 'Unique'}</span>
                        <span className="text-emerald-400 font-bold">{stat.unique.toLocaleString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectMode(mode);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>{language === 'ru' ? 'Открыть' : 'Open'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              );
            })}

            {filteredModes.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                {language === 'ru' ? 'Модулей не найдено по данному запросу.' : 'No applets found matching filter.'}
              </div>
            )}
          </div>
          </>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedCSV ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{language === 'ru' ? 'Экспортировано!' : 'Exported!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{language === 'ru' ? 'Экспорт в CSV' : 'Export to CSV'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-500/20 text-red-400 hover:text-red-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
              title={language === 'ru' ? 'Сбросить локальные счетчики' : 'Reset local counters'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'Сброс' : 'Reset'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition cursor-pointer"
          >
            {language === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default VisitStatsModal;
