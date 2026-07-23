/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { SEO_DATA } from '../seoData';
import { 
  Globe, Zap, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, 
  ExternalLink, Copy, Check, Search, Bot, FileText, Share2, Award, Sparkles
} from 'lucide-react';

export const SeoAndIndexingPanel: React.FC = () => {
  const { language } = useLanguage();
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handlePingSearchEngines = async () => {
    setIsPinging(true);
    setPingError(null);
    try {
      const res = await fetch('/api/admin/ping-search-engines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPingResult(data);
      } else {
        setPingError(data.error || 'Ошибка при отправке запросов в поисковые системы');
      }
    } catch (err: any) {
      setPingError(err.message || 'Ошибка сети при отправке pings');
    } finally {
      setIsPinging(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const baseUrl = window.location.origin;

  const crawlerList = [
    { name: 'Googlebot (Google)', type: 'Search Crawler', status: 'Allowed' },
    { name: 'Bingbot (Microsoft Bing)', type: 'Search Crawler', status: 'Allowed' },
    { name: 'YandexBot (Яндекс)', type: 'Search Crawler', status: 'Allowed' },
    { name: 'GPTBot (OpenAI / ChatGPT)', type: 'LLM Indexer', status: 'Allowed' },
    { name: 'ClaudeBot (Anthropic Claude)', type: 'LLM Indexer', status: 'Allowed' },
    { name: 'PerplexityBot (Perplexity AI)', type: 'LLM Indexer', status: 'Allowed' },
    { name: 'Google-Extended (Gemini RAG)', type: 'LLM Indexer', status: 'Allowed' },
    { name: 'Bytespider (TikTok / Bytedance)', type: 'Search Crawler', status: 'Allowed' },
    { name: 'Applebot (Apple Siri / AI)', type: 'Search Crawler', status: 'Allowed' },
    { name: 'DuckDuckBot (DuckDuckGo)', type: 'Search Crawler', status: 'Allowed' },
  ];

  const modesList = Object.keys(SEO_DATA);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>{language === 'ru' ? 'Альтернативные методы быстрой индексации (IndexNow & AI Bots)' : 'Instant Indexing Methods (IndexNow & AI Bots)'}</span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {language === 'ru' 
                ? 'Прямая отправка URL калькулятора в Microsoft Bing, Яндекс, Naver через протокол IndexNow. Автоматическая генерация динамической карты сайта sitemap.xml, robots.txt, Schema.org онтологии и пре-рендеринг для поисковых роботов.'
                : 'Direct URL submission to Bing, Yandex, Naver via IndexNow protocol. Automated dynamic sitemap.xml generation, robots.txt, Schema.org ontology, and SSR pre-rendering.'}
            </p>
          </div>

          <button
            onClick={handlePingSearchEngines}
            disabled={isPinging}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isPinging ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>{language === 'ru' ? 'Отправка...' : 'Pinging...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-slate-950" />
                <span>{language === 'ru' ? '🚀 Отправить pings (IndexNow)' : '🚀 Trigger Instant Indexing'}</span>
              </>
            )}
          </button>
        </div>

        {/* Ping Results Feedback */}
        {pingResult && (
          <div className="mt-4 p-4 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ru' ? 'Запрос отправлен успешно!' : 'Indexing ping request sent!'}</span>
              <span className="text-slate-400 text-xs font-normal">({pingResult.submittedUrlsCount} URLs)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-slate-300">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50">
                <span className="font-semibold text-cyan-400">IndexNow API:</span> {pingResult.results?.indexnow?.message || 'OK'}
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50">
                <span className="font-semibold text-blue-400">Google Sitemap Ping:</span> HTTP {pingResult.results?.google?.status || '200'}
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-700/50">
                <span className="font-semibold text-red-400">Yandex Sitemap Ping:</span> HTTP {pingResult.results?.yandex?.status || '200'}
              </div>
            </div>
          </div>
        )}

        {pingError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{pingError}</span>
          </div>
        )}
      </div>

      {/* Grid of Standard SEO Files & Academic Citations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Files Box */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{language === 'ru' ? 'Служебные файлы индексации' : 'Indexing Infrastructure Files'}</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200">sitemap.xml</span>
                <p className="text-[11px] text-slate-400">{language === 'ru' ? 'Динамическая карта сайта (все 16 разделов)' : 'Dynamic XML Sitemap with all 16 modes'}</p>
              </div>
              <a
                href={`${baseUrl}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>URL</span>
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200">robots.txt</span>
                <p className="text-[11px] text-slate-400">{language === 'ru' ? 'Инструкции для Googlebot, Bingbot, Yandex, GPTBot, Claude' : 'Full access permissions for AI & Search crawlers'}</p>
              </div>
              <a
                href={`${baseUrl}/robots.txt`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>URL</span>
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200">indexnow.txt</span>
                <p className="text-[11px] text-slate-400">{language === 'ru' ? 'Ключ протокола мгновенной индексации IndexNow' : 'IndexNow protocol verification key'}</p>
              </div>
              <a
                href={`${baseUrl}/indexnow.txt`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>URL</span>
              </a>
            </div>
          </div>
        </div>

        {/* Academic Citation DOIs */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Award className="w-4 h-4" />
            <span>{language === 'ru' ? 'Google Scholar & Zenodo DOIs' : 'Google Scholar & Zenodo DOIs'}</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">DOI: 10.5281/zenodo.17872755</span>
                <a href="https://doi.org/10.5281/zenodo.17872755" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400">Primary Publication v1 (Millennium Problems & Navier-Stokes)</p>
            </div>

            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">DOI: 10.5281/zenodo.18116204</span>
                <a href="https://doi.org/10.5281/zenodo.18116204" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400">Zenodo Publication v2 (Expanded proofs & CDCC)</p>
            </div>

            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-cyan-300 font-bold">DOI: 10.5281/zenodo.21309650</span>
                <a href="https://doi.org/10.5281/zenodo.21309650" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-[11px] text-slate-400">Zenodo Publication v3 (Complete Axiomatics & Monoliths)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Crawlers & AI Agent Allowlist Status */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-400" />
          <span>{language === 'ru' ? 'Статус доступа поисковых и ИИ роботов (robots.txt Allowlist)' : 'Search & AI Crawlers Allowlist Status'}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {crawlerList.map((bot, idx) => (
            <div key={idx} className="p-2 rounded bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <span className="font-medium text-slate-200 text-[11px] block truncate" title={bot.name}>{bot.name}</span>
                <span className="text-[10px] text-slate-500 block">{bot.type}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>{bot.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All 16 Indexed Modes & Canonical Links */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>{language === 'ru' ? 'Индексируемые канонические URL калькулятора (16 разделов)' : 'Indexed Canonical Calculator URLs (16 Modes)'}</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Total: {modesList.length}</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {modesList.map((modeKey) => {
            const seo = SEO_DATA[modeKey];
            const url = `${baseUrl}/?mode=${modeKey.toLowerCase()}`;
            return (
              <div key={modeKey} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800/50 font-semibold">
                      {modeKey}
                    </span>
                    <span className="font-bold text-slate-200 truncate">{seo.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{seo.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(url, modeKey)}
                    className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedUrl === modeKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">{language === 'ru' ? 'Скопировано' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === 'ru' ? 'Копировать URL' : 'Copy URL'}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 transition-colors"
                    title="Открыть URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeoAndIndexingPanel;
