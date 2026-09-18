import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const INDEX = path.join(__dirname, 'index.html');
const TITLE = 'لعبة المحيبس | محيبس حماده';
const DESCRIPTION = 'لعبة المحيبس العراقية التفاعلية من حماده، مهيأة للبث المباشر والجولات التفاعلية مع المتابعين.';

function originOf(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
}

function prepareHtml(data, req) {
  let html = data.toString('utf8');
  const origin = originOf(req);
  const canonical = origin ? `${origin}/` : '/';
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${TITLE}</title>`);
  const schema = JSON.stringify({
    '@context':'https://schema.org','@type':'VideoGame',
    name:'لعبة المحيبس',alternateName:'محيبس حماده',
    description:DESCRIPTION,url:canonical,inLanguage:'ar-IQ',gamePlatform:'Web browser'
  }).replace(/</g,'\\u003c');
  const meta = `
<meta name="description" content="${DESCRIPTION}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_IQ">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:url" content="${canonical}">
<script type="application/ld+json">${schema}</script>
`;
  html = html.replace('</head>', meta + '</head>');
  return Buffer.from(html, 'utf8');
}

function sendBuffer(req, res, status, type, body, cache='public, max-age=300') {
  const headers = {
    'Content-Type': type,
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Vary': 'Accept-Encoding'
  };
  if (String(req.headers['accept-encoding'] || '').includes('gzip')) {
    headers['Content-Encoding'] = 'gzip';
    res.writeHead(status, headers);
    zlib.gzip(body, { level: 4 }, (_err, gz) => res.end(gz));
  } else {
    res.writeHead(status, headers);
    res.end(body);
  }
}

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/' || url === '/index.html') {
    fs.readFile(INDEX, (err, data) => {
      if (err) return sendBuffer(req, res, 500, 'text/plain; charset=utf-8', Buffer.from('Game file not found'));
      sendBuffer(req, res, 200, 'text/html; charset=utf-8', prepareHtml(data, req));
    });
    return;
  }
  if (url === '/robots.txt') {
    const origin = originOf(req);
    const text = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
    return sendBuffer(req, res, 200, 'text/plain; charset=utf-8', Buffer.from(text), 'public, max-age=3600');
  }
  if (url === '/sitemap.xml') {
    const origin = originOf(req);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>\n`;
    return sendBuffer(req, res, 200, 'application/xml; charset=utf-8', Buffer.from(xml), 'public, max-age=3600');
  }
  if (url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    return res.end(JSON.stringify({ok:true}));
  }
  res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone Mohabis server listening on 0.0.0.0:${PORT}`);
});
