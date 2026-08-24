import { Router } from 'express';
import { isRateLimited } from '../utils/rateLimiter';
import { processAiChat, processGroupWishes } from '../services/aiService';

const router = Router();

router.post('/api/chat', async (req, res) => {
  try {
    const { message, history, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    if (isRateLimited(ip)) {
      const isRu = language === 'ru';
      const warningText = isRu
        ? "Вы отправляете сообщения слишком часто. Пожалуйста, подождите немного перед отправкой следующего сообщения."
        : "You are sending messages too frequently. Please wait a moment before sending your next message.";
      return res.json({ text: warningText });
    }

    const responseText = await processAiChat(message, history, language);
    res.json({ text: responseText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to call Gemini API' });
  }
});

router.post('/api/group-wishes', async (req, res) => {
  try {
    const { wishes } = req.body;
    if (!wishes || !Array.isArray(wishes)) {
      return res.status(400).json({ error: 'Wishes list is required' });
    }

    if (wishes.length === 0) {
      return res.json({ groups: [] });
    }

    const parsed = await processGroupWishes(wishes);
    res.json(parsed);
  } catch (error: any) {
    console.error('Group Wishes Error:', error);
    res.status(500).json({ error: error.message || 'Failed to group wishes' });
  }
});

export default router;
