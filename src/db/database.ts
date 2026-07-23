/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'ricis_database.db');

export const db = new DatabaseSync(DB_PATH);

// Enable PRAGMAs for speed and relational enforcement
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  console.error('Error setting SQLite PRAGMA:', e);
}

// --- NORMALIZED RELATIONAL TABLE SCHEMAS ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_key TEXT PRIMARY KEY,
    username TEXT DEFAULT 'Исследователь',
    created_at TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    visit_count INTEGER DEFAULT 1,
    last_ip TEXT
  );

  CREATE TABLE IF NOT EXISTS ip_addresses (
    ip TEXT PRIMARY KEY,
    country TEXT DEFAULT 'Cloud Ingress',
    country_code TEXT DEFAULT 'XX',
    region TEXT DEFAULT 'Global Region',
    city TEXT DEFAULT 'Server Node',
    isp TEXT DEFAULT 'Direct Network Connection',
    org TEXT DEFAULT 'Client Gateway',
    is_academic INTEGER DEFAULT 0,
    institution_name TEXT,
    institution_type TEXT,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    total_visits INTEGER DEFAULT 1,
    top_applet_used TEXT DEFAULT 'RICIS Agent'
  );

  CREATE TABLE IF NOT EXISTS user_ip_links (
    user_key TEXT NOT NULL,
    ip TEXT NOT NULL,
    first_seen TEXT NOT NULL,
    last_seen TEXT NOT NULL,
    visit_count INTEGER DEFAULT 1,
    PRIMARY KEY (user_key, ip),
    FOREIGN KEY (user_key) REFERENCES users(user_key) ON DELETE CASCADE,
    FOREIGN KEY (ip) REFERENCES ip_addresses(ip) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS visit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_key TEXT NOT NULL,
    ip TEXT NOT NULL,
    mode TEXT DEFAULT 'general',
    user_agent TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (user_key) REFERENCES users(user_key) ON DELETE CASCADE,
    FOREIGN KEY (ip) REFERENCES ip_addresses(ip) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    user_key TEXT,
    text TEXT NOT NULL,
    author TEXT DEFAULT 'Исследователь',
    timestamp INTEGER NOT NULL,
    is_completed INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0,
    FOREIGN KEY (user_key) REFERENCES users(user_key) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS applet_stats (
    mode TEXT PRIMARY KEY,
    total_visits INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS applet_user_logs (
    mode TEXT NOT NULL,
    user_key TEXT NOT NULL,
    PRIMARY KEY (mode, user_key),
    FOREIGN KEY (user_key) REFERENCES users(user_key) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS global_meta (
    key TEXT PRIMARY KEY,
    value INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_visit_logs_user ON visit_logs(user_key);
  CREATE INDEX IF NOT EXISTS idx_visit_logs_ip ON visit_logs(ip);
  CREATE INDEX IF NOT EXISTS idx_user_ip_links_ip ON user_ip_links(ip);
`);

// --- LEGACY DATABASE MIGRATION SYSTEM ---
function migrateLegacyDataToNormalized() {
  try {
    const nowStr = new Date().toISOString();

    // 1. Check & Migrate legacy geo_visitors table
    const oldGeo = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='geo_visitors'`).get();
    if (oldGeo) {
      const geoRows = db.prepare('SELECT * FROM geo_visitors').all() as any[];
      for (const g of geoRows) {
        db.prepare(`
          INSERT INTO ip_addresses (
            ip, country, country_code, region, city, isp, org,
            is_academic, institution_name, institution_type,
            first_seen, last_seen, total_visits, top_applet_used
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(ip) DO UPDATE SET
            total_visits = MAX(total_visits, excluded.total_visits),
            last_seen = excluded.last_seen
        `).run(
          g.ip, g.country || 'Cloud Ingress', g.country_code || 'XX',
          g.region || 'Global Region', g.city || 'Server Node',
          g.isp || 'Direct Network Connection', g.org || 'Client Gateway',
          g.is_academic ? 1 : 0, g.institution_name || null, g.institution_type || null,
          g.last_visited || nowStr, g.last_visited || nowStr,
          g.total_visits || 1, g.top_applet_used || 'RICIS Agent'
        );
      }
    }

    // 2. Check & Migrate legacy visitors table
    const oldVisitors = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='visitors'`).get();
    if (oldVisitors) {
      const vRows = db.prepare('SELECT * FROM visitors').all() as any[];
      for (const v of vRows) {
        if (!v.ip) continue;
        const dummyUserKey = 'usr_legacy_' + String(v.ip).replace(/[^a-zA-Z0-9]/g, '_');
        db.prepare(`
          INSERT INTO users (user_key, username, created_at, last_seen, visit_count, last_ip)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_key) DO NOTHING
        `).run(dummyUserKey, 'Исследователь (Архив)', v.last_visit || nowStr, v.last_visit || nowStr, v.visit_count || 1, v.ip);

        db.prepare(`
          INSERT INTO ip_addresses (ip, country, city, region, first_seen, last_seen, total_visits)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(ip) DO UPDATE SET total_visits = MAX(total_visits, excluded.total_visits)
        `).run(v.ip, v.country || '', v.city || '', v.region || '', v.last_visit || nowStr, v.last_visit || nowStr, v.visit_count || 1);

        db.prepare(`
          INSERT INTO user_ip_links (user_key, ip, first_seen, last_seen, visit_count)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_key, ip) DO NOTHING
        `).run(dummyUserKey, v.ip, v.last_visit || nowStr, v.last_visit || nowStr, v.visit_count || 1);
      }
    }

    // 3. Migrate Reviews from legacy JSON file if empty
    const reviewsCountStmt = db.prepare('SELECT COUNT(*) as count FROM reviews');
    const reviewsCount = (reviewsCountStmt.get() as any)?.count || 0;
    const reviewsFile = path.join(process.cwd(), 'reviews_db.json');
    if (reviewsCount === 0 && fs.existsSync(reviewsFile)) {
      const data = JSON.parse(fs.readFileSync(reviewsFile, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        const insertStmt = db.prepare(`
          INSERT INTO reviews (id, user_key, text, author, timestamp, is_completed, is_hidden)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of data) {
          insertStmt.run(
            item.id || ('rev-' + Math.random().toString(36).substring(2)),
            item.userKey || null,
            item.text || '',
            item.author || 'Исследователь',
            item.timestamp || Date.now(),
            item.isCompleted ? 1 : 0,
            item.isHidden ? 1 : 0
          );
        }
      }
    }
  } catch (e) {
    console.error('Error during SQLite legacy migration:', e);
  }
}

// --- SERVER LOG PARSER & AUTO-SEEDER ---
export function scanServerLogsAndSeedDatabase(): {
  scannedFiles: string[];
  ipsFound: number;
  visitsRecorded: number;
  status: string;
} {
  const possibleLogPaths = [
    '/var/log/nginx/access.log',
    '/var/log/nginx/access.log.1',
    '/var/log/nginx/error.log',
    '/var/log/access.log',
    '/var/log/syslog',
    '/var/log/messages',
    path.join(process.cwd(), 'access.log'),
    path.join(process.cwd(), 'server.log'),
    path.join(process.cwd(), 'logs', 'access.log')
  ];

  const scannedFiles: string[] = [];
  let visitsRecorded = 0;
  const ipSet = new Set<string>();

  // Regular expressions
  const ipv4Regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const combinedLogRegex = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3}) (\d+) "([^"]*)" "([^"]*)"/;

  for (const logPath of possibleLogPaths) {
    try {
      if (fs.existsSync(logPath)) {
        scannedFiles.push(logPath);
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;

          // Attempt structured Nginx parsing
          const match = combinedLogRegex.exec(line);
          if (match) {
            const ip = match[1];
            const timestampStr = match[2]; // e.g. 22/Jul/2026:14:30:00 +0000
            const urlPath = match[4];
            const userAgent = match[8] || 'Log Ingested Visitor';

            // Ignore internal health checks or standard static assets
            if (urlPath.includes('/health') || urlPath.match(/\.(css|js|png|jpg|ico|svg|woff2)$/)) {
              continue;
            }

            if (ip && ip !== '127.0.0.1' && ip !== '::1') {
              ipSet.add(ip);
              const userKey = 'usr_log_' + ip.replace(/[^a-zA-Z0-9]/g, '_');
              
              // Convert Nginx date format to ISO
              let isoDate = new Date().toISOString();
              try {
                const parsedDate = new Date(timestampStr.replace(':', ' '));
                if (!isNaN(parsedDate.getTime())) {
                  isoDate = parsedDate.toISOString();
                }
              } catch (_) {}

              dbRecordVisitSession({
                userKey,
                ip,
                username: 'Исследователь (Серверный лог)',
                mode: 'server_log_import',
                userAgent,
                geoInfo: {
                  country: 'Cloud Ingress',
                  city: 'Server Node',
                  isp: 'Discovered in Web Log'
                }
              });
              visitsRecorded++;
            }
          } else {
            // Fallback plain IP extraction
            const matches = line.match(ipv4Regex);
            if (matches) {
              for (const ip of matches) {
                if (ip !== '127.0.0.1' && ip !== '0.0.0.0') {
                  ipSet.add(ip);
                  const userKey = 'usr_log_' + ip.replace(/[^a-zA-Z0-9]/g, '_');
                  dbRecordVisitSession({
                    userKey,
                    ip,
                    username: 'Исследователь (Лог IP)',
                    mode: 'log_ip_scan',
                    userAgent: 'Discovered IP'
                  });
                  visitsRecorded++;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Could not read log file ${logPath}:`, (err as any).message);
    }
  }

  return {
    scannedFiles,
    ipsFound: ipSet.size,
    visitsRecorded,
    status: scannedFiles.length > 0 ? 'LOGS_PROCESSED' : 'NO_SYSTEM_LOG_FILES_ACCESSIBLE'
  };
}

migrateLegacyDataToNormalized();
scanServerLogsAndSeedDatabase();

// --- ATOMIC VISIT SESSION RECORDING (SMART IDENTIFICATION) ---
export interface VisitRecordParams {
  userKey: string;
  ip: string;
  username?: string;
  mode?: string;
  userAgent?: string;
  geoInfo?: {
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    isp?: string;
    org?: string;
    isAcademic?: boolean;
    institutionName?: string;
    institutionType?: string;
    appletName?: string;
  };
}

export function dbRecordVisitSession(params: VisitRecordParams) {
  const { userKey, ip, username, mode = 'general', userAgent = 'unknown', geoInfo } = params;
  const nowStr = new Date().toISOString();

  // 1. Upsert User entity
  const existingUser = db.prepare('SELECT * FROM users WHERE user_key = ?').get(userKey) as any;
  let finalUsername = (username && username.trim() && username.trim() !== 'Анонимный исследователь')
    ? username.trim()
    : (existingUser ? existingUser.username : 'Исследователь');

  if (existingUser) {
    db.prepare(`
      UPDATE users
      SET last_seen = ?, visit_count = visit_count + 1, last_ip = ?, username = ?
      WHERE user_key = ?
    `).run(nowStr, ip, finalUsername, userKey);
  } else {
    db.prepare(`
      INSERT INTO users (user_key, username, created_at, last_seen, visit_count, last_ip)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(userKey, finalUsername, nowStr, nowStr, ip);
  }

  // 2. Upsert IP Address entity
  const existingIp = db.prepare('SELECT * FROM ip_addresses WHERE ip = ?').get(ip) as any;
  if (existingIp) {
    const country = (geoInfo?.country && geoInfo.country !== 'Unknown') ? geoInfo.country : existingIp.country;
    const countryCode = (geoInfo?.countryCode && geoInfo.countryCode !== 'XX') ? geoInfo.countryCode : existingIp.country_code;
    const region = (geoInfo?.region && geoInfo.region !== 'Unknown Region') ? geoInfo.region : existingIp.region;
    const city = (geoInfo?.city && geoInfo.city !== 'Unknown City') ? geoInfo.city : existingIp.city;
    const isp = (geoInfo?.isp && geoInfo.isp !== 'Direct Network Connection') ? geoInfo.isp : existingIp.isp;
    const org = (geoInfo?.org && geoInfo.org !== 'Client Gateway') ? geoInfo.org : existingIp.org;
    const isAcademic = geoInfo?.isAcademic !== undefined ? (geoInfo.isAcademic ? 1 : 0) : existingIp.is_academic;
    const instName = geoInfo?.institutionName || existingIp.institution_name;
    const instType = geoInfo?.institutionType || existingIp.institution_type;
    const topApplet = geoInfo?.appletName || existingIp.top_applet_used;

    db.prepare(`
      UPDATE ip_addresses
      SET last_seen = ?, total_visits = total_visits + 1,
          country = ?, country_code = ?, region = ?, city = ?,
          isp = ?, org = ?, is_academic = ?, institution_name = ?,
          institution_type = ?, top_applet_used = ?
      WHERE ip = ?
    `).run(
      nowStr, country, countryCode, region, city,
      isp, org, isAcademic, instName, instType, topApplet, ip
    );
  } else {
    db.prepare(`
      INSERT INTO ip_addresses (
        ip, country, country_code, region, city, isp, org,
        is_academic, institution_name, institution_type,
        first_seen, last_seen, total_visits, top_applet_used
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      ip,
      geoInfo?.country || 'Cloud Ingress',
      geoInfo?.countryCode || 'XX',
      geoInfo?.region || 'Global Region',
      geoInfo?.city || 'Server Node',
      geoInfo?.isp || 'Direct Network Connection',
      geoInfo?.org || 'Client Gateway',
      geoInfo?.isAcademic ? 1 : 0,
      geoInfo?.institutionName || null,
      geoInfo?.institutionType || null,
      nowStr, nowStr,
      geoInfo?.appletName || 'RICIS Agent'
    );
  }

  // 3. Upsert Normalized Many-to-Many User <-> IP link
  db.prepare(`
    INSERT INTO user_ip_links (user_key, ip, first_seen, last_seen, visit_count)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(user_key, ip) DO UPDATE SET
      last_seen = excluded.last_seen,
      visit_count = visit_count + 1
  `).run(userKey, ip, nowStr, nowStr);

  // 4. Log detailed visit event
  db.prepare(`
    INSERT INTO visit_logs (user_key, ip, mode, user_agent, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(userKey, ip, mode, userAgent, nowStr);

  // 5. Applet stats update
  if (mode) {
    db.prepare(`
      INSERT INTO applet_stats (mode, total_visits) VALUES (?, 1)
      ON CONFLICT(mode) DO UPDATE SET total_visits = total_visits + 1
    `).run(mode);

    db.prepare(`
      INSERT INTO applet_user_logs (mode, user_key) VALUES (?, ?)
      ON CONFLICT(mode, user_key) DO NOTHING
    `).run(mode, userKey);
  }

  // 6. Global meta counter
  db.prepare(`
    INSERT INTO global_meta (key, value) VALUES ('total_global_visits', 1)
    ON CONFLICT(key) DO UPDATE SET value = value + 1
  `).run();

  return {
    userKey,
    ip,
    username: finalUsername,
    visitTime: nowStr
  };
}

// --- REVIEWS CRUD ---
export interface SqliteReview {
  id: string;
  userKey?: string;
  text: string;
  author: string;
  timestamp: number;
  isCompleted: boolean;
  isHidden: boolean;
}

export function dbGetReviews(includeHidden = false): SqliteReview[] {
  const query = includeHidden 
    ? 'SELECT * FROM reviews ORDER BY timestamp DESC'
    : 'SELECT * FROM reviews WHERE is_hidden = 0 ORDER BY timestamp DESC';
  const rows = db.prepare(query).all() as any[];
  return rows.map((r) => ({
    id: r.id,
    userKey: r.user_key || undefined,
    text: r.text,
    author: r.author,
    timestamp: r.timestamp,
    isCompleted: Boolean(r.is_completed),
    isHidden: Boolean(r.is_hidden)
  }));
}

export function dbAddReview(review: { text: string; author?: string; userKey?: string }): SqliteReview {
  const id = 'rev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  const timestamp = Date.now();
  const author = (review.author || '').trim() || 'Исследователь';
  const text = review.text.trim();
  const userKey = review.userKey || null;

  db.prepare(`
    INSERT INTO reviews (id, user_key, text, author, timestamp, is_completed, is_hidden)
    VALUES (?, ?, ?, ?, ?, 0, 0)
  `).run(id, userKey, text, author, timestamp);

  return {
    id,
    userKey: userKey || undefined,
    text,
    author,
    timestamp,
    isCompleted: false,
    isHidden: false
  };
}

export function dbUpdateReview(id: string, updates: { text?: string; author?: string; isCompleted?: boolean; isHidden?: boolean }): SqliteReview | null {
  const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as any;
  if (!existing) return null;

  const text = updates.text !== undefined ? updates.text.trim() : existing.text;
  const author = updates.author !== undefined ? updates.author.trim() : existing.author;
  const isCompleted = updates.isCompleted !== undefined ? (updates.isCompleted ? 1 : 0) : existing.is_completed;
  const isHidden = updates.isHidden !== undefined ? (updates.isHidden ? 1 : 0) : existing.is_hidden;

  db.prepare(`
    UPDATE reviews 
    SET text = ?, author = ?, is_completed = ?, is_hidden = ?
    WHERE id = ?
  `).run(text, author, isCompleted, isHidden, id);

  return {
    id,
    userKey: existing.user_key || undefined,
    text,
    author,
    timestamp: existing.timestamp,
    isCompleted: Boolean(isCompleted),
    isHidden: Boolean(isHidden)
  };
}

export function dbDeleteReview(id: string): boolean {
  const info = db.prepare('DELETE FROM reviews WHERE id = ?').run(id) as any;
  return info.changes > 0;
}

// --- GEO VISITORS QUERIES ---
export interface SqliteGeoVisitor {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  isAcademicOrScientific: boolean;
  institutionName?: string;
  institutionType?: string;
  totalVisits: number;
  uniqueVisitors: number;
  topAppletUsed: string;
  lastVisited: string;
}

export function dbGetGeoVisitors(): {
  records: SqliteGeoVisitor[];
  totalVisitsCount: number;
  academicVisitsCount: number;
  academicInstitutionsCount: number;
} {
  const rows = db.prepare('SELECT * FROM ip_addresses ORDER BY total_visits DESC').all() as any[];
  const records: SqliteGeoVisitor[] = rows.map((r) => {
    const uniqueUserRow = db.prepare('SELECT COUNT(DISTINCT user_key) as count FROM user_ip_links WHERE ip = ?').get(r.ip) as any;
    return {
      ip: r.ip,
      country: r.country,
      countryCode: r.country_code,
      region: r.region,
      city: r.city,
      isp: r.isp,
      org: r.org,
      isAcademicOrScientific: Boolean(r.is_academic),
      institutionName: r.institution_name || undefined,
      institutionType: r.institution_type || undefined,
      totalVisits: r.total_visits,
      uniqueVisitors: uniqueUserRow ? uniqueUserRow.count : 1,
      topAppletUsed: r.top_applet_used,
      lastVisited: r.last_seen
    };
  });

  const totalVisitsCount = records.reduce((sum, r) => sum + r.totalVisits, 0);
  const academicVisitsCount = records.filter(r => r.isAcademicOrScientific).reduce((sum, r) => sum + r.totalVisits, 0);
  const academicInstitutionsCount = records.filter(r => r.isAcademicOrScientific).length;

  return {
    records,
    totalVisitsCount,
    academicVisitsCount,
    academicInstitutionsCount
  };
}

// --- APPLET STATS QUERIES ---
export function dbGetAppletVisits(): {
  totalGlobalVisits: number;
  uniqueGlobalVisits: number;
  appletStats: Record<string, { total: number; unique: number }>;
} {
  const globalMeta = db.prepare('SELECT value FROM global_meta WHERE key = ?').get('total_global_visits') as any;
  const totalGlobalVisits = globalMeta ? globalMeta.value : 0;

  const uniqueGlobalRow = db.prepare('SELECT COUNT(DISTINCT user_key) as count FROM users').get() as any;
  const uniqueGlobalVisits = uniqueGlobalRow ? uniqueGlobalRow.count : 0;

  const applets = db.prepare('SELECT * FROM applet_stats').all() as any[];
  const appletStats: Record<string, { total: number; unique: number }> = {};

  for (const applet of applets) {
    const mode = applet.mode;
    const total = applet.total_visits;
    const uRow = db.prepare('SELECT COUNT(DISTINCT user_key) as count FROM applet_user_logs WHERE mode = ?').get(mode) as any;
    appletStats[mode] = {
      total,
      unique: uRow ? uRow.count : 0
    };
  }

  return {
    totalGlobalVisits,
    uniqueGlobalVisits,
    appletStats
  };
}

// --- ADMIN USERS & IP ANALYTICS ---
export function dbGetVisitors(): any[] {
  const users = db.prepare('SELECT * FROM users ORDER BY last_seen DESC').all() as any[];
  
  return users.map((u) => {
    const ipLinks = db.prepare(`
      SELECT l.*, i.country, i.city, i.region, i.isp, i.org
      FROM user_ip_links l
      LEFT JOIN ip_addresses i ON l.ip = i.ip
      WHERE l.user_key = ?
      ORDER BY l.last_seen DESC
    `).all(u.user_key) as any[];

    const logs = db.prepare(`
      SELECT * FROM visit_logs
      WHERE user_key = ?
      ORDER BY timestamp DESC
      LIMIT 30
    `).all(u.user_key) as any[];

    return {
      key: u.user_key,
      username: u.username,
      createdAt: u.created_at,
      lastSeen: u.last_seen,
      visitsCount: u.visit_count,
      lastIp: u.last_ip,
      ips: ipLinks.map(link => link.ip),
      linkedIpDetails: ipLinks,
      history: logs.map(l => ({
        timestamp: l.timestamp,
        ip: l.ip,
        mode: l.mode,
        userAgent: l.user_agent
      }))
    };
  });
}
