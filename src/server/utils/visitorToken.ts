import { Request, Response } from 'express';

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

export function resolveVisitorToken(req: Request, res: Response): { userKey: string; ip: string; isNew: boolean } {
  const cookies = parseCookies(req.headers.cookie);
  
  let token = req.headers['x-visitor-token'] || cookies['ricis_visitor_token'] || req.body?.userKey || req.body?.visitorId;
  if (Array.isArray(token)) token = token[0];

  let isNew = false;
  if (!token || typeof token !== 'string' || !token.trim() || token.trim().length < 5) {
    token = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    isNew = true;
  } else {
    token = token.trim();
  }

  res.setHeader('X-Visitor-Token', token);
  res.setHeader('Set-Cookie', `ricis_visitor_token=${token}; Path=/; Max-Age=31536000; SameSite=Lax`);

  let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  if (Array.isArray(clientIp)) clientIp = clientIp[0];
  if (typeof clientIp === 'string' && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  const ip = String(clientIp || '127.0.0.1');

  return { userKey: token, ip, isNew };
}
