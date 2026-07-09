/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, getAccessToken, googleSignIn } from '../lib/firebase';
import { FileSpreadsheet, Loader2, Check, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface ExportToSheetsButtonProps {
  mode: string;
  params: any;
  defaultDescription: string;
}

export default function ExportToSheetsButton({ mode, params, defaultDescription }: ExportToSheetsButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [description, setDescription] = useState<string>(defaultDescription);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' | null }>({ text: '', type: null });
  const { t } = useLanguage();

  // Sync with auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const accessToken = await getAccessToken();
        setToken(accessToken);
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginAndExport = async () => {
    try {
      setStatus({ text: t('Выполняется вход...', 'Signing in...'), type: null });
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setStatus({ text: t('Вход выполнен! Готов к экспорту.', 'Signed in successfully! Ready to export.'), type: 'success' });
      }
    } catch (err: any) {
      setStatus({ text: t(`Вход не удался: ${err.message || err}`, `Sign in failed: ${err.message || err}`), type: 'error' });
    }
  };

  const handleExport = async () => {
    const spreadsheetId = localStorage.getItem('ricis_spreadsheet_id');
    if (!spreadsheetId) {
      setStatus({ 
        text: t('Ошибка: сначала подключите или создайте Google Таблицу на вкладке "Google Sheets".', 'Error: please connect or create a Google Sheet in the "Google Sheets" tab first.'), 
        type: 'error' 
      });
      return;
    }

    const currentToken = token || await getAccessToken();
    if (!currentToken) {
      setStatus({ text: t('Ошибка: токен авторизации истек. Пожалуйста, перезайдите.', 'Error: authorization token expired. Please re-sign in.'), type: 'error' });
      return;
    }

    setIsExporting(true);
    setStatus({ text: t('Отправка в Google Таблицу...', 'Exporting to Google Sheet...'), type: null });

    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const rowData = [
        timestamp,
        mode,
        JSON.stringify(params),
        description,
        'RESOLVED'
      ];

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A:E:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: [rowData]
          })
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || t('Не удалось экспортировать данные', 'Failed to export data'));
      }

      setStatus({ text: t('Параметры симуляции успешно сохранены в Google Sheets!', 'Simulation parameters successfully saved in Google Sheets!'), type: 'success' });
      setTimeout(() => {
        setStatus({ text: '', type: null });
      }, 5000);
    } catch (err: any) {
      console.error(err);
      setStatus({ text: t(`Ошибка экспорта: ${err.message}`, `Export error: ${err.message}`), type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#121214] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold text-white uppercase tracking-wider">{t('Экспорт в Google Sheets', 'Export to Google Sheets')}</span>
      </div>

      {!user ? (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            {t('Авторизуйтесь, чтобы сохранять активные регуляризованные параметры в вашу таблицу.', 'Sign in to save active regularized parameters to your spreadsheet.')}
          </p>
          <button
            type="button"
            onClick={handleLoginAndExport}
            className="w-full flex items-center justify-center gap-1.5 bg-emerald-950/25 border border-emerald-500/30 hover:bg-emerald-950/40 text-emerald-400 text-[10px] uppercase font-mono tracking-wider py-1.5 rounded transition duration-150 cursor-pointer"
          >
            <span>{t('Войти и сохранить', 'Sign In and Save')}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div>
            <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">{t('Заметка / Описание пресета', 'Note / Preset Description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Введите описание эксперимента...', 'Enter experiment description...')}
              className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 text-slate-200 text-[11px] rounded px-2.5 py-1.5 outline-none transition font-sans"
            />
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-900 text-white font-semibold text-[10px] uppercase font-mono tracking-wider py-2 rounded transition cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('Экспорт данных...', 'Exporting data...')}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('Записать в Google Таблицу', 'Write to Google Sheet')}</span>
              </>
            )}
          </button>
        </div>
      )}

      {status.text && (
        <div className={`p-2.5 rounded text-[10px] flex items-start gap-2 leading-tight ${
          status.type === 'success' ? 'bg-emerald-950/20 border border-emerald-500/20 text-emerald-400' :
          status.type === 'error' ? 'bg-red-950/20 border border-red-500/20 text-red-400' :
          'bg-cyan-950/10 border border-cyan-500/10 text-cyan-400'
        }`}>
          {status.type === 'success' ? (
            <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
          ) : status.type === 'error' ? (
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 flex-shrink-0 animate-spin text-cyan-400" />
          )}
          <span>{status.text}</span>
        </div>
      )}
    </div>
  );
}
