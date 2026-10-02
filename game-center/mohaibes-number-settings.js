(function(){
  const KEY='muhibisNumberStyleV1';
  const defaults={visible:true,pos:'bottom',shape:'pill',motion:'none',size:52,color:'#160f04',bg:'#e0b84f',transparent:false,x:0,y:0};
  let state={...defaults};
  try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){}
  const q=s=>document.querySelector(s);
  const css=String.raw\`
:root{--mnum-box:52px;--mnum-height:42px;--mnum-font:23px;--mnum-bg:#e0b84f;--mnum-color:#160f04;--mnum-x:0px;--mnum-y:0px}
body.mnum-hidden .hand .num{display:none!important}
.hand .num{width:var(--mnum-box)!important;height:var(--mnum-height)!important;min-width:0!important;min-height:0!important;font-size:var(--mnum-font)!important;color:var(--mnum-color)!important;background:var(--mnum-bg)!important;border:2px solid rgba(255,240,175,.8)!important;box-shadow:0 6px 16px #0009,0 0 16px rgba(224,184,79,.18)!important;display:flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;z-index:70!important;overflow:hidden!important;translate:var(--mnum-x) var(--mnum-y)!important;transition:left .22s ease,right .22s ease,top .22s ease,bottom .22s ease,width .22s ease,height .22s ease,border-radius .22s ease,background .22s ease,color .22s ease!important}
html[data-mnum-pos="bottom"] .hand .num{left:50%!important;right:auto!important;top:auto!important;bottom:11px!important;transform:translateX(-50%)!important}
html[data-mnum-pos="top"] .hand .num{left:50%!important;right:auto!important;top:10px!important;bottom:auto!important;transform:translateX(-50%)!important}
html[data-mnum-pos="right"] .hand .num{left:auto!important;right:10px!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important}
html[data-mnum-pos="left"] .hand .num{left:10px!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translateY(-50%)!important}
html[data-mnum-pos="strip"] .hand .num{left:50%!important;right:auto!important;top:auto!important;bottom:8px!important;transform:translateX(-50%)!important;width:min(72%,210px)!important;height:38px!important;border-radius:10px!important}
html[data-mnum-pos="image"] .hand .num{left:auto!important;right:15px!important;top:15px!important;bottom:auto!important;transform:rotate(-4deg)!important;width:54px!important;height:54px!important;border-radius:11px!important;font-size:27px!important;border:2px solid #ffe9a5!important;box-shadow:0 7px 18px #000b,0 0 0 3px rgba(255,235,170,.08)!important}
html[data-mnum-pos="custom"] .hand .num{left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%)!important}
html[data-mnum-shape="circle"] .hand .num{border-radius:50%!important;height:var(--mnum-box)!important}
html[data-mnum-shape="square"] .hand .num{border-radius:10px!important;height:var(--mnum-box)!important}
html[data-mnum-shape="pill"] .hand .num{border-radius:999px!important}
html[data-mnum-shape="plain"] .hand .num{border-radius:0!important;background:transparent!important;border:0!important;box-shadow:none!important;text-shadow:0 3px 10px #000!important}
@keyframes mnumPulse{0%{scale:1}100%{scale:1.10}}
@keyframes mnumFloat{0%,100%{margin-top:0}50%{margin-top:-7px}}
@keyframes mnumBounce{0%,100%{margin-top:0}45%{margin-top:-11px}65%{margin-top:-4px}}
@keyframes mnumGlow{0%,100%{filter:brightness(.96);box-shadow:0 6px 16px #0009,0 0 7px rgba(224,184,79,.18)}50%{filter:brightness(1.15);box-shadow:0 6px 16px #0009,0 0 24px rgba(255,219,121,.7)}}
html[data-mnum-motion="pulse"] .hand .num{animation:mnumPulse .72s ease-in-out infinite alternate!important}
html[data-mnum-motion="float"] .hand .num{animation:mnumFloat 1.4s ease-in-out infinite!important}
html[data-mnum-motion="bounce"] .hand .num{animation:mnumBounce 1.05s ease-in-out infinite!important}
html[data-mnum-motion="glow"] .hand .num{animation:mnumGlow 1.1s ease-in-out infinite!important}
html[data-mnum-motion="shine"] .hand .num:after{content:""!important;position:absolute!important;top:-35%!important;left:-65%;width:38%!important;height:170%!important;background:linear-gradient(90deg,transparent,rgba(255,255,255,.72),transparent)!important;transform:rotate(20deg)!important;animation:mnumShine 1.7s ease-in-out infinite!important;pointer-events:none!important}
@keyframes mnumShine{0%,28%{left:-65%;opacity:0}42%{opacity:1}68%,100%{left:135%;opacity:0}}
#mNumberSettingsBtn{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;cursor:pointer;flex:0 0 auto;border:1px solid rgba(239,200,93,.28);background:#11151dcc;color:#f0cc70;font-size:20px;box-shadow:0 5px 18px #0006}
#mNumberSettings{position:fixed;inset:0;z-index:25000;display:none;background:rgba(0,0,0,.62);backdrop-filter:blur(7px);align-items:center;justify-content:center;padding:18px}
#mNumberSettings.show{display:flex}
#mNumberSettings .mnsCard{width:min(620px,96vw);max-height:min(820px,92vh);overflow:auto;border-radius:24px;padding:18px;background:linear-gradient(180deg,#151923,#090b10);border:1px solid rgba(239,200,93,.34);box-shadow:0 28px 100px #000d;color:#fff;direction:rtl}
.mnsHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.mnsTitle{font-size:21px;font-weight:1000;color:#f1d582}.mnsSub{font-size:11px;color:#8e97a5;margin-top:3px}.mnsClose{border:0;background:#ffffff0d;color:#fff;width:36px;height:36px;border-radius:10px;font-size:20px;cursor:pointer}
.mnsGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.mnsField{display:grid;gap:6px;padding:10px;border-radius:14px;background:#ffffff06;border:1px solid #ffffff0c}.mnsField label{font-size:11px;color:#c8cfda;font-weight:800}.mnsField select,.mnsField input[type="range"]{width:100%}.mnsField select{background:#0a0d13;color:#fff;border:1px solid #ffffff16;border-radius:10px;padding:9px}.mnsRow{display:flex;align-items:center;gap:10px}.mnsRow input[type="color"]{width:44px;height:34px;border:0;background:transparent}.mnsValue{min-width:44px;text-align:center;color:#f0d079;font-weight:900;font-size:11px}.mnsCheck{display:flex;align-items:center;gap:8px;font-size:12px;color:#d8dde5}
.mnsPreview{margin:12px 0 2px;height:100px;display:grid;place-items:center;border-radius:16px;background:radial-gradient(circle,#20242e,#0b0d12);border:1px solid #ffffff0d;overflow:hidden}#mnsPreviewNum{display:grid;place-items:center;font-weight:1000;box-shadow:0 7px 18px #000a}.mnsActions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px}.mnsActions button{border:0;border-radius:12px;padding:11px 8px;font-weight:1000;cursor:pointer}#mnsSave{background:linear-gradient(180deg,#ffe89b,#c9952d);color:#171006}#mnsReset{background:#ffffff0d;color:#fff;border:1px solid #ffffff12}#mnsApply{background:#1b2740;color:#dbe8ff;border:1px solid #38517f}#mnsToast{height:18px;text-align:center;margin-top:8px;font-size:11px;color:#82e6ad}
@media(max-width:620px){.mnsGrid{grid-template-columns:1fr}.mnsActions{grid-template-columns:1fr}.mnsTitle{font-size:18px}}
\`;
  function clamp(n,a,b){n=Number(n);return Math.max(a,Math.min(b,Number.isFinite(n)?n:a))}
  function normalize(){
    const allow=(v,a,d)=>a.includes(v)?v:d;
    state.visible=state.visible!==false;
    state.pos=allow(state.pos,['bottom','top','right','left','strip','image','custom'],'bottom');
    state.shape=allow(state.shape,['circle','square','pill','plain'],'pill');
    state.motion=allow(state.motion,['none','pulse','float','bounce','glow','shine'],'none');
    state.size=clamp(state.size,34,90);state.x=clamp(state.x,-120,120);state.y=clamp(state.y,-120,120);
    if(!/^#[0-9a-f]{6}$/i.test(state.color))state.color=defaults.color;
    if(!/^#[0-9a-f]{6}$/i.test(state.bg))state.bg=defaults.bg;
  }
  function preview(){
    const e=q('#mnsPreviewNum');if(!e)return;const s=state.size;
    e.textContent='1';e.style.width=s+'px';e.style.height=(state.shape==='circle'||state.shape==='square'?s:Math.max(30,Math.round(s*.8)))+'px';
    e.style.fontSize=Math.max(18,Math.round(s*.47))+'px';e.style.color=state.color;e.style.background=state.transparent||state.shape==='plain'?'transparent':state.bg;
    e.style.border=state.shape==='plain'?'0':'2px solid rgba(255,255,255,.48)';e.style.borderRadius=state.shape==='circle'?'50%':state.shape==='square'?'10px':state.shape==='pill'?'999px':'0';e.style.opacity=state.visible?'1':'.22';
  }
  function apply(){
    normalize();const root=document.documentElement;
    root.dataset.mnumPos=state.pos;root.dataset.mnumShape=state.shape;root.dataset.mnumMotion=state.motion;
    root.style.setProperty('--mnum-box',state.size+'px');root.style.setProperty('--mnum-height',Math.max(30,Math.round(state.size*.8))+'px');root.style.setProperty('--mnum-font',Math.max(18,Math.round(state.size*.47))+'px');
    root.style.setProperty('--mnum-color',state.color);root.style.setProperty('--mnum-bg',state.transparent?'transparent':state.bg);root.style.setProperty('--mnum-x',state.x+'px');root.style.setProperty('--mnum-y',state.y+'px');
    document.body.classList.toggle('mnum-hidden',!state.visible);preview();
  }
  function values(){const t=(id,v)=>{const e=q(id);if(e)e.textContent=v};t('#mnsSizeVal',state.size+'px');t('#mnsXVal',state.x+'px');t('#mnsYVal',state.y+'px')}
  function read(){
    const e=id=>q(id);state.visible=!!e('#mnsVisible')?.checked;state.pos=e('#mnsPos')?.value||state.pos;state.shape=e('#mnsShape')?.value||state.shape;state.motion=e('#mnsMotion')?.value||state.motion;state.size=Number(e('#mnsSize')?.value||state.size);state.color=e('#mnsColor')?.value||state.color;state.bg=e('#mnsBg')?.value||state.bg;state.transparent=!!e('#mnsTransparent')?.checked;state.x=Number(e('#mnsX')?.value||0);state.y=Number(e('#mnsY')?.value||0);values();apply();
  }
  function fill(){
    const s=(id,v,p='value')=>{const e=q(id);if(e)e[p]=v};s('#mnsVisible',state.visible,'checked');s('#mnsPos',state.pos);s('#mnsShape',state.shape);s('#mnsMotion',state.motion);s('#mnsSize',state.size);s('#mnsColor',state.color);s('#mnsBg',state.bg);s('#mnsTransparent',state.transparent,'checked');s('#mnsX',state.x);s('#mnsY',state.y);values();preview();
  }
  function toast(m){const e=q('#mnsToast');if(!e)return;e.textContent=m;clearTimeout(toast.t);toast.t=setTimeout(()=>e.textContent='',1500)}
  function ui(){
    if(!q('#mNumberSettingsStyle')){const st=document.createElement('style');st.id='mNumberSettingsStyle';st.textContent=css;document.head.appendChild(st)}
    if(!q('#mNumberSettingsBtn')){const top=q('.top');if(top){const b=document.createElement('button');b.id='mNumberSettingsBtn';b.type='button';b.title='إعدادات الأرقام';b.textContent='⚙';const badge=q('#roundBadge');top.insertBefore(b,badge||null);b.onclick=()=>{fill();q('#mNumberSettings')?.classList.add('show')}}}
    if(!q('#mNumberSettings')){
      const box=document.createElement('div');box.id='mNumberSettings';box.innerHTML='<div class="mnsCard"><div class="mnsHead"><div><div class="mnsTitle">إعدادات أرقام الكفوف</div><div class="mnsSub">تحكم بالمكان والشكل والحركة والحجم والألوان — الحفظ دائم على هذا الجهاز</div></div><button class="mnsClose" type="button">×</button></div><div class="mnsGrid"><div class="mnsField"><label>مكان الرقم</label><select id="mnsPos"><option value="bottom">أسفل الكف</option><option value="top">فوق الكف</option><option value="right">يمين الكف</option><option value="left">يسار الكف</option><option value="strip">شريط سفلي</option><option value="image">نمط الصورة</option><option value="custom">مخصص</option></select></div><div class="mnsField"><label>شكل الرقم</label><select id="mnsShape"><option value="pill">كبسولة</option><option value="circle">دائري</option><option value="square">مربع</option><option value="plain">بدون خلفية</option></select></div><div class="mnsField"><label>حركة الرقم</label><select id="mnsMotion"><option value="none">ثابت</option><option value="pulse">نبض</option><option value="float">طفو</option><option value="bounce">ارتداد خفيف</option><option value="glow">توهج</option><option value="shine">لمعة</option></select></div><div class="mnsField"><label>الحجم <span id="mnsSizeVal" class="mnsValue"></span></label><input id="mnsSize" type="range" min="34" max="90" step="1"></div><div class="mnsField"><label>لون الرقم</label><div class="mnsRow"><input id="mnsColor" type="color"><span class="mnsValue">النص</span></div></div><div class="mnsField"><label>لون الخلفية</label><div class="mnsRow"><input id="mnsBg" type="color"><label class="mnsCheck"><input id="mnsTransparent" type="checkbox"> شفافة</label></div></div><div class="mnsField"><label>تحريك أفقي <span id="mnsXVal" class="mnsValue"></span></label><input id="mnsX" type="range" min="-120" max="120" step="1"></div><div class="mnsField"><label>تحريك عمودي <span id="mnsYVal" class="mnsValue"></span></label><input id="mnsY" type="range" min="-120" max="120" step="1"></div></div><label class="mnsCheck" style="margin-top:12px"><input id="mnsVisible" type="checkbox"> إظهار أرقام الكفوف</label><div class="mnsPreview"><div id="mnsPreviewNum">1</div></div><div class="mnsActions"><button id="mnsSave" type="button">حفظ</button><button id="mnsApply" type="button">معاينة</button><button id="mnsReset" type="button">إرجاع الافتراضي</button></div><div id="mnsToast"></div></div>';
      document.body.appendChild(box);box.querySelector('.mnsClose').onclick=()=>box.classList.remove('show');box.addEventListener('click',e=>{if(e.target===box)box.classList.remove('show')});
      ['#mnsVisible','#mnsPos','#mnsShape','#mnsMotion','#mnsSize','#mnsColor','#mnsBg','#mnsTransparent','#mnsX','#mnsY'].forEach(sel=>q(sel)?.addEventListener('input',read));
      q('#mnsApply').onclick=()=>{read();toast('تم تطبيق المعاينة')};q('#mnsSave').onclick=()=>{read();localStorage.setItem(KEY,JSON.stringify(state));toast('تم حفظ إعدادات الأرقام')};q('#mnsReset').onclick=()=>{state={...defaults};fill();apply();localStorage.setItem(KEY,JSON.stringify(state));toast('تمت إعادة الإعدادات الافتراضية')};
    }
    fill();
  }
  function boot(){ui();apply()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',()=>{ui();apply()});
})();