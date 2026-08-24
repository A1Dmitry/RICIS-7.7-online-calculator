import { Router } from 'express';
import { renderMandelbrotServer } from '../services/mandelbrotRenderer';

const router = Router();

router.post('/api/mandelbrot/render', (req, res) => {
  try {
    const result = renderMandelbrotServer(req.body || {});
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Server render failed' });
  }
});

export default router;
