import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PORT=Number(process.env.PORT||3000);

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
  return s;
}

const server=http.createServer((req,res)=>{
  const pathname=(req.url||'/').split('?')[0];
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
