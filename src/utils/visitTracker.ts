/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SingularityMode } from '../types';

export interface AppletVisitStat {
  mode: SingularityMode;
  total: number;
  unique: number;
  percentOfTotal: number;
}

export interface VisitStatsData {
  totalGlobalVisits: number;
  uniqueGlobalVisits: number;
  appletStats: Record<SingularityMode, { total: number; unique: number }>;
}

const STORAGE_KEYS = {
  VISITOR_TOKEN: 'ricis_visitor_token',
  LEGACY_VISITOR_ID: 'ricis_visitor_id_v2'
};

export function getOrCreateVisitorId(): string {
  // 1. Check localStorage
  let token = localStorage.getItem(STORAGE_KEYS.VISITOR_TOKEN) || localStorage.getItem(STORAGE_KEYS.LEGACY_VISITOR_ID);

  // 2. Check Cookie
  if (!token && typeof document !== 'undefined') {
    const match = document.cookie.match(/ricis_visitor_token=([^;]+)/);
    if (match && match[1]) {
      token = match[1];
    }
  }

  // 3. Generate new if missing
  if (!token) {
    token = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }

  // Sync to localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.VISITOR_TOKEN, token);
  }
  return token;
}

export function saveServerVisitorToken(token: string) {
  if (token && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.VISITOR_TOKEN, token);
  }
}

// In-memory cache for fast sync UI rendering
let cachedStats: VisitStatsData = createEmptyStats();

function createEmptyStats(): VisitStatsData {
  const appletStats: Record<SingularityMode, { total: number; unique: number }> = {} as any;
  Object.values(SingularityMode).forEach((mode) => {
    appletStats[mode] = { total: 0, unique: 0 };
  });
  return {
    totalGlobalVisits: 0,
    uniqueGlobalVisits: 0,
    appletStats
  };
}

/**
 * Get current cached visit stats (starts from 0, populated via server API)
 */
export function getVisitStats(): VisitStatsData {
  return cachedStats;
}

/**
 * Fetch live global visit stats from the central server database.
 */
export async function fetchGlobalVisitStats(): Promise<VisitStatsData> {
  try {
    const res = await fetch('/api/visit-stats');
    if (res.ok) {
      const data = await res.json();
      const empty = createEmptyStats();
      
      const mergedAppletStats = { ...empty.appletStats };
      if (data.appletStats) {
        Object.keys(data.appletStats).forEach((mode) => {
          if (mergedAppletStats[mode as SingularityMode]) {
            mergedAppletStats[mode as SingularityMode] = data.appletStats[mode];
          } else {
            mergedAppletStats[mode as SingularityMode] = data.appletStats[mode];
          }
        });
      }

      cachedStats = {
        totalGlobalVisits: data.totalGlobalVisits || 0,
        uniqueGlobalVisits: data.uniqueGlobalVisits || 0,
        appletStats: mergedAppletStats
      };

      return cachedStats;
    }
  } catch (e) {
    console.error('Error fetching global visit stats:', e);
  }
  return cachedStats;
}

/**
 * Record a live applet visit in the central server database.
 */
export async function recordAppletVisit(mode: SingularityMode): Promise<VisitStatsData> {
  const visitorId = getOrCreateVisitorId();

  try {
    const res = await fetch('/api/applet-visit', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Visitor-Token': visitorId
      },
      body: JSON.stringify({ mode, userKey: visitorId })
    });

    const serverToken = res.headers.get('X-Visitor-Token');
    if (serverToken) {
      saveServerVisitorToken(serverToken);
    }

    if (res.ok) {
      const data = await res.json();
      if (data.userKey) {
        saveServerVisitorToken(data.userKey);
      }
      const empty = createEmptyStats();

      const mergedAppletStats = { ...empty.appletStats };
      if (data.appletStats) {
        Object.keys(data.appletStats).forEach((m) => {
          mergedAppletStats[m as SingularityMode] = data.appletStats[m];
        });
      }

      cachedStats = {
        totalGlobalVisits: data.totalGlobalVisits || 0,
        uniqueGlobalVisits: data.uniqueGlobalVisits || 0,
        appletStats: mergedAppletStats
      };

      return cachedStats;
    }
  } catch (e) {
    console.error('Error recording live applet visit:', e);
  }

  return cachedStats;
}

export function resetVisitStats(): VisitStatsData {
  cachedStats = createEmptyStats();
  return cachedStats;
}
