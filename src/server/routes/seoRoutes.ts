import { Router } from 'express';
import { INDEXNOW_KEY } from '../config';
import { generateSitemapXml, generateRobotsTxt, pingSearchEngines } from '../services/seoService';

const router = Router();

// IndexNow verification key endpoints
router.get('/indexnow.txt', (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(INDEXNOW_KEY);
});

router.get(`/${INDEXNOW_KEY}.txt`, (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.send(INDEXNOW_KEY);
});

// Dynamic sitemap.xml generator
router.get('/sitemap.xml', (req, res) => {
  try {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    const xml = generateSitemapXml(baseUrl);
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (e: any) {
    res.status(500).send('Error generating sitemap');
  }
});

// Dynamic robots.txt
router.get('/robots.txt', (req, res) => {
  try {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    const txt = generateRobotsTxt(baseUrl);
    
    res.header('Content-Type', 'text/plain');
    res.send(txt);
  } catch (e) {
    res.status(500).send('Error generating robots.txt');
  }
});

// Trigger IndexNow & search engine instant indexing
router.post('/api/admin/ping-search-engines', async (req, res) => {
  try {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const result = await pingSearchEngines(baseUrl, host);
    res.json(result);
  } catch (e: any) {
    console.error('Error pinging search engines:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
