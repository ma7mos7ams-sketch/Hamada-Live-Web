import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||3000);
const NUMBER_SETTINGS_FILE=path.join(__dirname,'number-settings.js');
const MUSIC_DIR=path.join(__dirname,'music');

function gameSource(){
  const names=fs.readdirSync(__dirname).filter(n=>/\.html$/i.test(n) && n!=='seo-preview.html');
  const direct=names.find(n=>/محيبس/i.test(n)) || names[0] || null;
  if(direct) return {kind:'file',name:direct,path:path.join(__dirname,direct)};

  const partsDir=path.join(__dirname,'index.parts');
  if(fs.existsSync(partsDir)){
    const parts=fs.readdirSync(partsDir)
      .filter(n=>/^part-\d+\.txt$/i.test(n))
      .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))
      .map(n=>path.join(partsDir,n));
    if(parts.length) return {kind:'parts',name:'index.parts',parts};
  }
  return null;
}
let partsCache=null;
let partsCacheKey='';
function readGameSource(source,cb){
  if(!source) return cb(new Error('No game source'));
  if(source.kind==='file') return fs.readFile(source.path,cb);
  try{
    const key=source.parts.map(p=>p+':'+fs.statSync(p).mtimeMs+':'+fs.statSync(p).size).join('|');
    if(!partsCache || partsCacheKey!==key){
      partsCache=Buffer.concat(source.parts.map(p=>fs.readFileSync(p)));
      partsCacheKey=key;
    }
    cb(null,partsCache);
  }catch(err){cb(err);}
}
function origin(req){
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers.host||'').trim();
  return host?proto+'://'+host:'';
}
function enhance(html,base){
  let s=html.toString('utf8');
  const meta=[
    '<meta name="description" content="لعبة المحيبس العراقية التفاعلية للبث المباشر والمتابعين من حماده، مع الكفوف والخاتم والجولات المباشرة.">',
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">',
    base?'<link rel="canonical" href="'+base+'/">':'',
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="ar_IQ">',
    '<meta property="og:title" content="لعبة المحيبس للبث المباشر | حماده">',
    '<meta property="og:description" content="لعبة المحيبس العراقية التفاعلية للبث المباشر والمتابعين.">',
    base?'<meta property="og:url" content="'+base+'/">':''
  ].join('');
  if(!/name=["']description["']/i.test(s)) s=s.replace(/<head([^>]*)>/i,'<head$1>'+meta);
  s=s.replace(/<title>\s*لعبة المحيبس\s*<\/title>/i,'<title>لعبة المحيبس للبث المباشر | حماده</title>');
  if(!s.includes('/number-settings.js')) s += '\n<script src="/number-settings.js?v=2"></script>\n';
  if(!s.includes('hamadaPlaylistV1')) s += "\\n<script id=\"hamadaPlaylistV1\">\n(()=>{\n  const NEW_TRACKS=[\n    {value:'qali_ya_hilo',label:'قلي ياحلو',src:'/music/qali-ya-hilo.mp3'},\n    {value:'foug_al_nakhal',label:'ناظم الغزالي - فوك النخل',src:'/music/foug-al-nakhal.mp3'},\n    {value:'ahya_wa_amoot_basra',label:'أحيا وأموت عالبصرة',src:'/music/ahya-wa-amoot-basra.mp3'},\n    {value:'mink_ya_asmar',label:'حسين الأعظمي - منك يا الأسمر',src:'/music/mink-ya-asmar.mp3'}\n  ];\n  const byValue=new Map(NEW_TRACKS.map(t=>[t.value,t]));\n  function init(){\n    const select=document.getElementById('musicTrackSelect');\n    const audio=document.getElementById('bgMusic');\n    if(!select||!audio) return setTimeout(init,350);\n    if(select.dataset.hamadaPlaylistReady==='1') return;\n    select.dataset.hamadaPlaylistReady='1';\n\n    const noLoop=()=>{audio.loop=false;audio.removeAttribute('loop');};\n    noLoop();\n\n    Promise.all(NEW_TRACKS.map(async t=>{\n      try{\n        const r=await fetch(t.src,{method:'HEAD',cache:'no-store'});\n        if(!r.ok) return;\n        if(!select.querySelector('option[value=\"'+t.value+'\"]')){\n          const o=document.createElement('option');\n          o.value=t.value;o.textContent=t.label;select.appendChild(o);\n        }\n      }catch(_){}\n    }));\n\n    function playExternal(t){\n      noLoop();\n      const vol=document.getElementById('musicVolumeRange');\n      if(vol) audio.volume=Math.max(0,Math.min(1,Number(vol.value||20)/100));\n      if(audio.getAttribute('src')!==t.src){\n        audio.src=t.src;audio.load();\n      }\n      const p=audio.play();\n      if(p&&p.catch) p.catch(()=>{});\n    }\n\n    select.addEventListener('change',e=>{\n      const t=byValue.get(select.value);\n      if(t){\n        e.stopImmediatePropagation();\n        playExternal(t);\n      }else{\n        audio.removeAttribute('src');\n        setTimeout(noLoop,0);\n        setTimeout(noLoop,120);\n      }\n    },true);\n\n    audio.addEventListener('play',noLoop,true);\n    audio.addEventListener('loadedmetadata',noLoop,true);\n    audio.addEventListener('ended',()=>{\n      const values=[...select.options].map(o=>o.value);\n      if(!values.length) return;\n      let i=values.indexOf(select.value);\n      const next=values[(i<0?0:i+1)%values.length];\n      select.value=next;\n      const t=byValue.get(next);\n      if(t){\n        playExternal(t);\n      }else{\n        audio.removeAttribute('src');\n        select.dispatchEvent(new Event('change',{bubbles:true}));\n        setTimeout(noLoop,0);\n        setTimeout(noLoop,120);\n        setTimeout(()=>{const p=audio.play();if(p&&p.catch)p.catch(()=>{});},160);\n      }\n    });\n  }\n  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});\n  else init();\n})();\n</script>\\n";
  return s;
}

const server=http.createServer((req,res)=>{
  const pathname=(req.url||'/').split('?')[0];
  if(pathname.startsWith('/music/')){
    let name='';
    try{name=decodeURIComponent(pathname.slice('/music/'.length));}catch(_){name='';}
    if(!name || name!==path.basename(name)){
      res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end('Bad request');return;
    }
    const file=path.join(MUSIC_DIR,name);
    fs.stat(file,(stErr,st)=>{
      if(stErr||!st.isFile()){
        res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Not found');return;
      }
      const ext=path.extname(name).toLowerCase();
      const type=ext==='.ogg'?'audio/ogg':ext==='.m4a'||ext==='.mp4'?'audio/mp4':'audio/mpeg';
      const headers={'Content-Type':type,'Content-Length':st.size,'Accept-Ranges':'bytes','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'};
      if(req.method==='HEAD'){res.writeHead(200,headers);res.end();return;}
      fs.readFile(file,(err,data)=>{if(err){res.writeHead(500);res.end('Read error');return;}res.writeHead(200,headers);res.end(data);});
    });
    return;
  }
  if(pathname==='/number-settings.js'){
    fs.readFile(NUMBER_SETTINGS_FILE,(err,data)=>{
      if(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
      res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      res.end(data);
    });
    return;
  }
  if(pathname==='/health'){
    const src=gameSource();
    res.writeHead(src?200:503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    res.end(JSON.stringify({ok:!!src,file:src?.name||null,source:src?.kind||null,parts:src?.parts?.length||0}));
    return;
  }
  if(pathname==='/robots.txt'){
    const base=origin(req);
    res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'});
    res.end('User-agent: *\nAllow: /\n\nSitemap: '+base+'/sitemap.xml\n');
    return;
  }
  if(pathname==='/sitemap.xml'){
    const base=origin(req);
    res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=3600'});
    res.end('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+base+'/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>');
    return;
  }
  if(pathname!=='/' && pathname!=='/index.html'){
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;
  }
  const src=gameSource();
  if(!src){
    res.writeHead(503,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>لعبة المحيبس</title><body style="background:#070707;color:#fff;font-family:Tahoma;padding:40px"><h1>لعبة المحيبس</h1><p>ملف اللعبة أو أجزاؤه غير موجودة.</p></body></html>');
    return;
  }
  readGameSource(src,(err,data)=>{
    if(err){res.writeHead(500);res.end('Read error');return;}
    const body=Buffer.from(enhance(data,origin(req)),'utf8');
    const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=300','Vary':'Accept-Encoding','X-Content-Type-Options':'nosniff'};
    if(String(req.headers['accept-encoding']||'').includes('gzip')){
      zlib.gzip(body,{level:4},(e,out)=>{if(e){res.writeHead(500);res.end('Compression error');return;}headers['Content-Encoding']='gzip';res.writeHead(200,headers);res.end(out);});
    }else{res.writeHead(200,headers);res.end(body);}
  });
});
server.listen(PORT,'0.0.0.0',()=>console.log('Standalone Mohaibes server listening on '+PORT));
