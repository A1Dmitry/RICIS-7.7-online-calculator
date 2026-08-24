/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import reviewsRouter from './src/server/routes/reviewsRoutes';
import visitorsRouter from './src/server/routes/visitorsRoutes';
import mandelbrotRouter from './src/server/routes/mandelbrotRoutes';
import chatRouter from './src/server/routes/chatRoutes';
import authRouter from './src/server/routes/authRoutes';
import seoRouter from './src/server/routes/seoRoutes';
import { injectSeoMetadataIntoHtml } from './src/server/services/seoService';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Mount Modular API & Service Routes
app.use(reviewsRouter);
app.use(visitorsRouter);
app.use(mandelbrotRouter);
app.use(chatRouter);
app.use(authRouter);
app.use(seoRouter);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        try {
          let html = fs.readFileSync(indexPath, 'utf8');
          const mode = req.query.mode as string;
          const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          const host = req.get('host') || 'localhost:3000';
          const baseUrl = `${protocol}://${host}`;

          html = injectSeoMetadataIntoHtml(html, mode, baseUrl);
          res.send(html);
        } catch (err) {
          console.error('Error serving index.html with SEO:', err);
          res.sendFile(indexPath);
        }
      } else {
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
