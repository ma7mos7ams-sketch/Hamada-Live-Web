import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { TikTokLiveConnection, SignConfig } from 'tiktok-live-connector';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const PORT = process.env.PORT || 8799;
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const musicDir = process.env.MUSIC_DIR || path.join(dataDir, 'music');
fs.mkdirSync(musicDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });
const prefsPath = path.join(dataDir, 'preferences.json');
const metaPath = path.join(musicDir, 'library.json');
function readLibrary(){ try{return JSON.parse(fs.readFileSync(metaPath,'utf8'))}catch{return []} }
function writeLibrary(items){ fs.writeFileSync(metaPath, JSON.stringify(items,null,2)); }
const upload = multer({ dest: musicDir, limits:{fileSize: 100*1024*1024} });

app.use(express.json());
const publicDir = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
app.use(express.static(publicDir));

app.use('/music', express.static(musicDir));

app.get('/api/music', (_req,res) => {
  const items = readLibrary().filter(x => fs.existsSync(path.join(musicDir, x.storageName))).map(x => ({...x, url:'/music/'+encodeURIComponent(x.storageName)}));
  res.json({ok:true, items});
});

app.post('/api/music', upload.single('file'), (req,res) => {
  try {
    if (!req.file) return res.status(400).json({ok:false,error:'اختر ملف صوتي'});
    const original = req.file.originalname || 'song';
    const ext = path.extname(original).toLowerCase();
    const safeExt = ['.mp3','.m4a','.wav','.ogg','.aac','.webm'].includes(ext) ? ext : '.bin';
    const storageName = req.file.filename + safeExt;
    fs.renameSync(req.file.path, path.join(musicDir, storageName));
    const title = String(req.body?.title || path.basename(original, ext)).trim() || path.basename(original, ext);
    const items = readLibrary();
    const item = {id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title,filename:original,storageName,createdAt:Date.now()};
    items.push(item); writeLibrary(items);
    res.json({ok:true,item:{...item,url:'/music/'+encodeURIComponent(storageName)}});
  } catch(e) { res.status(500).json({ok:false,error:e?.message||String(e)}); }
});

app.post('/api/test', (req,res) => {
  const kind = String(req.body?.kind || '');
  const user = {username:'hamada_test',nickname:'Hamada Test',avatar:'https://api.dicebear.com/9.x/thumbs/svg?seed=Hamada',isModerator:true,isFollower:true};
  if (kind==='follow') { state.lastFollower=user; sendAll({type:'follow',user}); }
  else if (kind==='like') { state.lastLiker={...user,likes:321}; state.likes[user.username]=state.lastLiker; sendAll({type:'like',user:state.lastLiker,likes:321,count:20}); }
  else if (kind==='member') sendAll({type:'member',user,alert:true});
  else if (kind==='alert') sendAll({type:'action-alert',action:'likes',user,value:state.actionLikeThreshold||100});
  else if (kind==='tts') sendAll({type:'tts',user,text:'هذه تجربة للقارئ الصوتي'});
  emitState(); res.json({ok:true});
});


if (process.env.EULER_API_KEY) SignConfig.apiKey = process.env.EULER_API_KEY;
let connection = null;
const knownFollowers = new Set();
let currentUsername = '';
let connected = false;
let state = {
  likes: {},
  rankingSize: 5,
  lastFollower: null,
  lastLiker: null,
  actionLikeThreshold: 100,
  joinUsers: [],
  tts: { moderators: true, followers: false, users: [] },
  music: { moderators: true, users: [], volume: 10, paused: false }
};
try {
  const prefs = JSON.parse(fs.readFileSync(prefsPath,'utf8'));
  if (prefs && typeof prefs === 'object') {
    state.rankingSize = prefs.rankingSize ?? state.rankingSize;
    state.actionLikeThreshold = prefs.actionLikeThreshold ?? state.actionLikeThreshold;
    state.joinUsers = Array.isArray(prefs.joinUsers) ? prefs.joinUsers : state.joinUsers;
    state.tts = { ...state.tts, ...(prefs.tts || {}) };
    state.music = { ...state.music, ...(prefs.music || {}), paused:false };
  }
} catch {}
function savePrefs(){
  const prefs = { rankingSize:state.rankingSize, actionLikeThreshold:state.actionLikeThreshold, joinUsers:state.joinUsers, tts:state.tts, music:{...state.music,paused:false} };
  try { fs.writeFileSync(prefsPath, JSON.stringify(prefs,null,2)); } catch {}
}

function sendAll(payload) {
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

function firstUrl(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') return c;
    if (Array.isArray(c) && c.length) {
      const v = c.find(x => typeof x === 'string'); if (v) return v;
    }
    if (Array.isArray(c?.urlList) && c.urlList.length) return c.urlList[0];
    if (Array.isArray(c?.urls) && c.urls.length) return c.urls[0];
  }
  return '';
}
function safeUser(evt) {
  const u = evt?.user || evt || {};
  const username = u?.uniqueId || evt?.uniqueId || '';
  const followStatus = Number(u?.followInfo?.followStatus ?? u?.followStatus ?? 0);
  return {
    id: u?.userId || evt?.userId || username,
    username,
    nickname: u?.nickname || evt?.nickname || username || 'TikTok User',
    avatar: firstUrl(u?.profilePictureUrl, u?.profilePictureUrls, u?.avatarThumb, u?.avatarMedium, u?.avatarLarger, evt?.profilePictureUrl),
    isModerator: !!(u?.isModerator || evt?.isModerator || u?.moderator),
    isFollower: knownFollowers.has(String(username).toLowerCase()) || followStatus > 0 || !!u?.isFollower
  };
}

function rank() {
  return Object.values(state.likes)
    .sort((a,b) => b.likes-a.likes)
    .slice(0, Math.max(1, Math.min(5, state.rankingSize)));
}

function emitState() {
  sendAll({ type:'state', connected, username: currentUsername, state: { ...state, ranking: rank() } });
}

async function disconnectTikTok() {
  if (connection) {
    try { await connection.disconnect(); } catch {}
  }
  connection = null;
  connected = false;
  currentUsername = '';
  emitState();
}

async function connectTikTok(username) {
  username = String(username || '').trim().replace(/^@/, '');
  if (!username) throw new Error('اكتب اسم حساب TikTok');
  await disconnectTikTok();
  currentUsername = username;
  state.likes = {}; state.lastFollower = null; state.lastLiker = null;
  const conn = new TikTokLiveConnection(username, {
    processInitialData: false,
    enableExtendedGiftInfo: true
  });
  connection = conn;

  conn.on('connected', () => {
    connected = true;
    sendAll({ type:'status', connected:true, username });
    emitState();
  });
  conn.on('disconnected', () => {
    connected = false;
    sendAll({ type:'status', connected:false, username });
  });
  conn.on('error', err => { const msg = err?.exception?.message || err?.info || err?.message || String(err); sendAll({ type:'error', message: msg }); });

  conn.on('follow', evt => {
    const user = safeUser(evt);
    if (user.username) knownFollowers.add(user.username.toLowerCase());
    user.isFollower = true;
    state.lastFollower = user;
    sendAll({ type:'follow', user });
    emitState();
  });

  conn.on('like', evt => {
    const user = safeUser(evt);
    const count = Number(evt?.likeCount || 1);
    const key = user.username || user.id || Math.random().toString(36);
    const previous = state.likes[key]?.likes || 0;
    const likes = previous + Math.max(1, count);
    state.likes[key] = { ...user, likes };
    state.lastLiker = { ...user, likes };
    sendAll({ type:'like', user: state.lastLiker, count, likes });
    if (likes >= Number(state.actionLikeThreshold || 0) && Number(state.actionLikeThreshold || 0) > 0) {
      const lastAlert = state.likes[key].lastAlertAt || 0;
      if (Date.now() - lastAlert > 30000) {
        state.likes[key].lastAlertAt = Date.now();
        sendAll({ type:'action-alert', action:'likes', user: state.lastLiker, value: likes });
      }
    }
    emitState();
  });

  conn.on('member', evt => {
    const user = safeUser(evt);
    const allow = state.joinUsers.map(x=>String(x).toLowerCase()).includes((user.username||'').toLowerCase());
    sendAll({ type:'member', user, alert: allow });
    if (allow) sendAll({ type:'action-alert', action:'member', user, value:0 });
  });

  conn.on('chat', evt => {
    const user = safeUser(evt);
    const comment = String(evt?.comment || '').trim();
    const allowedTts = (state.tts.moderators && user.isModerator) ||
      (state.tts.followers && user.isFollower) ||
      state.tts.users.map(x=>x.toLowerCase()).includes((user.username||'').toLowerCase());
    if (allowedTts && comment) sendAll({ type:'tts', user, text: comment });

    const musicAllowed = (state.music.moderators && user.isModerator) ||
      state.music.users.map(x=>x.toLowerCase()).includes((user.username||'').toLowerCase());
    if (musicAllowed && comment.startsWith('!')) {
      const c = comment.replace(/\s+/g,' ').trim();
      if (/^!تشغيل(?:\s*\+)?\s*/.test(c)) {
        const q = c.replace(/^!تشغيل(?:\s*\+)?\s*/, '').trim();
        sendAll({ type:'music-command', command:'play', query:q, user });
      } else if (/^!صوت\s*\d+/.test(c)) {
        const v = Math.max(0, Math.min(100, Number(c.match(/\d+/)?.[0] || 10)));
        state.music.volume = v;
        sendAll({ type:'music-command', command:'volume', value:v, user });
        emitState();
      } else if (/^!تخطي/.test(c)) {
        sendAll({ type:'music-command', command:'skip', user });
      } else if (/^!إ?يقاف\s+مؤقت/.test(c)) {
        state.music.paused = true;
        sendAll({ type:'music-command', command:'pause', user });
        emitState();
      } else if (/^!إ?يقاف/.test(c)) {
        state.music.paused = false;
        sendAll({ type:'music-command', command:'stop', user });
        emitState();
      }
    }
    sendAll({ type:'chat', user, comment });
  });

  const info = await conn.connect();
  connected = true;
  emitState();
  return info;
}

app.post('/api/connect', async (req,res) => {
  try {
    const info = await connectTikTok(req.body.username);
    res.json({ ok:true, connected:true, username: currentUsername, roomId: info?.roomId || null });
  } catch (e) {
    connected = false;
    res.status(500).json({ ok:false, error:e?.message || String(e) });
  }
});

app.post('/api/disconnect', async (_req,res) => {
  await disconnectTikTok();
  res.json({ ok:true });
});

app.post('/api/settings', (req,res) => {
  const next = req.body || {};
  if (next.rankingSize != null) state.rankingSize = Math.max(1,Math.min(5,Number(next.rankingSize)||5));
  if (next.actionLikeThreshold != null) state.actionLikeThreshold = Math.max(0,Number(next.actionLikeThreshold)||0);
  if (Array.isArray(next.joinUsers)) state.joinUsers = next.joinUsers.map(x=>String(x).trim().replace(/^@/,'')).filter(Boolean);
  if (next.tts) state.tts = { ...state.tts, ...next.tts, users: Array.isArray(next.tts.users) ? next.tts.users : state.tts.users };
  if (next.music) state.music = { ...state.music, ...next.music, users: Array.isArray(next.music.users) ? next.music.users : state.music.users };
  savePrefs();
  emitState();
  res.json({ ok:true, state: { ...state, ranking: rank() } });
});

app.get('/api/state', (_req,res) => res.json({ ok:true, connected, username: currentUsername, state: { ...state, ranking: rank() } }));
app.get('/health', (_req,res) => res.json({ ok:true, connected, username: currentUsername }));
app.get('/overlay', (_req,res) => res.sendFile(path.join(publicDir, 'overlay.html')));

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type:'state', connected, username: currentUsername, state:{...state, ranking: rank()} }));
  ws.on('message', data => {
    const msg = String(data || '');
    if (msg === 'ping') { try { ws.send(JSON.stringify({type:'pong'})); } catch {} }
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Hamada Live Web running on :${PORT}`));
