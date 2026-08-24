import { Router } from 'express';
import {
  dbRecordVisitSession,
  dbGetAppletVisits,
  dbGetGeoVisitors,
  dbGetVisitors,
  scanServerLogsAndSeedDatabase
} from '../../db/database';
import { verifyAdmin } from '../middleware/authMiddleware';
import { resolveVisitorToken } from '../utils/visitorToken';
import { classifyInstitutionServer } from '../services/geoService';

const router = Router();

// Visitor registration and tracking ping
router.post('/api/visit', (req, res) => {
  try {
    const { userKey, ip } = resolveVisitorToken(req, res);
    const { username } = req.body || {};
    const userAgent = String(req.headers['user-agent'] || 'unknown');

    const result = dbRecordVisitSession({
      userKey,
      ip,
      username,
      mode: 'general',
      userAgent
    });

    res.json({
      success: true,
      userKey: result.userKey,
      ip: result.ip,
      username: result.username
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET Global Live Applet Visit Stats
router.get('/api/visit-stats', (req, res) => {
  try {
    const stats = dbGetAppletVisits();
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST Record Live Applet Visit
router.post('/api/applet-visit', (req, res) => {
  try {
    const { mode } = req.body || {};
    if (!mode) {
      return res.status(400).json({ error: 'Mode parameter is required' });
    }

    const { userKey, ip } = resolveVisitorToken(req, res);
    const userAgent = String(req.headers['user-agent'] || 'unknown');

    dbRecordVisitSession({
      userKey,
      ip,
      mode,
      userAgent
    });

    const stats = dbGetAppletVisits();

    res.json({
      success: true,
      userKey,
      ...stats
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET Global GEO Visitor Records
router.get('/api/geo-visitors', (req, res) => {
  try {
    const data = dbGetGeoVisitors();
    res.json({
      success: true,
      ...data
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST Register / Update Global GEO Visit
router.post('/api/geo-visit', (req, res) => {
  try {
    const { userKey, ip } = resolveVisitorToken(req, res);
    const { 
      country, 
      countryCode, 
      region, 
      city, 
      isp, 
      org, 
      appletName,
      username
    } = req.body || {};

    const finalIsp = isp || 'Direct Network Connection';
    const finalOrg = org || 'Client Gateway';
    const classification = classifyInstitutionServer(finalIsp, finalOrg);
    const userAgent = String(req.headers['user-agent'] || 'unknown');

    dbRecordVisitSession({
      userKey,
      ip,
      username,
      mode: appletName || 'RICIS Agent',
      userAgent,
      geoInfo: {
        country,
        countryCode,
        region,
        city,
        isp: finalIsp,
        org: finalOrg,
        isAcademic: classification.isAcademic,
        institutionName: classification.name,
        institutionType: classification.type,
        appletName
      }
    });

    const allData = dbGetGeoVisitors();

    res.json({
      success: true,
      userKey,
      ip,
      ...allData
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin visitors and IP grouping - ADMIN ONLY
router.get('/api/admin/visitors', verifyAdmin, (req, res) => {
  try {
    const visitors = dbGetVisitors();
    res.json(visitors);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin trigger scan server logs & seed database
router.post('/api/admin/scan-logs', verifyAdmin, (req, res) => {
  try {
    const result = scanServerLogsAndSeedDatabase();
    res.json({
      success: true,
      ...result
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
