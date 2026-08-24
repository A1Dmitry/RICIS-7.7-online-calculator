import { Request, Response, NextFunction } from 'express';

export const activeAdminTokens = new Set<string>();
export const pendingAdminCodes = new Map<string, { code: string; expiresAt: number }>();

export function verifyAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeAdminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
  }
  next();
}
