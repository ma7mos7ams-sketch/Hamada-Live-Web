import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { TikTokLiveConnection } from 'tiktok-live-connector';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const CENTER_FILE = path.join(__dirname, 'index.html');
const ROBOTS_FILE = path.join(__dirname, 'robots.txt');
const SITEMAP_FILE = path.join(__dirname, 'sitemap.xml');
const MAX_SESSIONS = Math.max(1, Number(process.env.MAX_SESSIONS || 100));

const SITE_ORIGIN = 'https://game-center-live-app-production.up.railway.app';
const GAME_SEO = [
  {key:'سباق المتابعين',slug:'followers-race',file:'followers-race.html',name:'سباق المتابعين',title:'سباق المتابعين للبث المباشر | مركز ألعاب حماده',description:'لعبة سباق تفاعلية للمتابعين في البث المباشر، تتقدم فيها المشاركات واللايكات والهدايا داخل مركز ألعاب حماده.'},
  {key:'الكراسي الموسيقية',slug:'musical-chairs',file:'musical-chairs.html',name:'الكراسي الموسيقية',title:'لعبة الكراسي للمتابعين | مركز ألعاب حماده',description:'لعبة كراسي موسيقية تفاعلية للبث المباشر مع انضمام المتابعين والإقصاء وإعلان الفائز.'},
  {key:'شقلب واقلب',slug:'flip-turn',file:'flip-turn.html',name:'شقلب واقلب',title:'شقلب واقلب للبث المباشر | مركز ألعاب حماده',description:'لعبة تفاعلية سريعة للمتابعين تعتمد على الاختيارات والنقاط والمفاجآت أثناء البث المباشر.'},
  {key:'لعبة المحيبس',slug:'mohaibes',file:'mohaibes.html',name:'لعبة المحيبس',title:'لعبة المحيبس للبث المباشر | مركز ألعاب حماده',description:'لعبة المحيبس العراقية التفاعلية للمتابعين في TikTok LIVE مع الكفوف والخاتم والجولات المباشرة.'},
  {key:'لعبة الجزائيات',slug:'penalties',file:'penalties.html',name:'لعبة الجزائيات',title:'لعبة الجزائيات للمتابعين | مركز ألعاب حماده',description:'تحدي ركلات جزاء تفاعلي للمتابعين في البث المباشر مع الحارس والتسديدات والنتائج.'},
  {key:'تحدي الأكواب الخمسة',slug:'cups',file:'cups.html',name:'تحدي الأكواب',title:'تحدي الأكواب للبث المباشر | مركز ألعاب حماده',description:'لعبة أكواب تفاعلية للمتابعين، تابع الخلط وخمّن مكان الكرة أثناء البث المباشر.'},
  {key:'شد الحبل - بنات ضد شباب',slug:'tug-war',file:'tug-war.html',name:'شد الحبل',title:'شد الحبل بنات ضد شباب | مركز ألعاب حماده',description:'مواجهة تفاعلية بين فريق البنات وفريق الشباب تعتمد على تفاعل المتابعين واللايكات أثناء البث.'},
  {key:'القنبلة الموقوتة',slug:'bomb',file:'bomb.html',name:'القنبلة الموقوتة',title:'القنبلة الموقوتة للمتابعين | مركز ألعاب حماده',description:'لعبة قنبلة موقوتة تفاعلية للبث المباشر، يمررها المتابعون قبل انتهاء الوقت.'},
  {key:'متاهة حماده',slug:'maze',file:'maze.html',name:'متاهة حماده',title:'متاهة تفاعلية للمتابعين | مركز ألعاب حماده',description:'سباق متابعين داخل متاهة تفاعلية، يتحرك اللاعبون بالتعليقات للوصول إلى بوابة الفوز.'},
  {key:'تحدي الحروف',slug:'challenge-letters',file:'challenge-letters.html',name:'تحدي الحروف',title:'تحدي الحروف للبث المباشر | مركز ألعاب حماده',description:'تحدي كلمات وحروف تفاعلي وسريع للمتابعين في البث المباشر.'},
  {key:'لعبة الأحرف 300',slug:'letters-300',file:'letters-300.html',name:'لعبة الأحرف 300',title:'300 سؤال وحروف للبث | مركز ألعاب حماده',description:'لعبة 300 سؤال وأجوبة بالحروف للجولات التفاعلية مع المتابعين في البث المباشر.'},
  {key:'تحدي الشباب والبنات',slug:'boys-girls',file:'boys-girls.html',name:'تحدي الشباب والبنات',title:'تحدي الشباب والبنات للبث | مركز ألعاب حماده',description:'معركة تفاعلية بين الشباب والبنات تعتمد على تفاعل الجمهور واللايكات في البث المباشر.'},
  {key:'تحدي التخمين',slug:'guessing',file:'guessing.html',name:'تحدي التخمين',title:'لعبة التخمين للمتابعين | مركز ألعاب حماده',description:'أسئلة تخمين تفاعلية وسريعة تشمل دول وأكلات ومدن وأسماء ولاعبين للمتابعين في البث.'},
  {key:'جلك حماده',slug:'jalak',file:'jalak.html',name:'جلك',title:'لعبة جلك التفاعلية | مركز ألعاب حماده',description:'لعبة جلك للاعبين والمتابعين مع جولات مباشرة وربط تفاعلي بالبث.'},
  {key:'السلم والثعبان',slug:'snakes-ladders',file:'snakes-ladders.html',name:'السلم والثعبان',title:'السلم والثعبان للمتابعين | مركز ألعاب حماده',description:'لعبة سلم وثعبان تفاعلية مع النرد واللاعبين من البث المباشر.'},
  {key:'روليت أعلامنا',slug:'flags-roulette',file:'flags-roulette.html',name:'روليت أعلامنا',title:'روليت الأعلام للمتابعين | مركز ألعاب حماده',description:'روليت أعلام تفاعلي للاختيار والتحديات مع المتابعين أثناء البث المباشر.'},
  {key:'روليت الجوعانين',slug:'hungry-roulette',file:'hungry-roulette.html',name:'روليت الجوعانين',title:'روليت الجوعانين والأكلات | مركز ألعاب حماده',description:'روليت أكلات عراقية تفاعلي للمتابعين في البث المباشر مع الإقصاء والاختيارات.'},
  {key:'طاولي حماده',slug:'backgammon',file:'backgammon.html',name:'طاولي حماده',title:'لعبة الطاولي للمتابعين | مركز ألعاب حماده',description:'لعبة طاولي تفاعلية للعب المباشر مع المتابعين والنرد والحجر.'},
  {key:'طبقها',slug:'match-it',file:'match-it.html',name:'طبقها',title:'لعبة المطابقة للمتابعين | مركز ألعاب حماده',description:'لعبة مطابقة بطاقات وذاكرة تفاعلية بتحديات سريعة للمتابعين أثناء البث.'},
  {key:'لودو حماده',slug:'ludo',file:'ludo.html',name:'لودو حماده',title:'لودو تفاعلية للمتابعين | مركز ألعاب حماده',description:'لعبة لودو تفاعلية مع النرد والحركة والتحكم من المتابعين في البث المباشر.'}
];
const GAME_BY_SLUG = new Map(GAME_SEO.map(g => [g.slug, g]));
const GAME_BY_KEY = new Map(GAME_SEO.map(g => [g.key, g]));

function gameLandingHtml(game) {
  const canonical = SITE_ORIGIN + '/play/' + game.slug;
  const schema = JSON.stringify({
    '@context':'https://schema.org','@type':'VideoGame',
    name:game.name,url:canonical,description:game.description,
    gamePlatform:'Web browser',inLanguage:'ar-IQ',
    isPartOf:{'@type':'WebSite',name:'مركز ألعاب حماده',url:SITE_ORIGIN+'/'}
  }).replace(/</g,'\\u003c');
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${game.title}</title><meta name="description" content="${game.description}"><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="ar_IQ"><meta property="og:title" content="${game.title}"><meta property="og:description" content="${game.description}"><meta property="og:url" content="${canonical}"><script type="application/ld+json">${schema}</script><style>*{box-sizing:border-box}body{margin:0;background:#070706;color:#fff;font-family:Tahoma,Arial,sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px}.box{width:min(820px,100%);background:#11100d;border:1px solid #765623;border-radius:22px;padding:34px;box-shadow:0 24px 70px #000}.crumb{color:#c9ad70;font-size:14px}.crumb a{color:#f2d589}h1{color:#ffe49a;font-size:clamp(28px,5vw,44px);margin:18px 0 12px}p{color:#d0c5ae;line-height:2;font-size:17px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}.btn{display:inline-block;padding:13px 20px;border-radius:12px;text-decoration:none;font-weight:800}.primary{background:#e9b84f;color:#171006}.secondary{border:1px solid #826126;color:#f5dda3}.more{margin-top:28px;padding-top:20px;border-top:1px solid #3c321f;color:#a99b80;font-size:14px}</style></head><body><main class="box"><div class="crumb"><a href="/">مركز ألعاب حماده</a> ← ${game.name}</div><h1>${game.name}</h1><p>${game.description}</p><p>هذه اللعبة جزء من مجموعة ألعاب تفاعلية مصممة للبث المباشر وتفاعل الجمهور من التعليقات واللايكات والهدايا.</p><div class="actions"><a class="btn primary" href="/games/${game.file}">تشغيل اللعبة</a><a class="btn secondary" href="/">عرض جميع الألعاب</a></div><div class="more">ألعاب تيك توك لايف • ألعاب للمتابعين • ألعاب تفاعلية للبث المباشر</div></main></body></html>`;
}


function avatarOf(u = {}) {
  const candidates = [u.profilePictureUrl, u.avatarUrl, u.avatarThumb, u.avatarMedium, u.avatarLarger, u.profilePicture];
  for (const v of candidates) {
    if (typeof v === 'string' && v) return v;
    if (Array.isArray(v) && v.length) {
      const x = v[0];
      if (typeof x === 'string') return x;
      if (x?.url) return x.url;
    }
    if (v?.url) return v.url;
  }
  const arr = u.profilePictureUrls;
  if (Array.isArray(arr) && arr.length) {
    const x = arr[0];
    return typeof x === 'string' ? x : (x?.url || '');
  }
  return '';
}
function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function normalized(event, d = {}) {
  const u = d.user || {};
  const uniqueId = String(u.uniqueId || d.uniqueId || d.userUniqueId || '');
  const userId = String(u.userId || u.id || d.userId || uniqueId || '');
  const nickname = String(u.nickname || d.nickname || d.displayName || uniqueId || 'متابع');
  const avatar = avatarOf(u) || avatarOf(d);
  const giftDetails = d.giftDetails || d.extendedGiftInfo || d.gift || {};
  const giftId = d.giftId ?? giftDetails.giftId ?? giftDetails.id;
  const giftName = String(giftDetails.giftName || giftDetails.name || d.giftName || '');
  const diamondCount = num(giftDetails.diamondCount ?? giftDetails.diamonds ?? d.diamondCount ?? d.diamonds, 0);
  const repeatCount = num(d.repeatCount ?? d.count, 1);
  return {
    type: 'event', event, ts: Date.now(),
    data: {
      uniqueId, userId, nickname, profilePictureUrl: avatar,
      user: { uniqueId, userId, nickname, profilePictureUrl: avatar },
      comment: String(d.comment || d.commentText || d.text || d.message || ''),
      commentText: String(d.comment || d.commentText || d.text || d.message || ''),
      likeCount: num(d.likeCount ?? d.count ?? d.likes, 1),
      totalLikeCount: num(d.totalLikeCount, 0),
      repeatCount, repeatEnd: d.repeatEnd,
      giftId, giftName, diamondCount,
      gift: { id: giftId, name: giftName, diamondCount, repeatCount },
      memberCount: num(d.memberCount, 0), viewerCount: num(d.viewerCount, 0),
      action: d.action || '', displayType: d.displayType || '', label: d.label || '',
      shareType: d.shareType || '', shareTarget: d.shareTarget || ''
    }
  };
}

class LiveSession {
  constructor(ws) {
    this.ws = ws;
    this.live = null;
    this.username = '';
    this.roomId = '';
    this.generation = 0;
    this.timer = null;
    this.retryCount = 0;
    this.autoReconnect = true;
    this.closed = false;
    this.status = { type:'status', state:'disconnected', username:'', roomId:'', message:'غير متصل', ts:Date.now() };
  }
  send(obj) { if (this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); }
  setStatus(state, extra = {}) {
    this.status = { type:'status', state, username:this.username, roomId:this.roomId, ts:Date.now(), ...extra };
    this.send(this.status);
  }
  emit(event, d) { this.send(normalized(event, d)); }
  clearTimer() { if (this.timer) clearTimeout(this.timer); this.timer = null; }
  scheduleReconnect(reason='انقطع الاتصال') {
    if (this.closed || !this.autoReconnect || !this.username) return;
    this.clearTimer();
    this.retryCount += 1;
    const delay = Math.min(30000, 2500 * Math.max(1, this.retryCount));
    this.setStatus('reconnecting', { message:`${reason} — إعادة المحاولة تلقائيًا`, retryInMs:delay, attempt:this.retryCount });
    this.timer = setTimeout(() => this.connect(this.username, true).catch(() => {}), delay);
  }
  bind(conn, gen) {
    const events = ['chat','gift','like','member','follow','share','social','roomUser','subscribe','questionNew','envelope'];
    for (const ev of events) conn.on(ev, d => {
      if (gen !== this.generation || this.closed) return;
      this.emit(ev, d);
      if (ev === 'social') {
        const hay = [d?.action,d?.displayType,d?.label,d?.shareType,d?.logId].filter(Boolean).join(' ').toLowerCase();
        if (hay.includes('follow')) this.emit('follow', d);
        if (hay.includes('share')) this.emit('share', d);
      }
    });
    conn.on('streamEnd', d => {
      if (gen !== this.generation || this.closed) return;
      this.emit('streamEnd', d || {});
      this.setStatus('offline', { message:'انتهى البث المباشر' });
      this.scheduleReconnect('انتهى البث أو تغيّرت الجلسة');
    });
    conn.on('error', err => {
      if (gen !== this.generation || this.closed) return;
      this.setStatus('error', { message:String(err?.info || err?.message || err || 'خطأ في اتصال TikTok') });
    });
    conn.on('disconnected', () => {
      if (gen !== this.generation || this.closed) return;
      this.live = null; this.roomId = '';
      this.scheduleReconnect('انقطع اتصال TikTok');
    });
  }
  async disconnect(manual = false) {
    this.clearTimer();
    this.generation += 1;
    const old = this.live; this.live = null; this.roomId = '';
    if (manual) { this.autoReconnect = false; this.username = ''; this.retryCount = 0; }
    if (old) { try { await old.disconnect(); } catch {} }
    if (manual && !this.closed) this.setStatus('disconnected', { username:'', roomId:'', message:'غير متصل' });
  }
  async connect(name, isRetry = false) {
    const clean = String(name || '').trim().replace(/^@+/, '');
    if (!clean || clean.length > 64 || !/^[\w.]+$/u.test(clean)) throw new Error('يوزر TikTok غير صالح');
    this.clearTimer(); this.username = clean; this.autoReconnect = true;
    const gen = ++this.generation;
    const old = this.live; this.live = null; this.roomId = '';
    if (old) { try { await old.disconnect(); } catch {} }
    this.setStatus(isRetry ? 'reconnecting' : 'connecting', { message:isRetry ? `إعادة الاتصال ببث @${clean}…` : `جاري الاتصال ببث @${clean}…`, attempt:this.retryCount });
    const conn = new TikTokLiveConnection(clean, { processInitialData:false, fetchRoomInfoOnConnect:true, enableExtendedGiftInfo:false });
    this.live = conn; this.bind(conn, gen);
    try {
      const state = await conn.connect();
      if (gen !== this.generation || this.closed) return;
      this.roomId = String(state?.roomId || conn.roomId || ''); this.retryCount = 0;
      this.setStatus('connected', { message:`متصل ببث @${clean}` });
    } catch (err) {
      if (gen !== this.generation || this.closed) return;
      this.live = null; this.roomId = '';
      const msg = String(err?.message || err || '');
      const offline = /offline|not live|useroffline|room.*not.*found/i.test(msg);
      if (offline) { this.setStatus('offline', { message:`الحساب @${clean} ليس في بث مباشر الآن` }); this.scheduleReconnect('البث غير متاح الآن'); }
      else { this.setStatus('error', { message:`تعذر الاتصال بالبث: ${msg}` }); this.scheduleReconnect('فشل الاتصال'); }
      try { await conn.disconnect(); } catch {}
    }
  }
  async close() { this.closed = true; this.autoReconnect = false; await this.disconnect(false); }
}

function prepareCenterHtml(data) {
  let html = data.toString('utf8');
  html = html.replace(
    '<title>مركز ألعاب حماده</title>',
    '<title>مركز ألعاب حماده | ألعاب تفاعلية للبث المباشر</title>'
  );
  html = html.replace(/\.entryCard h1/g, '.entryCard h2');
  html = html.replace(
    '<h1>مركز ألعاب حماده</h1>',
    '<h2>مركز ألعاب حماده</h2>'
  );
  html = html.replace(
    '<div><strong>مطور الألعاب: حماده</strong></div>',
    '<div><strong>مطور الألعاب: حماده</strong><span style="margin-right:10px;font-size:11px"><a href="/guide/tiktok-live-games.html" style="color:#d9bd7d">ألعاب تيك توك لايف</a> · <a href="/guide/live-stream-games.html" style="color:#d9bd7d">ألعاب للبث المباشر</a> · <a href="/guide/mohaibes-live.html" style="color:#d9bd7d">المحيبس للبث</a></span></div>'
  );
  return html;
}

const sessions = new Set();
const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/' || url === '/index.html' || url === '/center') {
    fs.readFile(CENTER_FILE, (err, data) => {
      if (err) { res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Center file not found'); return; }
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate','X-Content-Type-Options':'nosniff'});
      res.end(prepareCenterHtml(data));
    });
    return;
  }
  if (url.startsWith('/guide/')) {
    const rel = decodeURIComponent(url.slice('/guide/'.length));
    if (!/^[A-Za-z0-9._-]+\.html$/.test(rel)) { res.writeHead(400); res.end('Bad request'); return; }
    const file = path.join(__dirname, 'guide', rel);
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Guide not found'); return; }
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'});
      res.end(data);
    });
    return;
  }
  if (url.startsWith('/play/')) {
    const slug = decodeURIComponent(url.slice('/play/'.length)).replace(/\/$/, '');
    const game = GAME_BY_SLUG.get(slug);
    if (!game) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Not found'); return; }
    const body = gameLandingHtml(game);
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=600','X-Content-Type-Options':'nosniff'});
    res.end(body);
    return;
  }
  if (url.startsWith('/games/')) {
    const rel = decodeURIComponent(url.slice('/games/'.length));
    if (!/^[A-Za-z0-9._-]+\.html$/.test(rel)) { res.writeHead(400); res.end('Bad request'); return; }
    const file = path.join(__dirname, 'games', rel);
    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Game not found'); return; }
      const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, follow','Vary':'Accept-Encoding'};
      const source = fs.createReadStream(file);
      if (String(req.headers['accept-encoding'] || '').includes('gzip')) {
        headers['Content-Encoding'] = 'gzip';
        res.writeHead(200, headers);
        source.pipe(zlib.createGzip({level:4})).pipe(res);
      } else {
        res.writeHead(200, headers);
        source.pipe(res);
      }
    });
    return;
  }
  if (url === '/robots.txt') {
    fs.readFile(ROBOTS_FILE, (err, data) => {
      if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Not found'); return; }
      res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'});
      res.end(data);
    });
    return;
  }
  if (url === '/sitemap.xml') {
    fs.readFile(SITEMAP_FILE, (err, data) => {
      if (err) { res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Not found'); return; }
      res.writeHead(200, {'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=3600'});
      res.end(data);
    });
    return;
  }
  if (url === '/health') {
    res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify({ ok:true, sessions:sessions.size, maxSessions:MAX_SESSIONS }));
    return;
  }
  res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}); res.end('Not found');
});

const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });
wss.on('connection', ws => {
  if (sessions.size >= MAX_SESSIONS) { ws.close(1013, 'Server busy'); return; }
  const session = new LiveSession(ws); sessions.add(session); session.send(session.status);
  ws.on('message', buf => {
    let m; try { m = JSON.parse(String(buf)); } catch { return; }
    if (m?.action === 'connect') session.connect(m.username, false).catch(err => session.setStatus('error', { message:String(err?.message || err) }));
    else if (m?.action === 'disconnect') session.disconnect(true).catch(() => {});
    else if (m?.action === 'status') session.send(session.status);
  });
  ws.on('close', () => { sessions.delete(session); session.close().catch(() => {}); });
  ws.on('error', () => {});
});

server.listen(PORT, HOST, () => console.log(`Game Center LIVE server listening on ${HOST}:${PORT}`));
