/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GeoVisitorRecord, 
  fetchCurrentClientGeo, 
  fetchGlobalGeoVisitors,
  recordClientGeoVisit
} from '../utils/ipGeoService';
import { useLanguage } from '../lib/i18n';
import { 
  Globe, GraduationCap, Building2, Eye, Users, Search, 
  Download, Sparkles, ShieldCheck, MapPin, Network, ArrowUpDown, 
  Check, RefreshCw, Cpu, Award, ExternalLink, Database
} from 'lucide-react';

export const GeoReportPanel: React.FC = () => {
  const { language, t } = useLanguage();
  const [currentClient, setCurrentClient] = useState<GeoVisitorRecord | null>(null);
  const [records, setRecords] = useState<GeoVisitorRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [academicOnly, setAcademicOnly] = useState<boolean>(false);
  const [copiedCSV, setCopiedCSV] = useState<boolean>(false);
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default descending (highest visits first)

  const loadLiveData = async () => {
    setRefreshing(true);
    const clientGeo = await fetchCurrentClientGeo();
    const globalData = await fetchGlobalGeoVisitors();
    setCurrentClient(clientGeo);
    setRecords(globalData.records);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    let mounted = true;
    async function init() {
      setLoading(true);
      const clientGeo = await fetchCurrentClientGeo();
      const globalData = await fetchGlobalGeoVisitors();
      if (mounted) {
        setCurrentClient(clientGeo);
        setRecords(globalData.records);
        setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  // Filter records
  const filteredRecords = records.filter(rec => {
    if (academicOnly && !rec.isAcademicOrScientific) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      rec.country.toLowerCase().includes(term) ||
      rec.city.toLowerCase().includes(term) ||
      rec.region.toLowerCase().includes(term) ||
      rec.isp.toLowerCase().includes(term) ||
      rec.ip.includes(term) ||
      (rec.institutionName && rec.institutionName.toLowerCase().includes(term))
    );
  });

  // Sort by total visits (or toggled direction)
  filteredRecords.sort((a, b) => {
    return sortAsc ? a.totalVisits - b.totalVisits : b.totalVisits - a.totalVisits;
  });

  // Aggregated analytics
  const totalVisitsCount = records.reduce((sum, r) => sum + r.totalVisits, 0);
  const totalAcademicVisits = records
    .filter(r => r.isAcademicOrScientific)
    .reduce((sum, r) => sum + r.totalVisits, 0);
  const academicPercent = totalVisitsCount > 0 
    ? ((totalAcademicVisits / totalVisitsCount) * 100).toFixed(1) 
    : '0';

  const academicInstitutionsCount = records.filter(r => r.isAcademicOrScientific).length;

  const handleExportCSV = () => {
    const headers = 'IP Address,Country,Country Code,Region,City,ISP Provider,Is Academic,Institution Name,Institution Type,Total Visits,Unique Visitors,Top Applet,Last Visit\n';
    const rows = filteredRecords.map(r => {
      const instName = (r.institutionName || '').replace(/,/g, ' ');
      const ispName = (r.isp || '').replace(/,/g, ' ');
      return `${r.ip},"${r.country}",${r.countryCode},"${r.region}","${r.city}","${ispName}",${r.isAcademicOrScientific ? 'YES' : 'NO'},"${instName}",${r.institutionType || ''},${r.totalVisits},${r.uniqueVisitors},"${r.topAppletUsed}",${r.lastVisited}`;
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `RICIS_Geo_Academic_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2500);
  };

  const getCountryFlag = (code: string) => {
    if (!code || code === 'XX' || code === 'EU') return '🌐';
    return code
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* Report Header */}
      <div className="bg-[#0f1117] border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.1)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {language === 'ru' ? 'Гео-Телеметрия IP & Институты' : 'IP Geo-Telemetry & Academic Report'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-wide font-display mt-1">
                {language === 'ru' ? 'Отчет по Странам, Провайдерам и Учебным Заведениям' : 'Geographic & Academic Traffic Report'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ru' 
                  ? 'Автоматическое извлечение IP, региона, провайдера и распознавание университетских и научных центров (CERN, MIT, МГУ, РАН и др.), отсортированных по общим заходам.' 
                  : 'Automatic IP, region, ISP extraction with academic & research institution recognition (CERN, MIT, MSU, RAS, etc.), sorted by total visits.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadLiveData}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title={language === 'ru' ? 'Обновить данные из единой серверной базы данных' : 'Refresh live data from server database'}
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{language === 'ru' ? 'Синхронизировать БД' : 'Sync Global DB'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer"
            >
              {copiedCSV ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4 text-cyan-400" />}
              <span>{copiedCSV ? (language === 'ru' ? 'Экспортировано!' : 'Exported!') : (language === 'ru' ? 'Экспорт в CSV' : 'Export CSV')}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          
          <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>{language === 'ru' ? 'Всего Переходов' : 'Total Traffic'}</span>
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono">
              {totalVisitsCount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              {language === 'ru' ? 'Все географические сессии' : 'All geographical sessions'}
            </div>
          </div>

          <div className="bg-black/40 border border-emerald-500/30 rounded-xl p-3.5 bg-gradient-to-br from-emerald-950/20 to-transparent">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>{language === 'ru' ? 'Научные Заведения' : 'Academic Share'}</span>
              <GraduationCap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-300 font-mono">
              {academicPercent}%
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">
              {totalAcademicVisits} {language === 'ru' ? 'заходов из ВУЗов и РАН' : 'visits from research centers'}
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>{language === 'ru' ? 'Университетов & НИИ' : 'Recognized Institutes'}</span>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-300 font-mono">
              {academicInstitutionsCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              {language === 'ru' ? 'Мировых академических сетей' : 'Global research networks'}
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>{language === 'ru' ? 'Сортировка Отчета' : 'Report Sorting'}</span>
              <ArrowUpDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-amber-300 font-mono truncate mt-1">
              {language === 'ru' ? 'По общим заходам (↓)' : 'By Total Visits (↓)'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">
              {language === 'ru' ? 'Соответствует регламенту' : 'Strict protocol compliant'}
            </div>
          </div>

        </div>
      </div>

      {/* Active Client Current IP Identification Banner */}
      <div className="bg-[#121622] border border-cyan-500/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute inset-0 opacity-75" />
            <div className="w-3 h-3 rounded-full bg-emerald-400 relative" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" />
              <span>{language === 'ru' ? 'Ваш текущий IP и Провайдер:' : 'Your Active IP Connection & ISP:'}</span>
            </div>
            
            {loading ? (
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>{language === 'ru' ? 'Запрос гео-данных...' : 'Determining client location...'}</span>
              </div>
            ) : currentClient ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-mono text-white">
                <span className="font-bold text-cyan-300">{currentClient.ip}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300">{getCountryFlag(currentClient.countryCode)} {currentClient.country}, {currentClient.city}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{currentClient.isp}</span>

                {currentClient.isAcademicOrScientific && (
                  <span className="ml-1 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-emerald-400" />
                    <span>{currentClient.institutionName}</span>
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-mono text-slate-400 block">
            {language === 'ru' ? 'Авторизация сессии:' : 'Session Verified:'}
          </span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            RICIS III L1_IDENTITY Active
          </span>
        </div>
      </div>

      {/* Main Report Table & Controls */}
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 space-y-4">
        
        {/* Table Filters Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'ru' ? 'Поиск по IP, стране, ВУЗу...' : 'Search by IP, country, university...'}
              className="w-full pl-9 pr-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setAcademicOnly(!academicOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 border transition cursor-pointer ${academicOnly ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'}`}
            >
              <GraduationCap className={`w-4 h-4 ${academicOnly ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>{language === 'ru' ? 'Только Наука & ВУЗы' : 'Academic Only'}</span>
            </button>

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-3 py-2 rounded-xl bg-black/40 text-slate-300 border border-white/10 hover:border-cyan-500/40 text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>{sortAsc ? (language === 'ru' ? 'Заходы ↑' : 'Visits ↑') : (language === 'ru' ? 'Заходы ↓' : 'Visits ↓')}</span>
            </button>
          </div>

        </div>

        {/* Detailed Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">{language === 'ru' ? 'Страна / Регион' : 'Country / Region'}</th>
                <th className="py-3 px-4">{language === 'ru' ? 'Провайдер / Институт' : 'ISP / Scientific Center'}</th>
                <th className="py-3 px-4 text-center">{language === 'ru' ? 'Тип Заведения' : 'Category'}</th>
                <th className="py-3 px-4 text-right">{language === 'ru' ? 'Общие Заходы' : 'Total Visits'}</th>
                <th className="py-3 px-4 text-right">{language === 'ru' ? 'Уникальные' : 'Unique'}</th>
                <th className="py-3 px-4">{language === 'ru' ? 'Популярный Апплет' : 'Top Applet'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRecords.map((rec, i) => (
                <tr 
                  key={rec.ip + '_' + i}
                  className={`hover:bg-white/[0.04] transition ${rec.isAcademicOrScientific ? 'bg-emerald-950/10' : ''}`}
                >
                  
                  {/* Country & Region */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getCountryFlag(rec.countryCode)}</span>
                      <div>
                        <div className="text-white font-bold">{rec.country}</div>
                        <div className="text-[10px] text-slate-500">{rec.city}, {rec.region}</div>
                      </div>
                    </div>
                  </td>

                  {/* ISP & Academic Institution Name */}
                  <td className="py-3 px-4">
                    {rec.isAcademicOrScientific ? (
                      <div>
                        <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{rec.institutionName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {rec.isp} ({rec.ip})
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-slate-200 font-semibold flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{rec.isp}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{rec.ip}</div>
                      </div>
                    )}
                  </td>

                  {/* Category Badge */}
                  <td className="py-3 px-4 text-center">
                    {rec.isAcademicOrScientific ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        {rec.institutionType || 'Research'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium bg-white/5 text-slate-400 border border-white/10">
                        Commercial
                      </span>
                    )}
                  </td>

                  {/* Total Visits - HIGHLIGHTED & SORTED */}
                  <td className="py-3 px-4 text-right">
                    <div className="text-cyan-300 font-bold text-sm">
                      {rec.totalVisits.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {((rec.totalVisits / totalVisitsCount) * 100).toFixed(1)}% {language === 'ru' ? 'всех' : 'share'}
                    </div>
                  </td>

                  {/* Unique Visitors */}
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    {rec.uniqueVisitors.toLocaleString()}
                  </td>

                  {/* Top Applet */}
                  <td className="py-3 px-4 text-slate-300 text-[11px]">
                    <div className="truncate max-w-[180px]" title={rec.topAppletUsed}>
                      {rec.topAppletUsed}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {rec.lastVisited}
                    </div>
                  </td>

                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                    {language === 'ru' ? 'Записей посещений не найдено по фильтру.' : 'No visitor records match the filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default GeoReportPanel;
