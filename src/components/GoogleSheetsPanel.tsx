/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  googleSignIn, 
  logout, 
  initAuth, 
  getAccessToken,
  setAccessToken
} from '../lib/firebase';
import { SingularityMode } from '../types';
import { 
  FileSpreadsheet, 
  LogIn, 
  LogOut, 
  Plus, 
  Link, 
  Loader2, 
  Check, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  ShieldCheck, 
  Database,
  ExternalLink
} from 'lucide-react';

interface GoogleSheetsPanelProps {
  onLoadPreset: (mode: SingularityMode, params: any) => void;
}

export default function GoogleSheetsPanel({ onLoadPreset }: GoogleSheetsPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState<boolean>(false);
  
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('ricis_spreadsheet_id') || '';
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');
  const [spreadsheetRows, setSpreadsheetRows] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });

  // On mount, initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch spreadsheet data whenever token or spreadsheetId changes
  useEffect(() => {
    if (token && spreadsheetId) {
      fetchSpreadsheetData(spreadsheetId, token);
    } else {
      setSpreadsheetRows([]);
      setSpreadsheetTitle('');
    }
  }, [token, spreadsheetId]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    showStatus('Инициализация Google OAuth...', 'info');
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        showStatus('Вход выполнен успешно!', 'success');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      showStatus(`Ошибка авторизации: ${err.message || err}`, 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setSpreadsheetRows([]);
      setSpreadsheetTitle('');
      showStatus('Выход выполнен успешно.', 'success');
    } catch (err: any) {
      showStatus(`Ошибка при выходе: ${err.message}`, 'error');
    }
  };

  const showStatus = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(prev => prev.text === text ? { text: '', type: null } : prev);
    }, 5000);
  };

  // Extract Spreadsheet ID from pasted text (handles full URLs)
  const handleSpreadsheetIdChange = (val: string) => {
    let extractedId = val.trim();
    // Regex to match spreadsheet ID in Google Sheets URL
    const match = extractedId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }
    setSpreadsheetId(extractedId);
    localStorage.setItem('ricis_spreadsheet_id', extractedId);
  };

  // Create a brand new Spreadsheet in user's Google Drive
  const handleCreateSpreadsheet = async () => {
    if (!token) return;
    setIsLoadingSpreadsheet(true);
    showStatus('Создание новой Google Таблицы...', 'info');
    
    try {
      // 1. Create spreadsheet file
      const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: 'RICIS III Paradigm Simulation Presets'
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Не удалось создать таблицу');
      }

      const data = await res.json();
      const newId = data.spreadsheetId;
      setSpreadsheetId(newId);
      localStorage.setItem('ricis_spreadsheet_id', newId);
      setSpreadsheetTitle(data.properties.title);
      showStatus('Таблица создана! Инициализация структуры...', 'info');

      // 2. Write headers to Sheet1!A1:E1
      const writeHeadersRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${newId}/values/Sheet1!A1:E1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: 'Sheet1!A1:E1',
            majorDimension: 'ROWS',
            values: [
              ['Время', 'Режим симуляции', 'Параметры (JSON)', 'Описание пресета', 'Статус RICIS']
            ]
          })
        }
      );

      if (!writeHeadersRes.ok) {
        console.warn('Failed to write headers, but spreadsheet was created');
      }

      // 3. Add default presets
      await appendDefaultPresets(newId, token);

      showStatus('Новая таблица пресетов успешно создана и инициализирована!', 'success');
      await fetchSpreadsheetData(newId, token);
    } catch (err: any) {
      console.error(err);
      showStatus(`Ошибка при создании таблицы: ${err.message}`, 'error');
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  const appendDefaultPresets = async (sheetId: string, authToken: string) => {
    const defaultPresets = [
      [
        new Date().toISOString().replace('T', ' ').substring(0, 19),
        'GRAVITATIONAL',
        JSON.stringify({ mass: 10, spin: 0.9, charge: 0.1, radius: 2.2, regularization: 0.6 }),
        'Сингулярность Керра при экстремальном вращении',
        'RESOLVED'
      ],
      [
        new Date().toISOString().replace('T', ' ').substring(0, 19),
        'COMPLEX_ANALYSIS',
        JSON.stringify({ funcType: 'pole_2', zoom: 1.5, blowUp: 0.4, cursorX: 0.0, cursorY: 0.0 }),
        'Двойной полюс в начале координат',
        'RESOLVED'
      ],
      [
        new Date().toISOString().replace('T', ' ').substring(0, 19),
        'KINEMATIC',
        JSON.stringify({ angle1: 45, angle2: -90, length1: 5.0, length2: 4.0, targetVx: 2.0, targetVy: 1.5, damping: 0.15 }),
        'Конфигурация робота-манипулятора вблизи полюса',
        'RESOLVED'
      ]
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A2:E?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: defaultPresets
        })
      }
    );
  };

  // Fetch current spreadsheet title and values
  const fetchSpreadsheetData = async (sheetId: string, authToken: string) => {
    if (!sheetId || !authToken) return;
    setIsLoadingSpreadsheet(true);
    try {
      // 1. Get spreadsheet metadata for title
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (!metaRes.ok) {
        throw new Error('Таблица не найдена или нет доступа. Проверьте ID.');
      }
      const metaData = await metaRes.json();
      setSpreadsheetTitle(metaData.properties.title || 'Безымянная таблица');

      // 2. Get values from range Sheet1!A1:E100
      const valuesRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:E100`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      if (!valuesRes.ok) {
        throw new Error('Не удалось прочитать данные с Листа 1');
      }

      const valuesData = await valuesRes.json();
      const rows = valuesData.values || [];
      
      if (rows.length > 0) {
        // Skip header row for parsed rows
        const header = rows[0];
        const dataRows = rows.slice(1).map((r: any[], idx: number) => ({
          id: idx + 2, // 1-indexed in sheet row number
          timestamp: r[0] || '',
          mode: r[1] || '',
          paramsJson: r[2] || '',
          description: r[3] || '',
          ricisStatus: r[4] || ''
        })).reverse(); // Show latest entries first
        setSpreadsheetRows(dataRows);
      } else {
        setSpreadsheetRows([]);
      }
    } catch (err: any) {
      console.error(err);
      setSpreadsheetTitle('');
      setSpreadsheetRows([]);
      showStatus(`Ошибка загрузки данных: ${err.message}`, 'error');
    } finally {
      setIsLoadingSpreadsheet(false);
    }
  };

  const handleLoadRowPreset = (row: any) => {
    try {
      const parsedParams = JSON.parse(row.paramsJson);
      let targetMode: SingularityMode;
      
      switch (row.mode.toUpperCase()) {
        case 'GRAVITATIONAL':
          targetMode = SingularityMode.GRAVITATIONAL;
          break;
        case 'COMPLEX_ANALYSIS':
          targetMode = SingularityMode.COMPLEX_ANALYSIS;
          break;
        case 'KINEMATIC':
          targetMode = SingularityMode.KINEMATIC;
          break;
        case 'NAVIER_STOKES':
          targetMode = SingularityMode.NAVIER_STOKES;
          break;
        case 'RIEMANN':
          targetMode = SingularityMode.RIEMANN;
          break;
        case 'YANG_MILLS':
          targetMode = SingularityMode.YANG_MILLS;
          break;
        default:
          throw new Error(`Неизвестный режим: ${row.mode}`);
      }

      onLoadPreset(targetMode, parsedParams);
      showStatus(`Пресет "${row.description || row.mode}" успешно загружен в симулятор!`, 'success');
    } catch (err: any) {
      showStatus(`Ошибка разбора параметров пресета: ${err.message}`, 'error');
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'GRAVITATIONAL': return 'Гравитационная';
      case 'COMPLEX_ANALYSIS': return 'Комплексный анализ';
      case 'KINEMATIC': return 'Кинематика манипуляторов';
      case 'NAVIER_STOKES': return 'Навье-Стокс';
      case 'RIEMANN': return 'Дзета Римана';
      case 'YANG_MILLS': return 'Янг-Миллс';
      default: return mode;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar Controls */}
      <div className="lg:col-span-4 space-y-6">
        <div id="sheets-auth-card" className="bg-[#121214] border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Связь с Google Cloud</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">OAUTH2 / FIREBASE AUTH</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Авторизация предоставляет приложению доступ на чтение и запись только к файлам таблиц, созданным этим приложением (ограничение <code className="text-emerald-400 font-mono bg-black/40 px-1 py-0.5 rounded text-[10px]">drive.file</code>). Ваша безопасность гарантирована политикой песочницы Google.
          </p>

          {needsAuth ? (
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-900 text-white font-medium text-xs uppercase tracking-wider py-3 px-4 rounded-lg transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-900/10 hover:shadow-emerald-500/15"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Авторизация...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Войти через Google</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-black/30 border border-white/5 p-3 rounded-lg">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full border border-emerald-500/30" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-900/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold uppercase font-mono">
                    {user?.displayName ? user.displayName[0] : 'U'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{user?.displayName || 'Пользователь Google'}</p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 border border-white/10 hover:bg-red-950/20 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти из аккаунта</span>
              </button>
            </div>
          )}
        </div>

        {/* Spreadsheet Configuration Card */}
        <div id="sheets-config-card" className={`bg-[#121214] border border-white/5 rounded-xl p-6 relative overflow-hidden transition-opacity duration-300 ${needsAuth ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase">Google Таблица</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">DATABASE INTEGRATION</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">ID или URL Google Таблицы</label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
                placeholder="Вставьте ID или URL таблицы..."
                className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 text-slate-200 text-xs rounded-lg px-3.5 py-2.5 font-mono outline-none transition"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => fetchSpreadsheetData(spreadsheetId, token || '')}
                disabled={isLoadingSpreadsheet || !spreadsheetId}
                className="flex-1 flex items-center justify-center gap-2 bg-black/30 border border-white/15 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 disabled:text-slate-600 disabled:border-white/5 text-[11px] uppercase tracking-wider py-2.5 rounded-lg transition"
              >
                {isLoadingSpreadsheet ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Обновить</span>
              </button>

              <button
                onClick={handleCreateSpreadsheet}
                disabled={isLoadingSpreadsheet}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-950/20 border border-emerald-500/30 hover:bg-emerald-950/40 text-emerald-400 text-[11px] uppercase tracking-wider py-2.5 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать новую</span>
              </button>
            </div>

            {spreadsheetTitle && (
              <div className="p-3 bg-black/20 border border-emerald-500/10 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Активная таблица</span>
                  <a 
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[10px] font-mono font-medium"
                  >
                    <span>Открыть</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="font-semibold text-white tracking-tight truncate">{spreadsheetTitle}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status messages banner */}
        {statusMessage.text && (
          <div className={`p-4 rounded-lg flex items-start gap-3 border text-xs leading-relaxed ${
            statusMessage.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' :
            statusMessage.type === 'error' ? 'bg-red-950/20 border-red-500/30 text-red-300' :
            'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
          }`}>
            <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              statusMessage.type === 'success' ? 'text-emerald-400' :
              statusMessage.type === 'error' ? 'text-red-400' :
              'text-cyan-400'
            }`} />
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Content: Presets list */}
      <div className="lg:col-span-8 space-y-6">
        <div id="sheets-presets-card" className="bg-[#121214] border border-white/5 rounded-xl p-6 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase">База симуляций в Google Sheets</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">PRESETS DIRECTORY AND REGULARIZED STATES</p>
            </div>
            {spreadsheetRows.length > 0 && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                {spreadsheetRows.length} записей
              </span>
            )}
          </div>

          {needsAuth ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mb-4">
                <Database className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Требуется подключение Google Cloud</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Пожалуйста, войдите в свой Google аккаунт слева, чтобы получить доступ к таблицам или создать новый репозиторий пресетов симулятора.
              </p>
            </div>
          ) : !spreadsheetId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Таблица не подключена</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Введите ID существующей таблицы или нажмите кнопку "Создать новую", чтобы автоматически развернуть готовую базу пресетов на вашем Google Диске.
              </p>
            </div>
          ) : isLoadingSpreadsheet && spreadsheetRows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
              <p className="text-xs text-slate-500 font-mono">ЗАГРУЗКА РЕПОЗИТОРИЯ ТАБЛИЦ...</p>
            </div>
          ) : spreadsheetRows.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-emerald-500/20 mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Таблица пуста</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Мы не нашли записей на Листе 1 вашей таблицы. Вы можете сохранить текущую симуляцию из любого модуля в эту таблицу!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                    <th className="pb-3 font-medium">Время</th>
                    <th className="pb-3 font-medium">Тип сингулярности</th>
                    <th className="pb-3 font-medium">Описание пресета</th>
                    <th className="pb-3 font-medium text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {spreadsheetRows.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] group transition-colors">
                      <td className="py-3 text-[11px] text-slate-400 font-mono whitespace-nowrap">{row.timestamp}</td>
                      <td className="py-3 font-medium whitespace-nowrap">
                        <span className="text-white bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded text-[10px]">
                          {getModeLabel(row.mode)}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 max-w-xs truncate" title={row.description}>
                        {row.description || <em className="text-slate-600">Нет описания</em>}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleLoadRowPreset(row)}
                          className="inline-flex items-center gap-1.5 bg-emerald-950/30 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 text-[10px] uppercase font-mono tracking-wider px-2.5 py-1 rounded transition duration-200 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Загрузить</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
