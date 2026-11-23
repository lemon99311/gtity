

/* =============================================================================
   R4 · 「业务配置集」切换器落位到顶栏人员信息左侧
   -----------------------------------------------------------------------------
   需求：把右下角悬浮的「业务」胶囊，移动到顶栏 .top-actions .user-chip
         （档案中心 · 维护岗 / 管理员）的左边，垂直与人员信息居中对齐。

   实现方式（保持既有红线）：
     · 不把节点搬进 header。切换器仍由原切换器层挂 body、仍 position:fixed；
       本层只在运行时读取人员信息的视口几何，用 inline left/top 定位过去。
       #main.innerHTML 与切换器层 DOM 一字不动，默认态 DOM 证据不破。
     · 面板改为从胶囊下方向右对齐展开（顶栏靠上，原「向上弹出」会被视口上沿裁掉）。
     · 降级：极窄窗口 / 人员信息隐藏（纯列表全宽框架）/ 左侧撞上 logo+面包屑
       → 清除内联样式，回到原右下角，保证永远可点。
     · 重算时机：DOMContentLoaded / setTimeout(0) / resize / 捕获滚动 /
       body 子树与 class 变化（框架显隐、业务集切换后的重绘）。
     · 观察器用 rAF 合并，且只观察 class 属性，不观察 style；写入自身 inline
       style 不会触发回调，避免 MutationObserver 自激占满主线程。
     · 本 script 段无 id，动态 style 节点也无 id，script[id] 序列不变。
   ============================================================================= */
(function(){
  var W=window, D=document, STYLE_ATTR='data-wl-set-pos-style';
  var ST={ installed:true, version:'v12', runs:0, placed:0, fallback:0,
    reason:'init', mode:'init', anchor:null, pager:null, lastError:'' };

  var CSS=[
    /* 顶栏落位：面板改为从胶囊下方、右对齐展开，避免被视口上沿裁掉 */
    '#wlSetSwitch[data-wl-set-pos="1"] .wlset-panel{top:44px!important;',
    '  bottom:auto!important;right:0!important;left:auto!important;transform:none!important}',
    '#wlSetSwitch[data-wl-set-pos="1"] .wlset-pill{white-space:nowrap}',
    '@media (max-width:900px){#wlSetSwitch .wlset-name{max-width:88px}}'
  ].join('\n');

  function injectStyle(){
    if(D.querySelector('style['+STYLE_ATTR+']'))return;
    var s=D.createElement('style'); s.setAttribute(STYLE_ATTR,'1'); s.textContent=CSS;
    (D.head||D.documentElement).appendChild(s);
  }
  function wrap(){ return D.getElementById('wlSetSwitch'); }
  function userChip(){ return D.querySelector('.top-actions .user-chip'); }
  function pager(){ return D.getElementById('tplPager'); }
  function clear(w){
    if(!w)return;
    w.style.left=w.style.top=w.style.right=w.style.bottom='';
    w.removeAttribute('data-wl-set-pos');
    ST.mode='corner';
  }
  function apply(w,left,top,reason){
    w.style.right='auto'; w.style.bottom='auto';
    w.style.left=Math.round(left)+'px'; w.style.top=Math.round(top)+'px';
    w.setAttribute('data-wl-set-pos','1');
    ST.placed++; ST.reason=reason; ST.mode='topbar';
  }
  /* 胶囊目标矩形是否撞上顶栏左侧的 logo / 面包屑 */
  function hitsTopbar(box){
    var hdr=D.querySelector('header.topbar');
    if(!hdr)return false;
    var kids=[].slice.call(hdr.querySelectorAll('.logo,.crumb')), i, b;
    for(i=0;i<kids.length;i++){
      b=kids[i].getBoundingClientRect();
      if(!b.width||!b.height)continue;
      if(b.right>box.left && b.left<box.right && b.bottom>box.top && b.top<box.bottom)return true;
    }
    return false;
  }
  function place(){
    ST.runs++;
    var w=wrap(), u=userChip();
    if(!w){ ST.reason='no-wrap'; return; }
    var wW=w.offsetWidth, wH=w.offsetHeight;
    if(!wW||!wH){ ST.reason='wrap-not-laid-out'; return; }
    if(!u || !u.isConnected){ clear(w); ST.reason='no-user-chip'; ST.fallback++; return; }
    var r=u.getBoundingClientRect();
    if(!r.width||!r.height){ clear(w); ST.reason='user-chip-hidden'; ST.fallback++; return; }
    ST.anchor={ left:Math.round(r.left), top:Math.round(r.top),
      width:Math.round(r.width), height:Math.round(r.height),
      centerY:Math.round(r.top+r.height/2) };
    var pg=pager();
    if(pg && pg.isConnected){
      var pr=pg.getBoundingClientRect();
      ST.pager={ left:Math.round(pr.left), top:Math.round(pr.top),
        width:Math.round(pr.width), height:Math.round(pr.height),
        centerX:Math.round(pr.left+pr.width/2), centerY:Math.round(pr.top+pr.height/2) };
    }
    if(W.innerWidth<760){ clear(w); ST.reason='narrow'; ST.fallback++; return; }
    var gap=10, left=r.left-wW-gap, top=r.top+(r.height-wH)/2;
    var box={left:left,right:left+wW,top:top,bottom:top+wH};
    if(left<8 || top<0 || hitsTopbar(box)){
      clear(w); ST.reason='narrow-or-crowded'; ST.fallback++; ST.mode='corner'; return;
    }
    apply(w,left,top,'topbar-left');
  }
  W.__WL_SET_POS__=function(){
    var w=wrap(), pg=pager(), u=userChip(), out={ installed:ST.installed,
      version:ST.version, runs:ST.runs, placed:ST.placed, fallback:ST.fallback,
      reason:ST.reason, mode:ST.mode, anchor:ST.anchor, pager:ST.pager,
      inMain:!!(w&&w.closest&&w.closest('#main')),
      parent:w?w.parentElement.tagName:null,
      cssNode:!!D.querySelector('style['+STYLE_ATTR+']'), lastError:ST.lastError };
    try{
      if(w){ var b=w.getBoundingClientRect(); out.wrap={ left:Math.round(b.left),
        top:Math.round(b.top), width:Math.round(b.width), height:Math.round(b.height),
        right:Math.round(b.right), bottom:Math.round(b.bottom),
        centerX:Math.round(b.left+b.width/2), centerY:Math.round(b.top+b.height/2),
        position:getComputedStyle(w).position }; }
      if(u){ var ur=u.getBoundingClientRect(); out.userChip={ left:Math.round(ur.left),
        top:Math.round(ur.top), width:Math.round(ur.width), height:Math.round(ur.height),
        centerY:Math.round(ur.top+ur.height/2) };
        if(out.wrap)out.gap=Math.round(ur.left-out.wrap.right); }
      if(pg){ var rr=pg.getBoundingClientRect(); out.pagerNow={
        centerX:Math.round(rr.left+rr.width/2), centerY:Math.round(rr.top+rr.height/2),
        width:Math.round(rr.width), height:Math.round(rr.height) }; }
    }catch(e){ out.lastError=String(e); }
    return out;
  };
  var busy=false, raf=0, mo=null;
  function run(){ if(busy)return; busy=true; try{ place(); }catch(e){ ST.lastError=String(e); } busy=false; }
  function schedule(){
    if(raf)return;
    var tick=function(){ raf=0; if(mo){ try{ mo.takeRecords(); }catch(e){} } run(); };
    raf=W.requestAnimationFrame?W.requestAnimationFrame(tick):W.setTimeout(tick,16);
  }

  injectStyle();
  if(D.readyState==='loading') D.addEventListener('DOMContentLoaded',run);
  else run();
  W.setTimeout(run,0);
  W.addEventListener('resize',schedule);
  W.addEventListener('scroll',schedule,true);
  if(W.MutationObserver){
    try{
      mo=new MutationObserver(function(){ schedule(); });
      mo.observe(D.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    }catch(e){ ST.lastError=String(e); }
  }
})();
