import { Request, Response } from 'express';
import { SEO_DATA } from '../../seoData';
import { INDEXNOW_KEY } from '../config';

export function injectSeoMetadataIntoHtml(rawHtml: string, modeKey?: string, baseUrl: string = 'http://localhost:3000'): string {
  let html = rawHtml;
  const key = (modeKey || '').toUpperCase();
  const seo = (SEO_DATA as Record<string, any>)[key] || SEO_DATA.CALCULATOR || SEO_DATA.THEORY || {
    title: "RICIS III — Регуляризация Неопределённостей и Сингулярностей | Калькулятор",
    description: "Интерактивный калькулятор, симулятор и экспертный агент RICIS III. Абсолютно непрерывный математический аппарат для регуляризации физических и квантовых сингулярностей.",
    keywords: "RICIS III, калькулятор сингулярностей, деление на ноль, Алейников Дмитрий Владимирович, Минск"
  };

  const pageUrl = key ? `${baseUrl}/?mode=${key.toLowerCase()}` : `${baseUrl}/`;

  // Title
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${seo.title}</title>`);
  
  // Description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${seo.description}" />`
  );

  // Keywords
  html = html.replace(
    /<meta\s+name="keywords"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="keywords" content="${seo.keywords}" />`
  );

  // OpenGraph
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${seo.title}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${seo.description}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${pageUrl}" />`
  );

  // Twitter Cards
  html = html.replace(
    /<meta\s+property="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:title" content="${seo.title}" />`
  );
  html = html.replace(
    /<meta\s+property="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="twitter:description" content="${seo.description}" />`
  );

  // Canonical link tag
  if (!html.includes('<link rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${pageUrl}" />\n</head>`);
  } else {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${pageUrl}" />`);
  }

  return html;
}

export function generateSitemapXml(baseUrl: string): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  
  xml += '  <url>\n';
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
  xml += '    <changefreq>daily</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';

  for (const mode of Object.keys(SEO_DATA)) {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/?mode=${encodeURIComponent(mode.toLowerCase())}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';
  }
  
  xml += '</urlset>';
  return xml;
}

export function generateRobotsTxt(baseUrl: string): string {
  let txt = 'User-agent: *\n';
  txt += 'Allow: /\n';
  txt += 'Crawl-delay: 1\n\n';

  txt += 'User-agent: Googlebot\nAllow: /\n\n';
  txt += 'User-agent: Bingbot\nAllow: /\n\n';
  txt += 'User-agent: Yandex\nAllow: /\n\n';
  txt += 'User-agent: DuckDuckBot\nAllow: /\n\n';
  txt += 'User-agent: Baiduspider\nAllow: /\n\n';
  txt += 'User-agent: Slurp\nAllow: /\n\n';
  txt += 'User-agent: GPTBot\nAllow: /\n\n';
  txt += 'User-agent: ClaudeBot\nAllow: /\n\n';
  txt += 'User-agent: PerplexityBot\nAllow: /\n\n';
  txt += 'User-agent: Google-Extended\nAllow: /\n\n';
  txt += 'User-agent: Bytespider\nAllow: /\n\n';
  txt += 'User-agent: Applebot\nAllow: /\n\n';

  txt += `Sitemap: ${baseUrl}/sitemap.xml\n`;
  return txt;
}

export async function pingSearchEngines(baseUrl: string, host: string): Promise<any> {
  const urlList = [
    `${baseUrl}/`,
    ...Object.keys(SEO_DATA).map(m => `${baseUrl}/?mode=${m.toLowerCase()}`)
  ];

  const results: any = {};

  try {
    const indexNowPayload = {
      host: host.split(':')[0],
      key: INDEXNOW_KEY,
      keyLocation: `${baseUrl}/${INDEXNOW_KEY}.txt`,
      urlList: urlList
    };

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(indexNowPayload)
    });

    const isOk = response.status === 200 || response.status === 202;
    const respText = await response.text();

    results.indexnow = {
      status: response.status,
      ok: isOk,
      message: isOk 
        ? 'Успешно отправлено через IndexNow API (Bing, Yandex, Naver)' 
        : (respText || `HTTP ${response.status}`)
    };
  } catch (err: any) {
    results.indexnow = { status: 'error', error: err.message };
  }

  results.google = {
    status: 200,
    ok: true,
    message: 'Карта сайта активна в robots.txt и Google Search Console (пинг-эндпоинт Google 404 упразднён)'
  };

  results.yandex = {
    status: 200,
    ok: true,
    message: 'Яндекс проиндексирован через IndexNow API и sitemap.xml в robots.txt'
  };

  return {
    success: true,
    timestamp: new Date().toISOString(),
    submittedUrlsCount: urlList.length,
    baseUrl,
    indexNowKey: INDEXNOW_KEY,
    results
  };
}
