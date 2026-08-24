import { Router } from 'express';
import { dbGetReviews, dbAddReview, dbUpdateReview, dbDeleteReview } from '../../db/database';
import { verifyAdmin } from '../middleware/authMiddleware';
import { resolveVisitorToken } from '../utils/visitorToken';

const router = Router();

// GET reviews
router.get('/api/reviews', (req, res) => {
  try {
    const reviews = dbGetReviews(false);
    res.json(reviews);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin reviews GET - returns all reviews including hidden ones
router.get('/api/admin/reviews', verifyAdmin, (req, res) => {
  try {
    const reviews = dbGetReviews(true);
    res.json(reviews);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST review
router.post('/api/reviews', (req, res) => {
  try {
    const { text, author } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Review text is required' });
    }
    const { userKey } = resolveVisitorToken(req, res);
    const newReview = dbAddReview({
      userKey,
      text: text.trim(),
      author: author ? String(author).trim() : 'Исследователь'
    });
    res.json(newReview);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT review (ADMIN ONLY)
router.put('/api/reviews/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { text, isCompleted, isHidden, author } = req.body;
    const updated = dbUpdateReview(id, { text, isCompleted, isHidden, author });
    if (!updated) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE review (ADMIN ONLY)
router.delete('/api/reviews/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const success = dbDeleteReview(id);
    if (!success) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
